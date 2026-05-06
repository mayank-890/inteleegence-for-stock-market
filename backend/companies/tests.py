import hashlib
import hmac
import time
from types import SimpleNamespace
from unittest.mock import Mock, patch

from cryptography.fernet import Fernet
from django.core.cache import cache
from django.db.models import Q
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory

from companies.authentication import HMACAuthentication
from companies.models import PartnerAccount
from companies.throttling import PartnerRateThrottle
from companies.views import PartnerScreenerView, ScreenerView


class FakeCompanySerializer:
    def __init__(self, instance, many=False):
        self.instance = instance
        self.many = many

    @property
    def data(self):
        if not self.many:
            return {}

        return [{"company_id": item} for item in self.instance]


class FakeFilterResult:
    def __init__(self, partner):
        self.partner = partner

    def first(self):
        return self.partner


class FakeQuerySet:
    ordered = True

    def __init__(self, items=None):
        self.items = list(items or range(1, 76))
        self.annotations = {}
        self.filter_calls = []
        self.prefetched_related = []
        self.selected_related = []
        self.distinct_called = False
        self.ordering = None
        self.slice_values = []

    def select_related(self, *fields):
        self.selected_related.extend(fields)
        return self

    def prefetch_related(self, *fields):
        self.prefetched_related.extend(fields)
        return self

    def annotate(self, **annotations):
        self.annotations.update(annotations)
        return self

    def filter(self, *args, **kwargs):
        self.filter_calls.append((args, kwargs))
        return self

    def distinct(self):
        self.distinct_called = True
        return self

    def order_by(self, *fields):
        self.ordering = fields
        return self

    def count(self):
        return len(self.items)

    def __len__(self):
        return len(self.items)

    def __iter__(self):
        return iter(self.items)

    def __getitem__(self, value):
        self.slice_values.append(value)
        if isinstance(value, slice):
            sliced = FakeQuerySet(self.items[value])
            sliced.annotations = self.annotations
            sliced.filter_calls = self.filter_calls
            sliced.prefetched_related = self.prefetched_related
            sliced.selected_related = self.selected_related
            sliced.distinct_called = self.distinct_called
            sliced.ordering = self.ordering
            sliced.slice_values = self.slice_values
            return sliced
        return self.items[value]


class FakeCompanyManager:
    def __init__(self):
        self.queryset = FakeQuerySet()

    def select_related(self, *fields):
        return self.queryset.select_related(*fields)


TEST_FERNET_KEY = Fernet.generate_key().decode("utf-8")


