import secrets

from django.conf import settings
from django.db import models


class APIKey(models.Model):
    class Tier(models.TextChoices):
        FREE = "free", "Free"
        BASIC = "basic", "Basic"
        PRO = "pro", "Pro"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="api_keys")
    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=100)
    tier = models.CharField(max_length=20, choices=Tier.choices, default=Tier.FREE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user_id}:{self.name}"


class APIUsageLog(models.Model):
    api_key = models.ForeignKey(APIKey, on_delete=models.CASCADE, related_name="usage_logs")
    endpoint = models.CharField(max_length=200)
    method = models.CharField(max_length=10)
    response_code = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["api_key", "timestamp"]),
            models.Index(fields=["endpoint", "timestamp"]),
        ]

    def __str__(self) -> str:
        return f"{self.api_key_id}:{self.method}:{self.endpoint}"

