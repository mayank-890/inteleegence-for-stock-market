from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

from .auth_views import RegisterView


def home(request):
    return JsonResponse({"message": "API running"})


urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/v1/auth/token/", obtain_auth_token),
    path("api/v1/auth/register/", RegisterView.as_view()),
    path('api-auth/', include('rest_framework.urls')),
    path("api/v1/analytics/", include(("analytics.urls", "analytics"), namespace="analytics")),
    path(
        "api/v1/monetization/",
        include(("monetization.urls", "monetization"), namespace="monetization"),
    ),
    path(
        "api/partner/v1/monetization/",
        include(("monetization.partner_urls", "partner-monetization"), namespace="partner-monetization"),
    ),
    path("api/", include(("companies.urls", "companies"), namespace="companies")),
]
