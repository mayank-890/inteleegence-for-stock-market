import axios from "axios";

import { clearSession, getApiKey, getToken } from "@/lib/auth";

export type Plan = {
  tier: string;
  price: string;
  requests_per_day: number;
  features: string[];
};

export type AuthResponse = {
  token: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
};

export type CompanyListItem = {
  company_id: number;
  company_name: string;
  ticker_symbol: string;
  sector_name: string;
  latest_year?: number | null;
  revenue?: number | null;
  profit_after_tax?: number | null;
  basic_eps?: number | null;
};

export type ProfitLossRecord = {
  company_symbol?: string;
  company_name?: string;
  year: number;
  revenue: number | null;
  total_income: number | null;
  profit_before_tax: number | null;
  profit_after_tax: number | null;
  eps: number | null;
};

export type BalanceSheetRecord = {
  company_symbol?: string;
  company_name?: string;
  year: number;
  share_capital: number | null;
  reserves_and_surplus: number | null;
  total_equity: number | null;
  long_term_borrowings: number | null;
  short_term_borrowings: number | null;
  total_liabilities: number | null;
  total_assets: number | null;
};

export type CashFlowRecord = {
  company_symbol?: string;
  company_name?: string;
  year: number;
  cash_flow_from_operating_activities: number | null;
  cash_flow_from_investing_activities: number | null;
  cash_flow_from_financing_activities: number | null;
  net_increase_in_cash: number | null;
  opening_cash_and_cash_equivalents: number | null;
  closing_cash_and_cash_equivalents: number | null;
};

export type CompanyDetail = {
  company: {
    name: string;
    ticker: string;
    sector: string;
    nse_symbol?: string | null;
  };
  profit_loss: ProfitLossRecord[];
  balance_sheet: BalanceSheetRecord[];
  cash_flow: CashFlowRecord[];
};

export type RevenueTrendResponse = {
  company: string;
  metric: string;
  computed_at: string;
  result: {
    direction: "growing" | "declining" | "flat";
    slope: number;
    r2_score: number;
    years_analyzed: number;
  };
};

export type ProfitMarginResponse = {
  company: string;
  metric: string;
  computed_at: string;
  result: {
    overall_trend: "improving" | "deteriorating" | "flat";
    average_margin_pct: number | null;
    yearly_margins: Array<{
      year: number;
      revenue: number | null;
      profit_after_tax: number | null;
      margin_pct: number | null;
      trend: string | null;
    }>;
  };
};

export type EPSGrowthResponse = {
  company: string;
  metric: string;
  computed_at: string;
  result: {
    yearly_growth: Array<{
      year: number;
      eps: number | null;
      growth_pct: number | null;
    }>;
    best_year: {
      year: number;
      growth_pct: number | null;
    };
    worst_year: {
      year: number;
      growth_pct: number | null;
    };
  };
};

export type AnomaliesResponse = {
  company: string;
  metric: string;
  computed_at: string;
  result: {
    threshold: number;
    anomaly_count: number;
    metrics: {
      revenue: Array<{ year: number; value: number | null; z_score: number | null }>;
      profit_after_tax: Array<{ year: number; value: number | null; z_score: number | null }>;
      basic_eps: Array<{ year: number; value: number | null; z_score: number | null }>;
    };
  };
};

export type ScreenerScoreResponse = {
  company: string;
  metric: string;
  computed_at: string;
  result: {
    score: number;
    components: {
      revenue_growth_trend: number;
      profit_margin_average: number;
      eps_consistency: number;
      absence_of_anomalies: number;
    };
    summary: {
      revenue_direction: string;
      average_margin_pct: number | null;
      anomaly_count: number;
    };
  };
};

export type APIKeyRecord = {
  id: number;
  name: string;
  key: string;
  tier: "free" | "basic" | "pro";
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
};

export type UsageStat = {
  api_key_id: number;
  api_key_name: string;
  endpoint: string;
  day: string;
  request_count: number;
};

type PaginatedEnvelope<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[] | { status?: string; data?: T[] };
};

