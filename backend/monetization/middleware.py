from __future__ import annotations

from datetime import timedelta

from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone

from .models import APIKey, APIUsageLog


class APIUsageMiddleware:
    TIER_LIMITS = {
        APIKey.Tier.FREE: 100,
        APIKey.Tier.BASIC: 1000,
        APIKey.Tier.PRO: 10000,
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        api_key = self._resolve_api_key(request)
        request._monetization_api_key = api_key

        if api_key is not None:
            limit_response = self._enforce_daily_limit(request, api_key)
            if limit_response is not None:
                self._log_usage(api_key, request, limit_response.status_code)
                return limit_response

        response = self.get_response(request)

        if api_key is not None:
            self._log_usage(api_key, request, response.status_code)

        return response

    def _resolve_api_key(self, request):
        raw_key = request.META.get("HTTP_X_API_KEY")
        if not raw_key:
            return None

        return (
            APIKey.objects.select_related("user")
            .filter(key=raw_key, is_active=True)
            .first()
        )

    def _enforce_daily_limit(self, request, api_key: APIKey):
        tier = self._effective_tier(request, api_key)
        limit = self.TIER_LIMITS[tier]
        cache_key = self._cache_key(api_key.pk, timezone.localdate())
        current = cache.get(cache_key, 0)

        if current >= limit:
            return JsonResponse(
                {
                    "error": True,
                    "message": "Daily rate limit exceeded. Upgrade your plan.",
                    "code": "rate_limit_exceeded",
                    "tier": tier,
                    "limit": limit,
                    "upgrade_url": "/api/v1/monetization/plans/",
                },
                status=429,
            )

        timeout = self._seconds_until_day_end()
        if cache.add(cache_key, 1, timeout=timeout):
            return None

        try:
            cache.incr(cache_key)
        except ValueError:
            cache.set(cache_key, current + 1, timeout=timeout)
        return None

    def _effective_tier(self, request, api_key: APIKey) -> str:
        if request.path.startswith("/api/partner/v1/"):
            return APIKey.Tier.PRO
        return api_key.tier

    @staticmethod
    def _cache_key(api_key_id: int, current_date) -> str:
        return f"api-rate-limit:{api_key_id}:{current_date.isoformat()}"

    @staticmethod
    def _seconds_until_day_end() -> int:
        now = timezone.now()
        tomorrow = (now + timedelta(days=1)).date()
        next_day = timezone.make_aware(
            timezone.datetime.combine(tomorrow, timezone.datetime.min.time()),
            timezone.get_current_timezone(),
        )
        delta = next_day - now
        return max(int(delta.total_seconds()), 1)

    @staticmethod
    def _log_usage(api_key: APIKey, request, status_code: int) -> None:
        APIUsageLog.objects.create(
            api_key=api_key,
            endpoint=request.path,
            method=request.method.upper(),
            response_code=status_code,
        )
        APIKey.objects.filter(pk=api_key.pk).update(last_used_at=timezone.now())

