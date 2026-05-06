import time

from django.core.cache import cache
from rest_framework.throttling import BaseThrottle

from .models import PartnerAccount


class PartnerRateThrottle(BaseThrottle):
    tier_limits = {
        PartnerAccount.Tier.BASIC: 10,
        PartnerAccount.Tier.PRO: 60,
        PartnerAccount.Tier.ENTERPRISE: 300,
    }
    window_seconds = 60

    def __init__(self):
        self.history = []
        self.now = None
        self.limit = None

    def allow_request(self, request, view):
        partner = getattr(request, "user", None)
        if not isinstance(partner, PartnerAccount):
            return False

        self.limit = self.tier_limits.get(partner.tier, self.tier_limits[PartnerAccount.Tier.BASIC])
        self.now = time.time()
        cache_key = self._cache_key(partner)
        history = cache.get(cache_key, [])
        self.history = [timestamp for timestamp in history if timestamp > self.now - self.window_seconds]

        if len(self.history) >= self.limit:
            cache.set(cache_key, self.history, timeout=self.window_seconds)
            return False

        self.history.append(self.now)
        cache.set(cache_key, self.history, timeout=self.window_seconds)
        return True

    def wait(self):
        if not self.history or self.now is None:
            return None
        return max(0, int(self.window_seconds - (self.now - self.history[0])))

    @staticmethod
    def _cache_key(partner):
        return f"partner_rate:{partner.pk}:{partner.tier}"