export type PaginatedData<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  items: T[];
};

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = getToken();
  const apiKey = getApiKey();

  config.headers = config.headers ?? {};
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  if (apiKey) {
    config.headers["X-API-Key"] = apiKey;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const normalizePaginated = <T>(data: PaginatedEnvelope<T>): PaginatedData<T> => {
  const items = Array.isArray(data.results) ? data.results : data.results?.data ?? [];
  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    items
  };
};

export const fetchAllPaginated = async <T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  maxPages = 100
) => {
  const items: T[] = [];
  let nextUrl: string | null = endpoint;
  let currentParams = params;
  let pageCount = 0;

  while (nextUrl && pageCount < maxPages) {
    const response =
      nextUrl === endpoint
        ? await api.get<PaginatedEnvelope<T>>(endpoint, { params: currentParams })
        : await api.get<PaginatedEnvelope<T>>(nextUrl);
    const normalized = normalizePaginated(response.data);
    items.push(...normalized.items);
    nextUrl = normalized.next;
    currentParams = undefined;
    pageCount += 1;
  }

  return items;
};

export const login = async (email: string, password: string) => {
  const { data } = await api.post<{ token: string }>("/api/v1/auth/token/", {
    username: email,
    password
  });
  return data;
};

export const registerUser = async (payload: { name: string; email: string; password: string }) => {
  const { data } = await api.post<AuthResponse>("/api/v1/auth/register/", payload);
  return data;
};

export const fetchPlans = async () => {
  const { data } = await api.get<{ plans: Plan[] }>("/api/v1/monetization/plans/");
  return data.plans;
};

export const fetchCompanies = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedEnvelope<CompanyListItem>>("/api/v1/companies/", {
    params
  });
  return normalizePaginated(data);
};

export const fetchCompanyDetail = async (symbol: string) => {
  const { data } = await api.get<CompanyDetail>(`/api/v1/companies/${symbol}/`);
  return data;
};

export const fetchProfitLoss = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedEnvelope<ProfitLossRecord>>("/api/v1/profit-loss/", {
    params
  });
  return normalizePaginated(data);
};

export const fetchBalanceSheet = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedEnvelope<BalanceSheetRecord>>("/api/v1/balance-sheet/", {
    params
  });
  return normalizePaginated(data);
};

export const fetchCashFlow = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedEnvelope<CashFlowRecord>>("/api/v1/cash-flow/", {
    params
  });
  return normalizePaginated(data);
};

export const fetchAllProfitLoss = async () =>
  fetchAllPaginated<ProfitLossRecord>("/api/v1/profit-loss/");

export const fetchScreener = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedEnvelope<CompanyListItem>>("/api/v1/screener/", {
    params
  });
  return normalizePaginated(data);
};

export const fetchRevenueTrend = async (company: string) => {
  const { data } = await api.get<RevenueTrendResponse>("/api/v1/analytics/revenue-trend/", {
    params: { company }
  });
  return data;
};

export const fetchProfitMargin = async (company: string) => {
  const { data } = await api.get<ProfitMarginResponse>("/api/v1/analytics/profit-margin/", {
    params: { company }
  });
  return data;
};

export const fetchEpsGrowth = async (company: string) => {
  const { data } = await api.get<EPSGrowthResponse>("/api/v1/analytics/eps-growth/", {
    params: { company }
  });
  return data;
};

export const fetchAnomalies = async (company: string) => {
  const { data } = await api.get<AnomaliesResponse>("/api/v1/analytics/anomalies/", {
    params: { company }
  });
  return data;
};

export const fetchScreenerScore = async (company: string) => {
  const { data } = await api.get<ScreenerScoreResponse>("/api/v1/analytics/screener-score/", {
    params: { company }
  });
  return data;
};

export const fetchApiKeys = async () => {
  const { data } = await api.get<APIKeyRecord[]>("/api/v1/monetization/keys/");
  return data;
};

export const createApiKey = async (payload: { name: string; tier: "free" | "basic" | "pro" }) => {
  const { data } = await api.post<APIKeyRecord>("/api/v1/monetization/keys/", payload);
  return data;
};

export const deleteApiKey = async (id: number) => {
  await api.delete(`/api/v1/monetization/keys/${id}/`);
};

export const fetchUsageStats = async () => {
  const { data } = await api.get<{ usage: UsageStat[] }>("/api/v1/monetization/usage/");
  return data.usage;
};

export default api;

