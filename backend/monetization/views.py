from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import APIKey, APIUsageLog
from .serializers import APIKeyCreateSerializer, APIKeySerializer, UsageStatSerializer


class APIKeyListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    default_tier = APIKey.Tier.FREE

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user).order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return APIKeyCreateSerializer
        return APIKeySerializer

    def perform_create(self, serializer):
        tier = serializer.validated_data.get("tier") or self.default_tier
        serializer.save(user=self.request.user, tier=tier)


class PartnerAPIKeyListCreateView(APIKeyListCreateView):
    default_tier = APIKey.Tier.PRO


class APIKeyDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user)


class UsageStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = (
            APIUsageLog.objects.filter(api_key__user=request.user)
            .annotate(day=TruncDate("timestamp"))
            .values("api_key_id", "api_key__name", "endpoint", "day")
            .annotate(request_count=Count("id"))
            .order_by("api_key__name", "-day", "endpoint")
        )
        queryset = [
            {
                **entry,
                "api_key_name": entry["api_key__name"],
            }
            for entry in queryset
        ]
        serializer = UsageStatSerializer(queryset, many=True)
        return Response({"usage": serializer.data})


class PlansView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "plans": [
                    {
                        "tier": "free",
                        "price": "$0/month",
                        "requests_per_day": 100,
                        "features": ["profit-loss", "balance-sheet"],
                    },
                    {
                        "tier": "basic",
                        "price": "$29/month",
                        "requests_per_day": 1000,
                        "features": [
                            "profit-loss",
                            "balance-sheet",
                            "cash-flow",
                            "analytics",
                        ],
                    },
                    {
                        "tier": "pro",
                        "price": "$99/month",
                        "requests_per_day": 10000,
                        "features": [
                            "all endpoints",
                            "screener",
                            "priority support",
                        ],
                    },
                ]
            },
            status=status.HTTP_200_OK,
        )
