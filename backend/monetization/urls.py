from django.urls import path

from .views import APIKeyDeleteView, APIKeyListCreateView, PlansView, UsageStatsView


app_name = "monetization"

urlpatterns = [
    path("keys/", APIKeyListCreateView.as_view(), name="keys"),
    path("keys/<int:pk>/", APIKeyDeleteView.as_view(), name="key-detail"),
    path("usage/", UsageStatsView.as_view(), name="usage"),
    path("plans/", PlansView.as_view(), name="plans"),
]

