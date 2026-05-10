import time
from decimal import Decimal, InvalidOperation

from django.db.models import Case, DecimalField, ExpressionWrapper, F, OuterRef, Prefetch, Q, Subquery, Value, When
from django.db.models.functions import Coalesce
from rest_framework import generics
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from financials.models import FactBalanceSheet, FactCashFlow, FactProfitLoss

from .authentication import HMACAuthentication
from .models import APIUsageLog, DimCompany, PartnerAccount
from .pagination import CompanyPagination
from .serializers import CompanyDetailSerializer, CompanyListSerializer
from .throttling import PartnerRateThrottle


class CompanyQueryMixin:
    def company_detail_queryset(self):
        profit_loss_queryset = FactProfitLoss.objects.select_related("year", "company").order_by(
            "-year__fiscal_year",
            "-year_id",
        )
        balance_sheet_queryset = FactBalanceSheet.objects.select_related("year", "company").order_by(
            "-year__fiscal_year",
            "-year_id",
        )
        cash_flow_queryset = FactCashFlow.objects.select_related("year", "company").order_by(
            "-year__fiscal_year",
            "-year_id",
        )

        return DimCompany.objects.select_related("sector").prefetch_related(
            Prefetch(
                "profit_loss_records",
                queryset=profit_loss_queryset,
                to_attr="prefetched_profit_loss",
            ),
            Prefetch(
                "balance_sheet_records",
                queryset=balance_sheet_queryset,
                to_attr="prefetched_balance_sheets",
            ),
            Prefetch(
                "cash_flow_records",
                queryset=cash_flow_queryset,
                to_attr="prefetched_cash_flows",
            ),
        )


class CompanyDetailView(CompanyQueryMixin, APIView):
    def get(self, request, symbol):
        company = self.company_detail_queryset().filter(ticker_symbol=symbol).first()
        if company is None:
            raise NotFound("Company not found.")

        serializer = CompanyDetailSerializer(company)
        return Response(serializer.data)


class CompanyListView(generics.ListAPIView):
    serializer_class = CompanyListSerializer
    pagination_class = CompanyPagination

    def get_queryset(self):
        queryset = DimCompany.objects.select_related("sector").all()

        sector = self.request.query_params.get("sector")
        ticker = self.request.query_params.get("ticker")
        company_name = self.request.query_params.get("company_name")
        ordering = self.request.query_params.get("ordering", "company_name")

        if sector:
            queryset = queryset.filter(sector__sector_name__iexact=sector)
        if ticker:
            queryset = queryset.filter(ticker_symbol__icontains=ticker)
        if company_name:
            queryset = queryset.filter(company_name__icontains=company_name)

        allowed_ordering = {"company_name", "-company_name", "ticker_symbol", "-ticker_symbol"}
        if ordering not in allowed_ordering:
            raise ValidationError("Invalid ordering field.")

        return queryset.order_by(ordering, "company_id")


