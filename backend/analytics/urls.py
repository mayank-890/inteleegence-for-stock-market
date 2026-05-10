from django.urls import path

from .views import (
    AnomaliesView,
    EPSGrowthView,
    ProfitMarginView,
    RevenueTrendView,
    ScreenerScoreView,
)


app_name = "analytics"

urlpatterns = [
    path("revenue-trend/", RevenueTrendView.as_view(), name="revenue-trend"),
    path("profit-margin/", ProfitMarginView.as_view(), name="profit-margin"),
    path("eps-growth/", EPSGrowthView.as_view(), name="eps-growth"),
    path("anomalies/", AnomaliesView.as_view(), name="anomalies"),
    path("screener-score/", ScreenerScoreView.as_view(), name="screener-score"),
]
