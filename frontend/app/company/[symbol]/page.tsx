"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import ScoreboardRoundedIcon from "@mui/icons-material/ScoreboardRounded";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ProtectedRoute from "@/components/ProtectedRoute";
import GlassCard from "@/components/GlassCard";
import {
  ProfitLossRecord,
  BalanceSheetRecord,
  CashFlowRecord,
  RevenueTrendResponse,
  ProfitMarginResponse,
  EPSGrowthResponse,
  AnomaliesResponse,
  ScreenerScoreResponse,
  fetchProfitLoss,
  fetchBalanceSheet,
  fetchCashFlow,
  fetchRevenueTrend,
  fetchProfitMargin,
  fetchEpsGrowth,
  fetchAnomalies,
  fetchScreenerScore,
} from "@/lib/api";

/* ── Helpers ────────────────────────────────────────────────── */

const monoSx = { fontFamily: "var(--font-mono)", fontWeight: 700 };

const formatNum = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return n.toLocaleString("en-IN");
};

const directionChip = (dir: string) => {
  if (dir === "growing" || dir === "improving")
    return <Chip label={dir} size="small" sx={{ bgcolor: "rgba(34,197,94,0.15)", color: "#22C55E", fontWeight: 600 }} />;
  if (dir === "declining" || dir === "deteriorating")
    return <Chip label={dir} size="small" sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444", fontWeight: 600 }} />;
  return <Chip label={dir} size="small" sx={{ bgcolor: "rgba(148,163,184,0.15)", color: "#94A3B8", fontWeight: 600 }} />;
};

const scoreColor = (s: number) => {
  if (s >= 71) return "#22C55E";
  if (s >= 41) return "#F4B942";
  return "#EF4444";
};

const tableCellSx = {
  borderBottom: "1px solid rgba(124,58,237,0.15)",
  color: "#F8FAFC",
};

/* ── Component ──────────────────────────────────────────────── */