class ScreenerQueryMixin:
    page_size = CompanyPagination.page_size
    max_results = 100
    allowed_sort_fields = {
        "analysis_records__roe_pct": "analysis_records__roe_pct",
        "analysis_records__de_ratio": "screener_de_ratio",
        "analysis_records__compounded_sales_growth_pct": "analysis_records__compounded_sales_growth_pct",
        "company_name": "company_name",
    }
    default_sort_by = "analysis_records__roe_pct"
    default_order = "desc"

    def build_screener_queryset(self, request):
        min_roe = self._to_decimal_param(request.query_params.get("min_roe"), "min_roe")
        max_de = self._to_decimal_param(request.query_params.get("max_de"), "max_de")
        min_sales_growth = self._to_decimal_param(
            request.query_params.get("min_sales_growth"),
            "min_sales_growth",
        )
        sector = request.query_params.get("sector")
        sort_by = request.query_params.get("sort_by", self.default_sort_by)
        order = request.query_params.get("order", self.default_order)

        if sort_by not in self.allowed_sort_fields:
            raise ValidationError("Invalid sort_by field.")
        if order not in {"asc", "desc"}:
            raise ValidationError("Invalid order value.")

        query = Q()
        annotations = {
            **self._debt_to_equity_annotations(),
            **self._latest_profit_loss_annotations(),
        }

        if min_roe is not None:
            query &= Q(analysis_records__roe_pct__gte=min_roe)
        if max_de is not None:
            query &= Q(balance_sheet_records__total_equity__gt=0)
            query &= Q(screener_de_ratio__lte=max_de)
        if min_sales_growth is not None:
            query &= Q(analysis_records__compounded_sales_growth_pct__gte=min_sales_growth)
        if sector:
            query &= Q(sector__sector_name__iexact=sector)

        ordering = self._ordering(self.allowed_sort_fields[sort_by], order)

        return (
            DimCompany.objects.select_related("sector")
            .prefetch_related("analysis_records")
            .annotate(**annotations)
            .filter(query)
            .distinct()
            .order_by(ordering, "company_id")
        )[: self.max_results]

    def paginate_companies(self, queryset, request):
        paginator = CompanyPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = CompanyListSerializer(page, many=True)
        return paginator, serializer

    @classmethod
    def _debt_to_equity_annotations(cls):
        money_field = DecimalField(max_digits=24, decimal_places=4)
        ratio_field = DecimalField(max_digits=18, decimal_places=6)
        total_debt = ExpressionWrapper(
            Coalesce(
                F("balance_sheet_records__long_term_borrowings"),
                Value(0),
                output_field=money_field,
            )
            + Coalesce(
                F("balance_sheet_records__short_term_borrowings"),
                Value(0),
                output_field=money_field,
            ),
            output_field=money_field,
        )

        return {
            "screener_total_debt": total_debt,
            "screener_de_ratio": Case(
                When(
                    balance_sheet_records__total_equity__gt=0,
                    then=ExpressionWrapper(
                        total_debt / F("balance_sheet_records__total_equity"),
                        output_field=ratio_field,
                    ),
                ),
                default=None,
                output_field=ratio_field,
            ),
        }

    @staticmethod
    def _latest_profit_loss_annotations():
        latest_profit_loss = FactProfitLoss.objects.filter(company=OuterRef("pk")).order_by("-year__fiscal_year")
        return {
            "latest_year": Subquery(latest_profit_loss.values("year__fiscal_year")[:1]),
            "latest_revenue": Subquery(latest_profit_loss.values("revenue")[:1]),
            "latest_profit_after_tax": Subquery(latest_profit_loss.values("profit_after_tax")[:1]),
            "latest_basic_eps": Subquery(latest_profit_loss.values("basic_eps")[:1]),
        }

    @staticmethod
    def _ordering(sort_field, order):
        if order == "desc":
            return f"-{sort_field}"
        return sort_field

    @staticmethod
    def _to_decimal_param(value, field_name):
        if value in (None, ""):
            return None
        try:
            return Decimal(value)
        except (InvalidOperation, TypeError, ValueError) as exc:
            raise ValidationError(f"Invalid value for {field_name}.") from exc


class ScreenerView(APIView, ScreenerQueryMixin):
    def get(self, request):
        queryset = self.build_screener_queryset(request)
        paginator, serializer = self.paginate_companies(queryset, request)

        return paginator.get_paginated_response(
            {
                "status": "success",
                "data": serializer.data,
            }
        )


class PartnerLoggingMixin:
    def dispatch(self, request, *args, **kwargs):
        started_at = time.perf_counter()
        response = super().dispatch(request, *args, **kwargs)
        self._log_partner_request(request, response.status_code, started_at)
        return response

    def _log_partner_request(self, request, status_code, started_at):
        partner = self._resolve_partner_for_log(request)
        if partner is None:
            return

        try:
            APIUsageLog.objects.create(
                partner=partner,
                endpoint=request.path,
                method=request.method.upper(),
                status_code=status_code,
                response_time_ms=max(0, int((time.perf_counter() - started_at) * 1000)),
            )
        except Exception:
            return

    @staticmethod
    def _resolve_partner_for_log(request):
        user = getattr(request, "user", None)
        if isinstance(user, PartnerAccount):
            return user

        key_id = request.headers.get("X-API-Key-ID")
        if not key_id:
            return None

        try:
            return PartnerAccount.objects.filter(key_id=key_id).first()
        except Exception:
            return None


class PartnerScreenerView(PartnerLoggingMixin, APIView, ScreenerQueryMixin):
    authentication_classes = [HMACAuthentication]
    throttle_classes = [PartnerRateThrottle]

    def get(self, request):
        queryset = self.build_screener_queryset(request)
        paginator, serializer = self.paginate_companies(queryset, request)
        paginated_response = paginator.get_paginated_response(
            {
                "status": "success",
                "data": serializer.data,
            }
        )
        paginated_response.data = {
            "status": "success",
            "data": paginated_response.data["results"]["data"],
        }
        return paginated_response
