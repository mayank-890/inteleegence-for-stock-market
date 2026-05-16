from rest_framework import serializers
from .models import FactBalanceSheet, FactCashFlow, FactProfitLoss


class FactProfitLossSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="year.fiscal_year", read_only=True)
    company_symbol = serializers.CharField(source="company.ticker_symbol", read_only=True)
    company_name = serializers.CharField(source="company.company_name", read_only=True)

    class Meta:
        model = FactProfitLoss
        fields = [
            "company_symbol",
            "company_name",
            "year",
            "revenue",
            "total_income",
            "profit_before_tax",
            "profit_after_tax",
            "basic_eps",
        ]


class FactBalanceSheetSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="year.fiscal_year", read_only=True)
    company_symbol = serializers.CharField(source="company.ticker_symbol", read_only=True)
    company_name = serializers.CharField(source="company.company_name", read_only=True)

    class Meta:
        model = FactBalanceSheet
        fields = [
            "company_symbol",
            "company_name",
            "year",
            "share_capital",
            "reserves_and_surplus",
            "total_equity",
            "long_term_borrowings",
            "short_term_borrowings",
            "total_liabilities",
            "total_assets",
        ]


class FactCashFlowSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="year.fiscal_year", read_only=True)
    company_symbol = serializers.CharField(source="company.ticker_symbol", read_only=True)
    company_name = serializers.CharField(source="company.company_name", read_only=True)

    class Meta:
        model = FactCashFlow
        fields = [
            "company_symbol",
            "company_name",
            "year",
            "cash_flow_from_operating_activities",
            "cash_flow_from_investing_activities",
            "cash_flow_from_financing_activities",
            "net_increase_in_cash",
            "opening_cash_and_cash_equivalents",
            "closing_cash_and_cash_equivalents",
        ]