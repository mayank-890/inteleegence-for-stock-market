import hashlib
import hmac
import time

from django.core.cache import cache
from rest_framework import authentication, exceptions

from .models import PartnerAccount


class HMACAuthentication(authentication.BaseAuthentication):
    timestamp_tolerance_seconds = 300
    nonce_ttl_seconds = 300

    def authenticate(self, request):
        key_id = request.headers.get("X-API-Key-ID")
        timestamp = request.headers.get("X-Timestamp")
        signature = request.headers.get("X-Signature")
        nonce = request.headers.get("X-Nonce")

        if not all([key_id, timestamp, signature, nonce]):
            raise exceptions.AuthenticationFailed("Missing HMAC authentication headers.")

        partner = self._get_partner(key_id)
        self._validate_timestamp(timestamp)
        self._validate_nonce(partner, nonce)
        self._validate_signature(request, partner, timestamp, signature)

        return partner, None

    def authenticate_header(self, request):
        return "HMAC"

    def _get_partner(self, key_id):
        try:
            partner = PartnerAccount.objects.get(key_id=key_id)
        except (PartnerAccount.DoesNotExist, ValueError):
            raise exceptions.AuthenticationFailed("Invalid API key.")

        if not partner.is_active:
            raise exceptions.AuthenticationFailed("Inactive partner account.")

        return partner

    def _validate_timestamp(self, timestamp):
        try:
            request_time = int(timestamp)
        except (TypeError, ValueError):
            raise exceptions.AuthenticationFailed("Invalid timestamp.")

        if abs(int(time.time()) - request_time) > self.timestamp_tolerance_seconds:
            raise exceptions.AuthenticationFailed("Expired timestamp.")

    def _validate_nonce(self, partner, nonce):
        cache_key = f"partner_nonce:{partner.pk}:{nonce}"
        added = cache.add(cache_key, "1", timeout=self.nonce_ttl_seconds)
        if not added:
            raise exceptions.AuthenticationFailed("Replay request rejected.")

    def _validate_signature(self, request, partner, timestamp, signature):
        expected_signature = self._build_signature(request, partner, timestamp)
        if not hmac.compare_digest(expected_signature, signature):
            raise exceptions.AuthenticationFailed("Invalid signature.")

    def _build_signature(self, request, partner, timestamp):
        message = self._message(request, timestamp)
        return hmac.new(
            partner.get_shared_secret().encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()

    @staticmethod
    def _message(request, timestamp):
        method = request.method.upper()
        path = request.get_full_path()
        body = request.body or b""
        prefix = f"{method}{path}{timestamp}".encode("utf-8")
        return prefix + body
