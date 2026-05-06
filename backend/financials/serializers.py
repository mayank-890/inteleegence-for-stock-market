from rest_framework import serializers
from .models import FactProfitLoss

class ProfitLossSerializer(serializers.ModelSerializer):
    class Meta:
        model = FactProfitLoss
        fields = [
            "year_id",
            "revenue",
            "net_profit"
        ]