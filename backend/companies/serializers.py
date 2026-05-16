from rest_framework import serializers

from financials.serializers import (
    FactBalanceSheetSerializer,
    FactCashFlowSerializer,
    FactProfitLossSerializer,
)

from .models import DimCompany


class CompanyListSerializer(serializers.ModelSerializer):
    sector_name = serializers.CharField(source="sector.sector_name", read_only=True)
    revenue = serializers.SerializerMethodField()
    profit_after_tax = serializers.SerializerMethodField()
    basic_eps = serializers.SerializerMethodField()
    latest_year = serializers.SerializerMethodField()

    class Meta:
        model = DimCompany
        fields = [
            "company_id",
            "company_name",
            "ticker_symbol",
            "sector_name",
            "latest_year",
            "revenue",
            "profit_after_tax",
            "basic_eps",
        ]

    @staticmethod
    def _as_float(value):
        if value is None:
            return None
        return float(value)

    def get_revenue(self, obj):
        return self._as_float(getattr(obj, "latest_revenue", None))

    def get_profit_after_tax(self, obj):
        return self._as_float(getattr(obj, "latest_profit_after_tax", None))

    def get_basic_eps(self, obj):
        return self._as_float(getattr(obj, "latest_basic_eps", None))

    def get_latest_year(self, obj):
        return getattr(obj, "latest_year", None)


class CompanyDetailSerializer(serializers.ModelSerializer):
    sector_name = serializers.CharField(source="sector.sector_name", read_only=True)
    nse_symbol = serializers.CharField(read_only=True)
    profit_loss = FactProfitLossSerializer(
        source="prefetched_profit_loss", many=True, read_only=True
    )
    balance_sheet = FactBalanceSheetSerializer(
        source="prefetched_balance_sheets", many=True, read_only=True
    )
    cash_flow = FactCashFlowSerializer(
        source="prefetched_cash_flows", many=True, read_only=True
    )

    class Meta:
        model = DimCompany
        fields = [
            "company_name",
            "ticker_symbol",
            "sector_name",
            "nse_symbol",
            "profit_loss",
            "balance_sheet",
            "cash_flow",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            "company": {
                "name": data["company_name"],
                "ticker": data["ticker_symbol"],
                "sector": data["sector_name"],
                "nse_symbol": data["nse_symbol"],
            },
            "profit_loss": data["profit_loss"],
            "balance_sheet": data["balance_sheet"],
            "cash_flow": data["cash_flow"],
        }


CompanySerializer = CompanyListSerializer