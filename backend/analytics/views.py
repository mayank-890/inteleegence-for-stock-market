from __future__ import annotations

import pandas as pd
from django.db.models import Q
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from companies.models import DimCompany
from financials.models import FactProfitLoss

from . import ml_engine
from .serializers import (
    AnomaliesResponseSerializer,
    EPSGrowthResponseSerializer,
    ProfitMarginResponseSerializer,
    RevenueTrendResponseSerializer,
    ScreenerScoreResponseSerializer,
)


class BaseAnalyticsView(APIView):
    serializer_class = None
    metric_name = ""

    def get(self, request):
        company_param = request.GET.get("company")
        if not company_param:
            raise ValidationError("Query parameter 'company' is required.")

        company = self._get_company(company_param)
        profit_loss_frame = self._get_profit_loss_frame(company)

        if len(profit_loss_frame) < 3:
            raise ValidationError(
                f"Company '{company.ticker_symbol}' has insufficient data. At least 3 years are required."
            )

        try:
            result = self.compute_metric(profit_loss_frame)
        except ml_engine.InsufficientDataError as exc:
            raise ValidationError(str(exc)) from exc

        payload = {
            "company": company.ticker_symbol,
            "metric": self.metric_name,
            "result": result,
            "computed_at": timezone.now(),
        }
        serializer = self.serializer_class(payload)
        return Response(serializer.data)

    def compute_metric(self, frame: pd.DataFrame) -> dict:
        raise NotImplementedError

    @staticmethod
    def _get_company(company_value: str) -> DimCompany:
        company = (
            DimCompany.objects.select_related("sector")
            .filter(
                Q(ticker_symbol__iexact=company_value)
                | Q(company_name__iexact=company_value)
            )
            .first()
        )
        if company is None:
            raise ValidationError(f"Company '{company_value}' was not found.")
        return company

    @staticmethod
    def _get_profit_loss_frame(company: DimCompany) -> pd.DataFrame:
        queryset = (
            FactProfitLoss.objects.select_related("year", "company")
            .filter(company=company)
            .order_by("year__fiscal_year")
            .values(
                "year__fiscal_year",
                "revenue",
                "profit_after_tax",
                "basic_eps",
            )
        )
        frame = pd.DataFrame.from_records(queryset)
        if frame.empty:
            return pd.DataFrame(columns=["year", "revenue", "profit_after_tax", "basic_eps"])

        return frame.rename(columns={"year__fiscal_year": "year"})


class RevenueTrendView(BaseAnalyticsView):
    serializer_class = RevenueTrendResponseSerializer
    metric_name = "revenue_trend"

    def compute_metric(self, frame: pd.DataFrame) -> dict:
        return ml_engine.compute_revenue_trend(frame)


class ProfitMarginView(BaseAnalyticsView):
    serializer_class = ProfitMarginResponseSerializer
    metric_name = "profit_margin"

    def compute_metric(self, frame: pd.DataFrame) -> dict:
        return ml_engine.compute_profit_margin_analysis(frame)


class EPSGrowthView(BaseAnalyticsView):
    serializer_class = EPSGrowthResponseSerializer
    metric_name = "eps_growth"

    def compute_metric(self, frame: pd.DataFrame) -> dict:
        return ml_engine.compute_eps_growth(frame)


class AnomaliesView(BaseAnalyticsView):
    serializer_class = AnomaliesResponseSerializer
    metric_name = "anomalies"

    def compute_metric(self, frame: pd.DataFrame) -> dict:
        return ml_engine.compute_anomalies(frame)


class ScreenerScoreView(BaseAnalyticsView):
    serializer_class = ScreenerScoreResponseSerializer
    metric_name = "screener_score"

    def compute_metric(self, frame: pd.DataFrame) -> dict:
        return ml_engine.compute_screener_score(frame)

