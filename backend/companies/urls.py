from django.urls import path

from .views import CompanyDetailView, PartnerScreenerView, ScreenerView


urlpatterns = [
    path("v1/screener/", ScreenerView.as_view()),
    path("v1/companies/<str:symbol>/", CompanyDetailView.as_view()),
    path("partner/v1/screener/", PartnerScreenerView.as_view()),
]
