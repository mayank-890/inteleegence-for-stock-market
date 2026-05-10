import django_filters
from django.db.models import Q

from .models import FactBalanceSheet, FactCashFlow, FactProfitLoss


class BaseFactFilterSet(django_filters.FilterSet):
    company = django_filters.CharFilter(method="filter_company")
    year = django_filters.NumberFilter(field_name="year__fiscal_year")
    year_min = django_filters.NumberFilter(field_name="year__fiscal_year", lookup_expr="gte")
    year_max = django_filters.NumberFilter(field_name="year__fiscal_year", lookup_expr="lte")

    def filter_company(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(company__ticker_symbol__iexact=value) | Q(company__company_name__iexact=value)
        )


class FactProfitLossFilterSet(BaseFactFilterSet):
    class Meta:
        model = FactProfitLoss
        fields = ["company", "year", "year_min", "year_max"]


class FactBalanceSheetFilterSet(BaseFactFilterSet):
    class Meta:
        model = FactBalanceSheet
        fields = ["company", "year", "year_min", "year_max"]


class FactCashFlowFilterSet(BaseFactFilterSet):
    class Meta:
        model = FactCashFlow
        fields = ["company", "year", "year_min", "year_max"]
