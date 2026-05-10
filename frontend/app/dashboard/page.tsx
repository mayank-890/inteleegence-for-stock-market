"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import CorporateFareRoundedIcon from "@mui/icons-material/CorporateFareRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";

import CompanyChart from "@/components/CompanyChart";
import ErrorState from "@/components/ErrorState";
import LoadingBlock from "@/components/LoadingBlock";
import MetricCard from "@/components/MetricCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { CompanyListItem, ProfitLossRecord, fetchAllProfitLoss, fetchCompanies, fetchProfitLoss } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";

const formatNumber = (value: number | null | undefined) =>
  value == null || Number.isNaN(value) ? "N/A" : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function DashboardPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedProfitLoss, setSelectedProfitLoss] = useState<ProfitLossRecord[]>([]);
  const [allProfitLoss, setAllProfitLoss] = useState<ProfitLossRecord[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);
  const user = getStoredUser();

  const filteredCompanies = useMemo(() => {
    if (!search) {
      return companies;
    }
    const lower = search.toLowerCase();
    return companies.filter(
      (company) =>
        company.company_name.toLowerCase().includes(lower) ||
        company.ticker_symbol.toLowerCase().includes(lower)
    );
  }, [companies, search]);

  const metrics = useMemo(() => {
    if (!allProfitLoss.length) {
      return {
        latestYear: null as number | null,
        averageRevenueGrowth: null as number | null,
        averageProfitMargin: null as number | null
      };
    }

    const groups = new Map<string, ProfitLossRecord[]>();
    allProfitLoss.forEach((record) => {
      const symbol = record.company_symbol || "UNKNOWN";
      const current = groups.get(symbol) || [];
      current.push(record);
      groups.set(symbol, current);
    });

    const growthValues: number[] = [];
    const latestMargins: number[] = [];
    let latestYear = 0;

    groups.forEach((records) => {
      const sorted = [...records].sort((left, right) => left.year - right.year);
      sorted.forEach((row) => {
        latestYear = Math.max(latestYear, row.year);
      });

      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      if (first?.revenue && last?.revenue && first.revenue !== 0 && sorted.length > 1) {
        const growth = ((last.revenue - first.revenue) / Math.abs(first.revenue)) * 100;
        growthValues.push(growth);
      }

      if (last?.revenue && last?.profit_after_tax && last.revenue !== 0) {
        latestMargins.push((last.profit_after_tax / last.revenue) * 100);
      }
    });

    return {
      latestYear: latestYear || null,
      averageRevenueGrowth:
        growthValues.length > 0 ? growthValues.reduce((sum, value) => sum + value, 0) / growthValues.length : null,
      averageProfitMargin:
        latestMargins.length > 0 ? latestMargins.reduce((sum, value) => sum + value, 0) / latestMargins.length : null
    };
  }, [allProfitLoss]);

  const chartData = useMemo(
    () => [...selectedProfitLoss].sort((left, right) => left.year - right.year),
    [selectedProfitLoss]
  );

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoadingCompanies(true);
        setLoadingMetrics(true);
        setError(null);

        const [companyResponse, profitLossResponse] = await Promise.all([
          fetchCompanies({ page_size: 100 }),
          fetchAllProfitLoss()
        ]);

        setCompanies(companyResponse.items);
        setAllProfitLoss(profitLossResponse);
        if (companyResponse.items[0]) {
          setSelectedSymbol((previous) => previous || companyResponse.items[0].ticker_symbol);
        }
      } catch {
        setError("Dashboard data could not be loaded. Please try again.");
      } finally {
        setLoadingCompanies(false);
        setLoadingMetrics(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedSymbol) {
      return;
    }

    const loadCompanyTrend = async () => {
      try {
        setLoadingCharts(true);
        setChartsError(null);
        const response = await fetchProfitLoss({ company: selectedSymbol });
        setSelectedProfitLoss(response.items);
      } catch {
        setChartsError("We couldn't load the selected company's financial trend.");
      } finally {
        setLoadingCharts(false);
      }
    };

    loadCompanyTrend();
  }, [selectedSymbol]);

  return (
    <ProtectedRoute>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: { xs: "block", md: "flex" }, gap: 2 }}>
          <Sidebar
            companies={filteredCompanies}
            selectedSymbol={selectedSymbol}
            search={search}
            onSearchChange={setSearch}
            onSelect={setSelectedSymbol}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TopBar
              title="Executive Dashboard"
              subtitle="A working surface for scanning market leaders, tracking trend shifts, and drilling into fundamentals."
              userLabel={user?.email}
              onLogout={() => {
                clearSession();
                window.location.href = "/login";
              }}
              actions={
                selectedSymbol ? (
                  <Button
                    component={NextLink}
                    href={`/company/${selectedSymbol}`}
                    variant="outlined"
                    endIcon={<ArrowForwardRoundedIcon />}
                  >
                    Open company
                  </Button>
                ) : null
              }
            />

            <Container maxWidth={false} disableGutters>
              {error ? <Alert severity="error">{error}</Alert> : null}

              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} xl={3}>
                  <MetricCard
                    title="Companies tracked"
                    value={loadingCompanies ? "" : String(companies.length)}
                    subtitle="Current Nifty 100 coverage in the platform"
                    icon={<CorporateFareRoundedIcon color="primary" />}
                    loading={loadingCompanies}
                  />
                </Grid>
                <Grid item xs={12} sm={6} xl={3}>
                  <MetricCard
                    title="Latest year available"
                    value={loadingMetrics ? "" : String(metrics.latestYear ?? "N/A")}
                    subtitle="Most recent fiscal year present in warehouse facts"
                    icon={<QueryStatsRoundedIcon color="primary" />}
                    loading={loadingMetrics}
                  />
                </Grid>
                <Grid item xs={12} sm={6} xl={3}>
                  <MetricCard
                    title="Average revenue growth"
                    value={loadingMetrics ? "" : `${formatNumber(metrics.averageRevenueGrowth)}%`}
                    subtitle="Mean first-to-last revenue growth across companies"
                    icon={<AutoGraphRoundedIcon color="primary" />}
                    loading={loadingMetrics}
                  />
                </Grid>
                <Grid item xs={12} sm={6} xl={3}>
                  <MetricCard
                    title="Average profit margin"
                    value={loadingMetrics ? "" : `${formatNumber(metrics.averageProfitMargin)}%`}
                    subtitle="Latest profit margin snapshot across the tracked universe"
                    icon={<PercentRoundedIcon color="primary" />}
                    loading={loadingMetrics}
                  />
                </Grid>
              </Grid>

              {loadingCharts ? (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} lg={8}>
                    <LoadingBlock height={360} />
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <LoadingBlock height={360} />
                  </Grid>
                </Grid>
              ) : chartsError ? (
                <ErrorState message={chartsError} />
              ) : (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} xl={8}>
                    <CompanyChart
                      title={`Revenue trend • ${selectedSymbol}`}
                      data={chartData}
                      xKey="year"
                      type="line"
                      series={[{ key: "revenue", label: "Revenue", color: "#F4B942" }]}
                    />
                  </Grid>
                  <Grid item xs={12} xl={4}>
                    <CompanyChart
                      title="Profit after tax"
                      data={chartData}
                      xKey="year"
                      type="line"
                      series={[{ key: "profit_after_tax", label: "PAT", color: "#3AAED8" }]}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <CompanyChart
                      title="EPS by year"
                      data={chartData.map((entry) => ({ ...entry, eps_value: entry.eps }))}
                      xKey="year"
                      type="bar"
                      series={[{ key: "eps_value", label: "EPS", color: "#7BE495" }]}
                    />
                  </Grid>
                </Grid>
              )}

              {!selectedSymbol && !loadingCompanies ? (
                <Typography color="text.secondary" sx={{ mt: 3 }}>
                  Select a company from the sidebar to load charts.
                </Typography>
              ) : null}
            </Container>
          </Box>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}

