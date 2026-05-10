from rest_framework import serializers

from .models import APIKey


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = [
            "id",
            "name",
            "key",
            "tier",
            "is_active",
            "created_at",
            "last_used_at",
        ]
        read_only_fields = ["id", "key", "is_active", "created_at", "last_used_at"]


class APIKeyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ["id", "name", "key", "tier", "is_active", "created_at", "last_used_at"]
        read_only_fields = ["id", "key", "is_active", "created_at", "last_used_at"]


class UsageStatSerializer(serializers.Serializer):
    api_key_id = serializers.IntegerField()
    api_key_name = serializers.CharField()
    endpoint = serializers.CharField()
    day = serializers.DateField()
    request_count = serializers.IntegerField()
