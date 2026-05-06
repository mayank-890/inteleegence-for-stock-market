"""Unmanaged Django models for company dimension tables."""

import secrets
import uuid

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import models
from django.utils import timezone


class DimSector(models.Model):
    sector_id = models.BigAutoField(primary_key=True)
    sector_name = models.CharField(max_length=150, unique=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "dim_sector"

    def __str__(self) -> str:
        return self.sector_name


class DimCompany(models.Model):
    company_id = models.BigAutoField(primary_key=True)
    sector = models.ForeignKey(
        "companies.DimSector",
        on_delete=models.RESTRICT,
        db_column="sector_id",
        related_name="companies",
    )
    company_name = models.CharField(max_length=255)
    ticker_symbol = models.CharField(max_length=32, unique=True)
    isin = models.CharField(max_length=12, unique=True, blank=True, null=True)
    nse_symbol = models.CharField(max_length=32, blank=True, null=True)
    bse_code = models.CharField(max_length=16, blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "dim_company"

    def __str__(self) -> str:
        return self.company_name


class PartnerAccount(models.Model):
    class Tier(models.TextChoices):
        BASIC = "BASIC", "Basic"
        PRO = "PRO", "Pro"
        ENTERPRISE = "ENTERPRISE", "Enterprise"

    name = models.CharField(max_length=255)
    key_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    key_secret = models.CharField(max_length=512)
    tier = models.CharField(max_length=20, choices=Tier.choices, default=Tier.BASIC)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "partner_account"

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    def __str__(self) -> str:
        return self.name

    def set_shared_secret(self, raw_secret: str | None = None) -> str:
        secret_value = raw_secret or secrets.token_urlsafe(32)
        self.key_secret = self._fernet().encrypt(secret_value.encode("utf-8")).decode("utf-8")
        return secret_value

    def get_shared_secret(self) -> str:
        try:
            decrypted = self._fernet().decrypt(self.key_secret.encode("utf-8"))
        except InvalidToken as exc:
            raise ImproperlyConfigured("Stored partner secret could not be decrypted.") from exc
        return decrypted.decode("utf-8")

    @classmethod
    def _fernet(cls) -> Fernet:
        key = settings.PARTNER_HMAC_ENCRYPTION_KEY
        if not key:
            raise ImproperlyConfigured("PARTNER_HMAC_ENCRYPTION_KEY is not configured.")
        try:
            return Fernet(key.encode("utf-8"))
        except (TypeError, ValueError) as exc:
            raise ImproperlyConfigured("PARTNER_HMAC_ENCRYPTION_KEY is invalid.") from exc


class APIUsageLog(models.Model):
    partner = models.ForeignKey(
        PartnerAccount,
        on_delete=models.CASCADE,
        related_name="usage_logs",
    )
    endpoint = models.CharField(max_length=500)
    method = models.CharField(max_length=10)
    status_code = models.PositiveSmallIntegerField()
    response_time_ms = models.PositiveIntegerField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "api_usage_log"
        indexes = [
            models.Index(fields=["partner", "created_at"]),
            models.Index(fields=["endpoint", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.partner_id} {self.method} {self.endpoint}"
