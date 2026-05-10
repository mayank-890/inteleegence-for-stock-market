from rest_framework import serializers

from .models import FactBalanceSheet, FactCashFlow, FactProfitLoss


class NullableFloatField(serializers.Field):
    def to_representation(self, value):
        if value is None:
            return None
        return float(value)


class ProfitLossSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="year.fiscal_year", read_only=True)
    revenue = NullableFloatField(source="revenue", read_only=True)
    total_income = NullableFloatField(source="total_income", read_only=True)
    profit_before_tax = NullableFloatField(source="profit_before_tax", read_only=True)
    profit_after_tax = NullableFloatField(source="profit_after_tax", read_only=True)
    eps = NullableFloatField(source="basic_eps", read_only=True)

    class Meta:
        model = FactProfitLoss
        fields = [
            "year",
            "revenue",
            "total_income",
            "profit_before_tax",
            "profit_after_tax",
            "eps",
        ]


class FactProfitLossSerializer(ProfitLossSerializer):
    company_symbol = serializers.CharField(source="company.ticker_symbol", read_only=True)
    company_name = serializers.CharField(source="company.company_name", read_only=True)

    class Meta(ProfitLossSerializer.Meta):
        fields = [
            "company_symbol",
            "company_name",
            *ProfitLossSerializer.Meta.fields,
        ]


class BalanceSheetSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="year.fiscal_year", read_only=True)
    share_capital = NullableFloatField(source="share_capital", read_only=True)
    reserves_and_surplus = NullableFloatField(source="reserves_and_surplus", read_only=True)
    total_equity = NullableFloatField(source="total_equity", read_only=True)
    long_term_borrowings = NullableFloatField(source="long_term_borrowings", read_only=True)
    short_term_borrowings = NullableFloatField(source="short_term_borrowings", read_only=True)
    total_liabilities = NullableFloatField(source="total_liabilities", read_only=True)
    total_assets = NullableFloatField(source="total_assets", read_only=True)

    class Meta:
        model = FactBalanceSheet
        fields = [
            "year",
            "share_capital",
            "reserves_and_surplus",
            "total_equity",
            "long_term_borrowings",
            "short_term_borrowings",
            "total_liabilities",
            "total_assets",
        ]


class FactBalanceSheetSerializer(BalanceSheetSerializer):
    company_symbol = serializers.CharField(source="company.ticker_symbol", read_only=True)
    company_name = serializers.CharField(source="company.company_name", read_only=True)

    class Meta(BalanceSheetSerializer.Meta):
        fields = [
            "company_symbol",
            "company_name",
            *BalanceSheetSerializer.Meta.fields,
        ]


class CashFlowSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="year.fiscal_year", read_only=True)
    cash_flow_from_operating_activities = NullableFloatField(
        source="cash_flow_from_operating_activities",
        read_only=True,
    )
    cash_flow_from_investing_activities = NullableFloatField(
        source="cash_flow_from_investing_activities",
        read_only=True,
    )
    cash_flow_from_financing_activities = NullableFloatField(
        source="cash_flow_from_financing_activities",
        read_only=True,
    )
    net_increase_in_cash = NullableFloatField(source="net_increase_in_cash", read_only=True)
    opening_cash_and_cash_equivalents = NullableFloatField(
        source="opening_cash_and_cash_equivalents",
        read_only=True,
    )
    closing_cash_and_cash_equivalents = NullableFloatField(
        source="closing_cash_and_cash_equivalents",
        read_only=True,
    )

    class Meta:
        model = FactCashFlow
        fields = [
            "year",
            "cash_flow_from_operating_activities",
            "cash_flow_from_investing_activities",
            "cash_flow_from_financing_activities",
            "net_increase_in_cash",
            "opening_cash_and_cash_equivalents",
            "closing_cash_and_cash_equivalents",
        ]


class FactCashFlowSerializer(CashFlowSerializer):
    company_symbol = serializers.CharField(source="company.ticker_symbol", read_only=True)
    company_name = serializers.CharField(source="company.company_name", read_only=True)

    class Meta(CashFlowSerializer.Meta):
        fields = [
            "company_symbol",
            "company_name",
            *CashFlowSerializer.Meta.fields,
        ]
