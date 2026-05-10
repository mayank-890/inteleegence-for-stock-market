from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets

from .filters import (
    FactBalanceSheetFilterSet,
    FactCashFlowFilterSet,
    FactProfitLossFilterSet,
)
from .models import FactBalanceSheet, FactCashFlow, FactProfitLoss
from .serializers import (
    FactBalanceSheetSerializer,
    FactCashFlowSerializer,
    FactProfitLossSerializer,
)


class FactProfitLossViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FactProfitLossSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    filterset_class = FactProfitLossFilterSet
    queryset = FactProfitLoss.objects.select_related("year", "company").all()


class FactBalanceSheetViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FactBalanceSheetSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    filterset_class = FactBalanceSheetFilterSet
    queryset = FactBalanceSheet.objects.select_related("year", "company").all()


class FactCashFlowViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FactCashFlowSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    filterset_class = FactCashFlowFilterSet
    queryset = FactCashFlow.objects.select_related("year", "company").all()
