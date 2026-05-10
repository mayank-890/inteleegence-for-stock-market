from django.urls import include, path
from rest_framework.routers import DefaultRouter

from financials.views import FactBalanceSheetViewSet, FactCashFlowViewSet, FactProfitLossViewSet
from .views import CompanyDetailView, CompanyListView, PartnerScreenerView, ScreenerView

app_name = "companies"

router = DefaultRouter()
router.register(r"profit-loss", FactProfitLossViewSet, basename="profit-loss")
router.register(r"balance-sheet", FactBalanceSheetViewSet, basename="balance-sheet")
router.register(r"cash-flow", FactCashFlowViewSet, basename="cash-flow")

urlpatterns = [
    path("v1/", include(router.urls)),
    path("v1/screener/", ScreenerView.as_view()),
    path("v1/companies/", CompanyListView.as_view()),
    path("v1/companies/<str:symbol>/", CompanyDetailView.as_view()),
    path("v1/partner/screener/", PartnerScreenerView.as_view()),
    path("partner/v1/screener/", PartnerScreenerView.as_view()),
]