export default function CompanyDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();

  const [tab, setTab] = useState(0);

  // Financials
  const [plData, setPlData] = useState<ProfitLossRecord[]>([]);
  const [plLoading, setPlLoading] = useState(true);
  const [plError, setPlError] = useState<string | null>(null);

  // Balance Sheet
  const [bsData, setBsData] = useState<BalanceSheetRecord[]>([]);
  const [bsLoading, setBsLoading] = useState(false);
  const [bsError, setBsError] = useState<string | null>(null);

  // Cash Flow
  const [cfData, setCfData] = useState<CashFlowRecord[]>([]);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfError, setCfError] = useState<string | null>(null);

  // ML insights
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendResponse | null>(null);
  const [profitMargin, setProfitMargin] = useState<ProfitMarginResponse | null>(null);
  const [epsGrowth, setEpsGrowth] = useState<EPSGrowthResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [screenerScore, setScreenerScore] = useState<ScreenerScoreResponse | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);

  // Load P&L on mount
  useEffect(() => {
    if (!symbol) return;
    setPlLoading(true);
    setPlError(null);
    fetchProfitLoss({ company: symbol })
      .then((r) => setPlData(r.items.sort((a, b) => b.year - a.year)))
      .catch(() => setPlError("Failed to load financials."))
      .finally(() => setPlLoading(false));
  }, [symbol]);

  // Load tab data lazily
  const loadMl = useCallback(() => {
    if (!symbol || mlLoading || revenueTrend) return;
    setMlLoading(true);
    setMlError(null);
    Promise.all([
      fetchRevenueTrend(symbol),
      fetchProfitMargin(symbol),
      fetchEpsGrowth(symbol),
      fetchAnomalies(symbol),
      fetchScreenerScore(symbol),
    ])
      .then(([rt, pm, eg, an, ss]) => {
        setRevenueTrend(rt);
        setProfitMargin(pm);
        setEpsGrowth(eg);
        setAnomalies(an);
        setScreenerScore(ss);
      })
      .catch(() => setMlError("Failed to load ML insights."))
      .finally(() => setMlLoading(false));
  }, [symbol, mlLoading, revenueTrend]);

  const loadBs = useCallback(() => {
    if (!symbol || bsLoading || bsData.length > 0) return;
    setBsLoading(true);
    setBsError(null);
    fetchBalanceSheet({ company: symbol })
      .then((r) => setBsData(r.items.sort((a, b) => b.year - a.year)))
      .catch(() => setBsError("Failed to load balance sheet."))
      .finally(() => setBsLoading(false));
  }, [symbol, bsLoading, bsData.length]);

  const loadCf = useCallback(() => {
    if (!symbol || cfLoading || cfData.length > 0) return;
    setCfLoading(true);
    setCfError(null);
    fetchCashFlow({ company: symbol })
      .then((r) => setCfData(r.items.sort((a, b) => a.year - b.year)))
      .catch(() => setCfError("Failed to load cash flow."))
      .finally(() => setCfLoading(false));
  }, [symbol, cfLoading, cfData.length]);

  useEffect(() => {
    if (tab === 1) loadMl();
    if (tab === 2) loadBs();
    if (tab === 3) loadCf();
  }, [tab, loadMl, loadBs, loadCf]);

  // Also load screener score for the header gauge
  useEffect(() => {
    if (!symbol) return;
    fetchScreenerScore(symbol)
      .then(setScreenerScore)
      .catch(() => {});
  }, [symbol]);

  const companyName = plData[0]?.company_name || symbol;

  return (
    <ProtectedRoute>
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          p: { xs: 2, md: 4 },
          minHeight: "100vh",
        }}
      >
        {/* ── Company Header ────────────────────────────────── */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 4 }}
        >
          <Stack spacing={1}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {companyName}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={symbol}
                size="small"
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  bgcolor: "rgba(124,58,237,0.15)",
                  color: "#A855F7",
                }}
              />
              <Chip
                label="Nifty 100"
                size="small"
                sx={{
                  bgcolor: "rgba(244,185,66,0.15)",
                  color: "#F4B942",
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Stack>

          {/* Screener Score Gauge */}
          {screenerScore && (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={screenerScore.result.score}
                size={72}
                thickness={5}
                sx={{
                  color: scoreColor(screenerScore.result.score),
                  "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 18,
                    color: scoreColor(screenerScore.result.score),
                  }}
                >
                  {screenerScore.result.score}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>

        {/* ── Tabs ──────────────────────────────────────────── */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            "& .MuiTab-root": { color: "#94A3B8", textTransform: "none", fontWeight: 600 },
            "& .Mui-selected": { color: "#A855F7" },
            "& .MuiTabs-indicator": { backgroundColor: "#7C3AED" },
            borderBottom: "1px solid rgba(124,58,237,0.15)",
          }}
        >
          <Tab label="Financials" />
          <Tab label="ML Insights" />
          <Tab label="Balance Sheet" />
          <Tab label="Cash Flow" />
        </Tabs>

        {/* ── Tab 0: Financials ─────────────────────────────── */}
        {tab === 0 && (
          <Card>
            <CardContent sx={{ p: 0 }}>
              {plLoading ? (
                <Stack spacing={1} sx={{ p: 3 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={40} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                  ))}
                </Stack>
              ) : plError ? (
                <Alert severity="error" sx={{ m: 2 }}>{plError}</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Year", "Revenue", "Total Income", "Profit After Tax", "Basic EPS"].map((h) => (
                          <TableCell key={h} sx={{ ...tableCellSx, color: "#94A3B8", fontWeight: 600 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {plData.map((row) => (
                        <TableRow key={row.year} sx={{ "&:hover": { bgcolor: "rgba(124,58,237,0.06)" } }}>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{row.year}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.revenue)}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.total_income)}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.profit_after_tax)}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{row.basic_eps != null ? row.basic_eps.toFixed(2) : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Tab 1: ML Insights ────────────────────────────── */}
        {tab === 1 && (
          <>
            {mlError && <Alert severity="error" sx={{ mb: 2 }}>{mlError}</Alert>}
            <Grid container spacing={2.5}>
              {/* Revenue Trend */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TrendingUpRoundedIcon sx={{ color: "#7C3AED" }} />
                        <Typography variant="h6">Revenue Trend</Typography>
                      </Stack>
                      {mlLoading ? (
                        <Skeleton variant="rounded" height={120} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                      ) : revenueTrend ? (
                        <Stack spacing={1.5}>
                          {directionChip(revenueTrend.result.direction)}
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>Slope</Typography>
                              <Typography sx={monoSx}>{revenueTrend.result.slope.toFixed(4)}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>R² Score</Typography>
                              <Typography sx={monoSx}>{revenueTrend.result.r2_score.toFixed(4)}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>Years</Typography>
                              <Typography sx={monoSx}>{revenueTrend.result.years_analyzed}</Typography>
                            </Grid>
                          </Grid>
                        </Stack>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Profit Margin */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ShowChartRoundedIcon sx={{ color: "#7C3AED" }} />
                        <Typography variant="h6">Profit Margin</Typography>
                      </Stack>
                      {mlLoading ? (
                        <Skeleton variant="rounded" height={120} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                      ) : profitMargin ? (
                        <Stack spacing={1.5}>
                          <Typography sx={{ ...monoSx, fontSize: 36, color: "#F8FAFC" }}>
                            {profitMargin.result.average_margin_pct != null
                              ? `${profitMargin.result.average_margin_pct.toFixed(2)}%`
                              : "—"}
                          </Typography>
                          {directionChip(profitMargin.result.overall_trend)}
                        </Stack>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* EPS Growth */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TrendingUpRoundedIcon sx={{ color: "#22C55E" }} />
                        <Typography variant="h6">EPS Growth</Typography>
                      </Stack>
                      {mlLoading ? (
                        <Skeleton variant="rounded" height={120} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                      ) : epsGrowth ? (
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>Best Year</Typography>
                            <Typography sx={{ ...monoSx, color: "#22C55E", fontSize: 20 }}>
                              {epsGrowth.result.best_year.year}
                            </Typography>
                            <Typography sx={{ ...monoSx, color: "#22C55E", fontSize: 14 }}>
                              {epsGrowth.result.best_year.growth_pct != null
                                ? `${epsGrowth.result.best_year.growth_pct.toFixed(1)}%`
                                : "—"}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>Worst Year</Typography>
                            <Typography sx={{ ...monoSx, color: "#EF4444", fontSize: 20 }}>
                              {epsGrowth.result.worst_year.year}
                            </Typography>
                            <Typography sx={{ ...monoSx, color: "#EF4444", fontSize: 14 }}>
                              {epsGrowth.result.worst_year.growth_pct != null
                                ? `${epsGrowth.result.worst_year.growth_pct.toFixed(1)}%`
                                : "—"}
                            </Typography>
                          </Grid>
                        </Grid>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Anomalies */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WarningAmberRoundedIcon sx={{ color: "#F4B942" }} />
                        <Typography variant="h6">Anomalies</Typography>
                      </Stack>
                      {mlLoading ? (
                        <Skeleton variant="rounded" height={120} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                      ) : anomalies ? (
                        <Stack spacing={1.5}>
                          <Typography
                            sx={{
                              ...monoSx,
                              fontSize: 36,
                              color: anomalies.result.anomaly_count > 0 ? "#EF4444" : "#22C55E",
                            }}
                          >
                            {anomalies.result.anomaly_count}
                          </Typography>
                          <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>
                            anomalous years detected
                          </Typography>
                          {anomalies.result.metrics.revenue.length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {anomalies.result.metrics.revenue.map((a) => (
                                <Chip
                                  key={a.year}
                                  label={`${a.year} (z=${a.z_score?.toFixed(1)})`}
                                  size="small"
                                  sx={{
                                    bgcolor: "rgba(239,68,68,0.12)",
                                    color: "#EF4444",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 11,
                                    mb: 0.5,
                                  }}
                                />
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Screener Score */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2} alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                        <ScoreboardRoundedIcon sx={{ color: "#7C3AED" }} />
                        <Typography variant="h6">Screener Score</Typography>
                      </Stack>
                      {mlLoading ? (
                        <Skeleton variant="circular" width={100} height={100} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                      ) : screenerScore ? (
                        <>
                          <Box sx={{ position: "relative", display: "inline-flex" }}>
                            <CircularProgress
                              variant="determinate"
                              value={screenerScore.result.score}
                              size={100}
                              thickness={5}
                              sx={{
                                color: scoreColor(screenerScore.result.score),
                                "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 700,
                                  fontSize: 24,
                                  color: scoreColor(screenerScore.result.score),
                                }}
                              >
                                {screenerScore.result.score}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>out of 100</Typography>
                        </>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {/* ── Tab 2: Balance Sheet ──────────────────────────── */}
        {tab === 2 && (
          <Card>
            <CardContent sx={{ p: 0 }}>
              {bsLoading ? (
                <Stack spacing={1} sx={{ p: 3 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={40} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                  ))}
                </Stack>
              ) : bsError ? (
                <Alert severity="error" sx={{ m: 2 }}>{bsError}</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Year", "Total Equity", "Total Assets", "Share Capital", "Reserves & Surplus"].map((h) => (
                          <TableCell key={h} sx={{ ...tableCellSx, color: "#94A3B8", fontWeight: 600 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bsData.map((row) => (
                        <TableRow key={row.year} sx={{ "&:hover": { bgcolor: "rgba(124,58,237,0.06)" } }}>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{row.year}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.total_equity)}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.total_assets)}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.share_capital)}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.reserves_and_surplus)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Tab 3: Cash Flow Chart ────────────────────────── */}
        {tab === 3 && (
          <Card>
            <CardContent sx={{ p: 3 }}>
              {cfLoading ? (
                <Skeleton variant="rounded" height={400} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
              ) : cfError ? (
                <Alert severity="error">{cfError}</Alert>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={cfData}>
                    <CartesianGrid stroke="rgba(124,58,237,0.12)" vertical={false} />
                    <XAxis
                      dataKey="year"
                      stroke="#94A3B8"
                      tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                      tickFormatter={(v) => `${(v / 1e7).toFixed(0)}Cr`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(5,1,15,0.95)",
                        border: "1px solid rgba(124,58,237,0.3)",
                        borderRadius: 12,
                        fontFamily: "var(--font-mono)",
                      }}
                      formatter={(v: number, name: string) => [formatNum(v), name]}
                    />
                    <Legend />
                    <Bar
                      dataKey="cash_flow_from_operating_activities"
                      name="Operating"
                      fill="#7C3AED"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="cash_flow_from_investing_activities"
                      name="Investing"
                      fill="#F4B942"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="cash_flow_from_financing_activities"
                      name="Financing"
                      fill="#EF4444"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </ProtectedRoute>
  );
}