@override_settings(
    ALLOWED_HOSTS=["localhost", "testserver"],
    PARTNER_HMAC_ENCRYPTION_KEY=TEST_FERNET_KEY,
)
class ScreenerViewTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        cache.clear()

    def test_screener_filters_only_min_roe(self):
        response, queryset = self._get_public_response({"min_roe": "15"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"]["status"], "success")
        self.assertIn("analysis_records__roe_pct__gte", self._filter_lookups(queryset))
        self.assertEqual(queryset.ordering[0], "-analysis_records__roe_pct")
        self.assertTrue(queryset.distinct_called)

    def test_screener_filters_only_max_de(self):
        response, queryset = self._get_public_response({"max_de": "1.5"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"]["status"], "success")
        self.assertIn("screener_de_ratio", queryset.annotations)
        self.assertIn("balance_sheet_records__total_equity__gt", self._filter_lookups(queryset))
        self.assertIn("screener_de_ratio__lte", self._filter_lookups(queryset))
        self.assertTrue(queryset.distinct_called)

    def test_screener_filters_only_sector(self):
        response, queryset = self._get_public_response({"sector": "IT"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"]["status"], "success")
        self.assertIn("sector__sector_name", self._filter_lookups(queryset))
        self.assertTrue(queryset.distinct_called)

    def test_screener_filters_min_roe_max_de_and_sector(self):
        response, queryset = self._get_public_response(
            {
                "min_roe": "15",
                "max_de": "1.5",
                "sector": "IT",
            }
        )

        lookups = self._filter_lookups(queryset)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"]["status"], "success")
        self.assertIn("analysis_records__roe_pct__gte", lookups)
        self.assertIn("balance_sheet_records__total_equity__gt", lookups)
        self.assertIn("screener_de_ratio__lte", lookups)
        self.assertIn("sector__sector_name", lookups)
        self.assertTrue(queryset.distinct_called)

    def test_screener_without_filters_returns_paginated_results_without_error(self):
        response, queryset = self._get_public_response({})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], ScreenerView.max_results)
        self.assertIsNone(response.data["previous"])
        self.assertEqual(response.data["results"]["status"], "success")
        self.assertEqual(len(response.data["results"]["data"]), ScreenerView.page_size)
        self.assertIn(slice(None, ScreenerView.max_results, None), queryset.slice_values)
        self.assertTrue(queryset.distinct_called)

    def test_screener_sorts_by_computed_de_ratio_alias(self):
        response, queryset = self._get_public_response(
            {
                "sort_by": "analysis_records__de_ratio",
                "order": "asc",
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"]["status"], "success")
        self.assertEqual(queryset.ordering[0], "screener_de_ratio")

    def test_partner_screener_returns_flat_success_payload_and_logs_usage(self):
        partner = self._partner_with_secret()
        response, queryset, usage_log_create = self._get_partner_response(partner, {"min_roe": "15"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(len(response.data["data"]), PartnerScreenerView.page_size)
        self.assertIn("analysis_records__roe_pct__gte", self._filter_lookups(queryset))
        usage_log_create.assert_called_once()

    def test_hmac_authentication_rejects_invalid_signature(self):
        partner = self._partner_with_secret()
        request = self.factory.get(
            "/api/partner/v1/screener/",
            HTTP_HOST="localhost",
            **self._auth_headers("wrong-secret"),
        )

        with patch.object(PartnerAccount.objects, "get", return_value=partner):
            with self.assertRaisesMessage(Exception, "Invalid signature."):
                HMACAuthentication().authenticate(request)

    def test_hmac_authentication_rejects_replayed_nonce(self):
        partner = self._partner_with_secret()
        headers = self._auth_headers("shared-secret", nonce="nonce-1")
        request_one = self.factory.get("/api/partner/v1/screener/", HTTP_HOST="localhost", **headers)
        request_two = self.factory.get("/api/partner/v1/screener/", HTTP_HOST="localhost", **headers)

        with patch.object(PartnerAccount.objects, "get", return_value=partner):
            auth = HMACAuthentication()
            auth.authenticate(request_one)
            with self.assertRaisesMessage(Exception, "Replay request rejected."):
                auth.authenticate(request_two)

    def test_partner_rate_throttle_blocks_basic_partner_after_ten_requests(self):
        partner = self._partner_with_secret(tier=PartnerAccount.Tier.BASIC)
        throttle = PartnerRateThrottle()
        request = SimpleNamespace(user=partner)

        allowed = [throttle.allow_request(request, None) for _ in range(11)]
        self.assertEqual(allowed.count(True), 10)
        self.assertFalse(allowed[-1])

    def _get_public_response(self, params):
        manager = FakeCompanyManager()
        request = self.factory.get("/api/v1/screener/", params, HTTP_HOST="localhost")
        fake_company = SimpleNamespace(objects=manager)

        with (
            patch("companies.views.DimCompany", fake_company),
            patch("companies.views.CompanySerializer", FakeCompanySerializer),
        ):
            response = ScreenerView.as_view()(request)

        return response, manager.queryset

    def _get_partner_response(self, partner, params):
        manager = FakeCompanyManager()
        headers = self._auth_headers("shared-secret", path="/api/partner/v1/screener/?min_roe=15")
        request = self.factory.get("/api/partner/v1/screener/", params, HTTP_HOST="localhost", **headers)
        fake_company = SimpleNamespace(objects=manager)
        usage_log_create = Mock()

        with (
            patch("companies.views.DimCompany", fake_company),
            patch("companies.views.CompanySerializer", FakeCompanySerializer),
            patch.object(PartnerAccount.objects, "get", return_value=partner),
            patch.object(PartnerAccount.objects, "filter", return_value=FakeFilterResult(partner)),
            patch("companies.views.APIUsageLog.objects.create", usage_log_create),
        ):
            response = PartnerScreenerView.as_view()(request)

        return response, manager.queryset, usage_log_create

    def _partner_with_secret(self, tier=PartnerAccount.Tier.PRO):
        partner = PartnerAccount(name="Demo Partner", tier=tier, is_active=True)
        partner.key_id = "4b6882f9-83da-47ab-8237-e7744982d999"
        partner.set_shared_secret("shared-secret")
        return partner

    def _auth_headers(self, secret, nonce="nonce-1", timestamp=None, path="/api/partner/v1/screener/"):
        request_timestamp = timestamp or str(int(time.time()))
        message = f"GET{path}{request_timestamp}".encode("utf-8")
        signature = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
        return {
            "HTTP_X_API_KEY_ID": "4b6882f9-83da-47ab-8237-e7744982d999",
            "HTTP_X_TIMESTAMP": request_timestamp,
            "HTTP_X_SIGNATURE": signature,
            "HTTP_X_NONCE": nonce,
        }

    def _filter_lookups(self, queryset):
        lookups = []
        for args, kwargs in queryset.filter_calls:
            for query in args:
                if isinstance(query, Q):
                    lookups.extend(self._q_lookups(query))
            lookups.extend(kwargs.keys())
        return lookups

    def _q_lookups(self, query):
        lookups = []
        for child in query.children:
            if isinstance(child, Q):
                lookups.extend(self._q_lookups(child))
            else:
                lookups.append(child[0])
        return lookups
