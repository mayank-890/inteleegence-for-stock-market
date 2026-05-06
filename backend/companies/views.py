import time
from decimal import Decimal, InvalidOperation

from django.db.models import Case, DecimalField, ExpressionWrapper, F, Q, Value, When
from django.db.models.functions import Coalesce
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from financials.models import FactProfitLoss
from financials.serializers import ProfitLossSerializer

from .authentication import HMACAuthentication
from .models import APIUsageLog, DimCompany, PartnerAccount
from .serializers import CompanySerializer
from .throttling import PartnerRateThrottle


class CompanyDetailView(APIView):
    def get(self, request, symbol):
        try:
            company = DimCompany.objects.get(ticker_symbol=symbol)
            profit_loss = FactProfitLoss.objects.filter(
                company_id=company.company_id,
            ).order_by("-year_id")[:5]

            return Response(
                {
                    "status": "success",
                    "data": {
                        "company": CompanySerializer(company).data,
                        "profit_loss": ProfitLossSerializer(profit_loss, many=True).data,
                    },
                }
            )
        except Exception as exc:
            return Response(
                {
                    "status": "error",
                    "message": str(exc),
                }
            )


class ScreenerQueryMixin:
    page_size = 10
    max_results = 50
    allowed_sort_fields = {
        "analysis_records__roe_pct": "analysis_records__roe_pct",
        "analysis_records__de_ratio": "screener_de_ratio",
        "company_name": "company_name",
    }
    default_sort_by = "analysis_records__roe_pct"
    default_order = "desc"

    def build_screener_queryset(self, request):
        min_roe = self._to_decimal(request.GET.get("min_roe"), "min_roe")
        max_de = self._to_decimal(request.GET.get("max_de"), "max_de")
        sector = request.GET.get("sector")
        sort_by = request.GET.get("sort_by", self.default_sort_by)
        order = request.GET.get("order", self.default_order)

        query = Q()
        annotations = self._debt_to_equity_annotations()

        if min_roe is not None:
            query &= Q(analysis_records__roe_pct__gte=min_roe)

        if max_de is not None:
            query &= Q(balance_sheet_records__total_equity__gt=0)
            query &= Q(screener_de_ratio__lte=max_de)

        if sector:
            query &= Q(sector__sector_name=sector)

        sort_field = self.allowed_sort_fields.get(
            sort_by,
            self.allowed_sort_fields[self.default_sort_by],
        )
        ordering = self._ordering(sort_field, order)

        return (
            DimCompany.objects.select_related("sector")
            .prefetch_related("analysis_records")
            .annotate(**annotations)
            .filter(query)
            .distinct()
            .order_by(ordering, "company_id")
        )[: self.max_results]

    def paginate_companies(self, queryset, request):
        paginator = PageNumberPagination()
        paginator.page_size = self.page_size
        page = paginator.paginate_queryset(queryset, request)
        serializer = CompanySerializer(page, many=True)
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

    @classmethod
    def _ordering(cls, sort_field, order):
        if order == "desc":
            return f"-{sort_field}"
        return sort_field

    def _to_decimal(self, value, field_name):
        try:
            return Decimal(value) if value not in (None, "") else None
        except (InvalidOperation, TypeError, ValueError):
            return None


class ScreenerView(ScreenerQueryMixin, APIView):
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


class PartnerScreenerView(PartnerLoggingMixin, ScreenerQueryMixin, APIView):
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
