from rest_framework import serializers
from .models import DimCompany

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = DimCompany
        fields = [
            "company_id",
            "company_name",
            "ticker_symbol",
            "sector"
        ]