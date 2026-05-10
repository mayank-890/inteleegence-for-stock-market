"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CompanyChart from "@/components/CompanyChart";
import MLInsightCard from "@/components/MLInsightCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopBar from "@/components/TopBar";
import {
  AnomaliesResponse,
  CompanyDetail,
  EPSGrowthResponse,
  ProfitMarginResponse,
  RevenueTrendResponse,
  ScreenerScoreResponse,
  fetchAnomalies,
  fetchCompanyDetail,
  fetchEpsGrowth,
  fetchProfitMargin,
  fetchRevenueTrend,
  fetchScreenerScore
} from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";

const formatValue = (value: number | null | undefined) =>
  value == null || Number.isNaN(value) ? "N/A" : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function CompanyDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = Array.isArray(params.symbol) ? params.symbol[0] : params.symbol;
  const user = getStoredUser();

  const [tab, setTab] = useState(0);
  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendResponse | null>(null);
  const [profitMargin, setProfitMargin] = useState<ProfitMarginResponse | null>(null);
  const [epsGrowth, setEpsGrowth] = useState<EPSGrowthResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [screenerScore, setScreenerScore] = useState<ScreenerScoreResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      return;
    }

    const loadCompany = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        setDetail(await fetchCompanyDetail(symbol));
      } catch (err: any) {
        setDetailError(err?.response?.data?.message || "Unable to load company detail.");
      } finally {
        setDetailLoading(false);
      }
    };

    const loadInsights = async () => {
      try {
        setInsightLoading(true);
        setInsightError(null);
        const [revenue, margin, eps, anomalyData, screener] = await Promise.all([
          fetchRevenueTrend(symbol),
          fetchProfitMargin(symbol),
          fetchEpsGrowth(symbol),
          fetchAnomalies(symbol),
          fetchScreenerScore(symbol)
        ]);
        setRevenueTrend(revenue);
        setProfitMargin(margin);
        setEpsGrowth(eps);
        setAnomalies(anomalyData);
        setScreenerScore(screener);
      } catch (err: any) {
        setInsightError(err?.response?.data?.message || "Analytics insights could not be loaded.");
      } finally {
        setInsightLoading(false);
      }
    };

    loadCompany();
    loadInsights();
  }, [symbol]);

  const cashFlowChart = useMemo(
    () =>
      detail?.cash_flow
        ?.slice()
        .sort((left, right) => left.year - right.year)
        .map((entry) => ({
          year: entry.year,
          operating: entry.cash_flow_from_operating_activities,
          investing: entry.cash_flow_from_investing_activities,
          financing: entry.cash_flow_from_financing_activities
        })) ?? [],
    [detail]
  );

  return (
    <ProtectedRoute>
      <TopBar
        title={detail?.company.name || `Company • ${symbol}`}
        subtitle="Detailed financial history with the machine learning layer attached."
        userLabel={user?.email}
        onLogout={() => {
          clearSession();
          window.location.href = "/login";
        }}
        actions={
          <Button component={NextLink} href="/dashboard" variant="outlined" startIcon={<ArrowBackRoundedIcon />}>
            Back to dashboard
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ pb: 6 }}>
        {detailLoading ? (
          <Alert severity="info">Loading company workspace...</Alert>
        ) : detailError ? (
          <Alert severity="error">{detailError}</Alert>
        ) : detail ? (
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {detail.company.name}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Ticker: ${detail.company.ticker}`} />
                  <Chip label={`Sector: ${detail.company.sector}`} />
                  {detail.company.nse_symbol ? <Chip label={`NSE: ${detail.company.nse_symbol}`} /> : null}
                </Stack>
              </Box>
            </Stack>

            <Tabs value={tab} onChange={(_, next) => setTab(next)} variant="scrollable">
              <Tab label="Financials" />
              <Tab label="ML Insights" />
              <Tab label="Cash Flow" />
            </Tabs>

            {tab === 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={7}>
                  <Box sx={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ p: 2 }}>
                      Profit &amp; Loss
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Year</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">Total income</TableCell>
                          <TableCell align="right">PAT</TableCell>
                          <TableCell align="right">EPS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.profit_loss.map((row) => (
                          <TableRow key={row.year}>
                            <TableCell>{row.year}</TableCell>
                            <TableCell align="right">{formatValue(row.revenue)}</TableCell>
                            <TableCell align="right">{formatValue(row.total_income)}</TableCell>
                            <TableCell align="right">{formatValue(row.profit_after_tax)}</TableCell>
                            <TableCell align="right">{formatValue(row.eps)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Grid>
                <Grid item xs={12} lg={5}>
                  <Box sx={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ p: 2 }}>
                      Balance Sheet
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Year</TableCell>
                          <TableCell align="right">Equity</TableCell>
                          <TableCell align="right">Assets</TableCell>
                          <TableCell align="right">Liabilities</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.balance_sheet.map((row) => (
                          <TableRow key={row.year}>
                            <TableCell>{row.year}</TableCell>
                            <TableCell align="right">{formatValue(row.total_equity)}</TableCell>
                            <TableCell align="right">{formatValue(row.total_assets)}</TableCell>
                            <TableCell align="right">{formatValue(row.total_liabilities)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Grid>
              </Grid>
            ) : null}

            {tab === 1 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <MLInsightCard title="Revenue trend" loading={insightLoading} error={insightError}>
                    <Stack spacing={1.5}>
                      <Typography variant="h4" sx={{ textTransform: "capitalize" }}>
                        {revenueTrend?.result.direction}
                      </Typography>
                      <Typography color="text.secondary">
                        Slope: {formatValue(revenueTrend?.result.slope)} • R²: {formatValue(revenueTrend?.result.r2_score)}
                      </Typography>
                    </Stack>
                  </MLInsightCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <MLInsightCard title="Profit margin" loading={insightLoading} error={insightError}>
                    <Stack spacing={1.5}>
                      <Typography variant="h4" sx={{ textTransform: "capitalize" }}>
                        {profitMargin?.result.overall_trend}
                      </Typography>
                      <Typography color="text.secondary">
                        Average margin: {formatValue(profitMargin?.result.average_margin_pct)}%
                      </Typography>
                    </Stack>
                  </MLInsightCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <MLInsightCard title="EPS growth" loading={insightLoading} error={insightError}>
                    <Stack spacing={1.5}>
                      <Typography color="text.secondary">
                        Best year: {epsGrowth?.result.best_year.year} ({formatValue(epsGrowth?.result.best_year.growth_pct)}%)
                      </Typography>
                      <Typography color="text.secondary">
                        Worst year: {epsGrowth?.result.worst_year.year} ({formatValue(epsGrowth?.result.worst_year.growth_pct)}%)
                      </Typography>
                    </Stack>
                  </MLInsightCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <MLInsightCard title="Anomalies" loading={insightLoading} error={insightError}>
                    <Stack spacing={1.5}>
                      <Typography variant="h4">{anomalies?.result.anomaly_count ?? 0}</Typography>
                      <Typography color="text.secondary">
                        Revenue: {anomalies?.result.metrics.revenue.length ?? 0} • PAT: {anomalies?.result.metrics.profit_after_tax.length ?? 0} • EPS: {anomalies?.result.metrics.basic_eps.length ?? 0}
                      </Typography>
                    </Stack>
                  </MLInsightCard>
                </Grid>
                <Grid item xs={12}>
                  <MLInsightCard title="Screener score" loading={insightLoading} error={insightError}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center">
                      <Box sx={{ position: "relative", display: "inline-flex" }}>
                        <CircularProgress
                          variant="determinate"
                          value={screenerScore?.result.score ?? 0}
                          size={120}
                          thickness={5}
                          color="primary"
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: "absolute",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <Typography variant="h5">{formatValue(screenerScore?.result.score)}</Typography>
                        </Box>
                      </Box>
                      <Stack spacing={1}>
                        <Typography color="text.secondary">
                          Revenue trend: {formatValue(screenerScore?.result.components.revenue_growth_trend)}
                        </Typography>
                        <Typography color="text.secondary">
                          Profit margin: {formatValue(screenerScore?.result.components.profit_margin_average)}
                        </Typography>
                        <Typography color="text.secondary">
                          EPS consistency: {formatValue(screenerScore?.result.components.eps_consistency)}
                        </Typography>
                        <Typography color="text.secondary">
                          Anomaly absence: {formatValue(screenerScore?.result.components.absence_of_anomalies)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </MLInsightCard>
                </Grid>
              </Grid>
            ) : null}

            {tab === 2 ? (
              <CompanyChart
                title="Operating vs investing vs financing cash flow"
                data={cashFlowChart}
                xKey="year"
                type="bar"
                series={[
                  { key: "operating", label: "Operating", color: "#7BE495" },
                  { key: "investing", label: "Investing", color: "#F4B942" },
                  { key: "financing", label: "Financing", color: "#3AAED8" }
                ]}
              />
            ) : null}
          </Stack>
        ) : null}
      </Container>
    </ProtectedRoute>
  );
}

