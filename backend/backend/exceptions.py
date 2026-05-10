from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


ERROR_CODES = {
    status.HTTP_400_BAD_REQUEST: "bad_request",
    status.HTTP_401_UNAUTHORIZED: "unauthorized",
    status.HTTP_403_FORBIDDEN: "forbidden",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_429_TOO_MANY_REQUESTS: "rate_limited",
    status.HTTP_500_INTERNAL_SERVER_ERROR: "server_error",
}


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {
                "error": True,
                "message": "Internal server error.",
                "code": ERROR_CODES[status.HTTP_500_INTERNAL_SERVER_ERROR],
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data
    if isinstance(detail, dict):
        message = detail.get("detail") or next(iter(detail.values()), "Request failed.")
        if isinstance(message, list):
            message = message[0]
    else:
        message = detail

    response.data = {
        "error": True,
        "message": str(message),
        "code": ERROR_CODES.get(response.status_code, "api_error"),
    }
    return response
