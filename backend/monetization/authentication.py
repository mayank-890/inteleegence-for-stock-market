from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from .models import APIKey


class APIKeyAuthentication(authentication.BaseAuthentication):
    header_name = "HTTP_X_API_KEY"

    def authenticate(self, request):
        raw_key = request.META.get(self.header_name)
        if not raw_key:
            return None

        api_key = getattr(request, "_monetization_api_key", None)
        if api_key is None or api_key.key != raw_key:
            api_key = (
                APIKey.objects.select_related("user")
                .filter(key=raw_key, is_active=True)
                .first()
            )

        if api_key is None:
            raise AuthenticationFailed("Invalid API key.")

        request._monetization_api_key = api_key
        return (api_key.user, api_key)

    def authenticate_header(self, request):
        return "X-API-Key"

