"use client";

import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ScoreboardRoundedIcon from "@mui/icons-material/ScoreboardRounded";
import {
  Alert, Autocomplete, Avatar, Box, Chip, CircularProgress,
  Grid, List, ListItemButton, ListItemIcon, ListItemText,
  Skeleton, Stack, TextField, Typography,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

import ProtectedRoute from "@/components/ProtectedRoute";
import GlassCard from "@/components/GlassCard";
import {
  ProfitLossRecord, RevenueTrendResponse, ProfitMarginResponse,
  EPSGrowthResponse, AnomaliesResponse, ScreenerScoreResponse,
  fetchProfitLoss, fetchRevenueTrend, fetchProfitMargin,
  fetchEpsGrowth, fetchAnomalies, fetchScreenerScore, fetchUsageStats,
} from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";

/* ── Constants ──────────────────────────────────────────────── */

const SYMBOLS = [
  "RELIANCE","TCS","INFY","HDFCBANK","ICICIBANK",
  "WIPRO","BAJFINANCE","AXISBANK","SBIN","LT",
  "MARUTI","TATAMOTORS","ASIANPAINT","SUNPHARMA","TITAN",
  "ULTRACEMCO","NESTLEIND","POWERGRID","NTPC","COALINDIA",
];

const navItems = [
  { label: "Dashboard", icon: <GridViewRoundedIcon />, href: "/dashboard" },
  { label: "Screener", icon: <FilterListRoundedIcon />, href: "/screener" },
  { label: "API Keys", icon: <KeyRoundedIcon />, href: "/api-keys" },
  { label: "Pricing", icon: <PaymentsRoundedIcon />, href: "/pricing" },
];

const SIDEBAR_WIDTH = 240;

const tooltipStyle = {
  background: "rgba(5,1,15,0.95)",
  border: "1px solid rgba(124,58,237,0.3)",
  borderRadius: 12,
  fontFamily: "var(--font-mono)",
};

/* ── Component ──────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getStoredUser();

  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");

  const [plData, setPlData] = useState<ProfitLossRecord[]>([]);
  const [plLoading, setPlLoading] = useState(true);
  const [plError, setPlError] = useState<string | null>(null);

  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendResponse | null>(null);
  const [profitMargin, setProfitMargin] = useState<ProfitMarginResponse | null>(null);
  const [epsGrowth, setEpsGrowth] = useState<EPSGrowthResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [screenerScore, setScreenerScore] = useState<ScreenerScoreResponse | null>(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [mlError, setMlError] = useState<string | null>(null);

  const [apiCalls, setApiCalls] = useState<number | null>(null);

  const loadData = useCallback(async (symbol: string) => {
    setPlLoading(true); setPlError(null);
    setMlLoading(true); setMlError(null);
    try {
      const result = await fetchProfitLoss({ company: symbol });
      setPlData(result.items.sort((a, b) => a.year - b.year));
    } catch { setPlError("Failed to load financial data."); }
    finally { setPlLoading(false); }

    try {
      const [rt, pm, eg, an, ss] = await Promise.all([
        fetchRevenueTrend(symbol), fetchProfitMargin(symbol),
        fetchEpsGrowth(symbol), fetchAnomalies(symbol), fetchScreenerScore(symbol),
      ]);
      setRevenueTrend(rt); setProfitMargin(pm);
      setEpsGrowth(eg); setAnomalies(an); setScreenerScore(ss);
    } catch { setMlError("Failed to load ML insights."); }
    finally { setMlLoading(false); }
  }, []);

  useEffect(() => { loadData(selectedSymbol); }, [selectedSymbol, loadData]);

  useEffect(() => {
    fetchUsageStats()
      .then((usage) => { const total = usage.reduce((s, u) => s + u.request_count, 0); setApiCalls(total); })
      .catch(() => setApiCalls(null));
  }, []);

  const handleLogout = () => { clearSession(); router.push("/login"); };

  const scoreColor = (score: number) => {
    if (score >= 71) return "#22C55E";
    if (score >= 41) return "#F4B942";
    return "#EF4444";
  };

  const directionChip = (dir: string) => {
    if (dir === "growing" || dir === "improving")
      return <Chip label={dir} size="small" sx={{ bgcolor: "rgba(34,197,94,0.15)", color: "#22C55E", fontWeight: 600 }} />;
    if (dir === "declining" || dir === "deteriorating")
      return <Chip label={dir} size="small" sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444", fontWeight: 600 }} />;
    return <Chip label={dir} size="small" sx={{ bgcolor: "rgba(148,163,184,0.15)", color: "#94A3B8", fontWeight: 600 }} />;
  };

  const formatNum = (n: number | null | undefined) => {
    if (n == null) return "—";
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return n.toLocaleString("en-IN");
  };

  return (
    <ProtectedRoute>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* ── Sidebar ───────────────────────────────── */}
        <Box
          sx={{
            width: SIDEBAR_WIDTH, flexShrink: 0,
            background: "rgba(5,1,15,0.7)", backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(124,58,237,0.15)",
            position: "fixed", top: 0, left: 0, bottom: 0,
            display: "flex", flexDirection: "column", py: 3, px: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 4, px: 1, cursor: "pointer" }} onClick={() => router.push("/")}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
            <Typography sx={{ fontWeight: 800, fontSize: 18 }} className="gradient-text-purple">B100</Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>Intelligence</Typography>
          </Stack>

          <List sx={{ flex: 1 }}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <ListItemButton
                  key={item.label} onClick={() => router.push(item.href)}
                  sx={{
                    borderRadius: 2, mb: 0.5,
                    bgcolor: active ? "rgba(124,58,237,0.15)" : "transparent",
                    color: active ? "#F8FAFC" : "#94A3B8",
                    "&:hover": { bgcolor: "rgba(124,58,237,0.1)", color: "#F8FAFC" },
                  }}
                >
                  <ListItemIcon sx={{ color: active ? "#7C3AED" : "#94A3B8", minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />
                </ListItemButton>
              );
            })}
          </List>

          <Stack spacing={1.5} sx={{ px: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#7C3AED", fontSize: 14 }}>
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </Avatar>
              <Typography sx={{ fontSize: 13, color: "#94A3B8" }} noWrap>{user?.email || "User"}</Typography>
            </Stack>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: "#EF4444", "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}>
              <ListItemIcon sx={{ color: "#EF4444", minWidth: 40 }}><LogoutRoundedIcon /></ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </Stack>
        </Box>

        {/* ── Main Content ──────────────────────────── */}
        <Box sx={{ ml: `${SIDEBAR_WIDTH}px`, flex: 1, p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Dashboard</Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 14 }}>{user?.email || ""}</Typography>
          </Stack>

          {/* KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {[
              { label: "Companies Tracked", value: "92" },
              { label: "Data Range", value: "2011–2024" },
              { label: "ML Models Active", value: "5" },
              { label: "API Calls", value: apiCalls != null ? apiCalls.toLocaleString() : "—" },
            ].map((kpi) => (
              <Grid item xs={12} sm={6} md={3} key={kpi.label}>
                <GlassCard sx={{ p: 2.5 }}>
                  <Typography sx={{ color: "#94A3B8", fontSize: 13, fontWeight: 400, mb: 1 }}>{kpi.label}</Typography>
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700 }} className="gradient-text-purple">{kpi.value}</Typography>
                </GlassCard>
              </Grid>
            ))}
          </Grid>

          {/* Company Selector */}
          <Autocomplete
            options={SYMBOLS} value={selectedSymbol}
            onChange={(_, v) => v && setSelectedSymbol(v)}
            renderInput={(params) => (
              <TextField {...params} label="Select Company" sx={{
                maxWidth: 320, mb: 3,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(124,58,237,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(168,85,247,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
                },
              }} />
            )}
          />

          {/* Charts Row */}
          {plError && <Alert severity="error" sx={{ mb: 3 }}>{plError}</Alert>}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <GlassCard sx={{ height: 360, p: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Revenue Trend</Typography>
                {plLoading ? (
                  <Skeleton variant="rounded" height={260} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={plData}>
                      <CartesianGrid stroke="rgba(124,58,237,0.12)" vertical={false} />
                      <XAxis dataKey="year" stroke="#94A3B8" tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }} />
                      <YAxis stroke="#94A3B8" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => `${(v / 1e7).toFixed(0)}Cr`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatNum(v), "Revenue"]} />
                      <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </GlassCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <GlassCard sx={{ height: 360, p: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Profit After Tax</Typography>
                {plLoading ? (
                  <Skeleton variant="rounded" height={260} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={plData}>
                      <CartesianGrid stroke="rgba(124,58,237,0.12)" vertical={false} />
                      <XAxis dataKey="year" stroke="#94A3B8" tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }} />
                      <YAxis stroke="#94A3B8" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => `${(v / 1e7).toFixed(0)}Cr`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatNum(v), "PAT"]} />
                      <Line type="monotone" dataKey="profit_after_tax" stroke="#22C55E" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </GlassCard>
            </Grid>
          </Grid>

          {/* ML Insights Row */}
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>ML Insights — {selectedSymbol}</Typography>
          {mlError && <Alert severity="error" sx={{ mb: 3 }}>{mlError}</Alert>}
          <Grid container spacing={2.5}>
            {/* Revenue Trend */}
            <Grid item xs={12} sm={6} md={4}>
              <GlassCard sx={{ height: "100%", p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TrendingUpRoundedIcon sx={{ color: "#7C3AED" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Revenue Trend</Typography>
                  </Stack>
                  {mlLoading ? <Skeleton variant="rounded" height={80} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} /> : revenueTrend ? (
                    <Stack spacing={1}>
                      {directionChip(revenueTrend.result.direction)}
                      <Stack direction="row" spacing={2}>
                        <Box>
                          <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>Slope</Typography>
                          <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{revenueTrend.result.slope.toFixed(4)}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>R² Score</Typography>
                          <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{revenueTrend.result.r2_score.toFixed(4)}</Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  ) : null}
                </Stack>
              </GlassCard>
            </Grid>

            {/* Profit Margin */}
            <Grid item xs={12} sm={6} md={4}>
              <GlassCard sx={{ height: "100%", p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ShowChartRoundedIcon sx={{ color: "#7C3AED" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Profit Margin</Typography>
                  </Stack>
                  {mlLoading ? <Skeleton variant="rounded" height={80} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} /> : profitMargin ? (
                    <Stack spacing={1}>
                      <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "#F8FAFC" }}>
                        {profitMargin.result.average_margin_pct != null ? `${profitMargin.result.average_margin_pct.toFixed(2)}%` : "—"}
                      </Typography>
                      {directionChip(profitMargin.result.overall_trend)}
                    </Stack>
                  ) : null}
                </Stack>
              </GlassCard>
            </Grid>

            {/* EPS Growth */}
            <Grid item xs={12} sm={6} md={4}>
              <GlassCard sx={{ height: "100%", p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TrendingUpRoundedIcon sx={{ color: "#7C3AED" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>EPS Growth</Typography>
                  </Stack>
                  {mlLoading ? <Skeleton variant="rounded" height={80} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} /> : epsGrowth ? (
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={2}>
                        <Box>
                          <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>Best Year</Typography>
                          <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#22C55E" }}>
                            {epsGrowth.result.best_year.year}{" "}({epsGrowth.result.best_year.growth_pct != null ? `${epsGrowth.result.best_year.growth_pct.toFixed(1)}%` : "—"})
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>Worst Year</Typography>
                          <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#EF4444" }}>
                            {epsGrowth.result.worst_year.year}{" "}({epsGrowth.result.worst_year.growth_pct != null ? `${epsGrowth.result.worst_year.growth_pct.toFixed(1)}%` : "—"})
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  ) : null}
                </Stack>
              </GlassCard>
            </Grid>

            {/* Anomalies */}
            <Grid item xs={12} sm={6} md={4}>
              <GlassCard sx={{ height: "100%", p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WarningAmberRoundedIcon sx={{ color: "#F4B942" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Anomalies</Typography>
                  </Stack>
                  {mlLoading ? <Skeleton variant="rounded" height={80} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} /> : anomalies ? (
                    <Stack spacing={1}>
                      <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: anomalies.result.anomaly_count > 0 ? "#EF4444" : "#22C55E" }}>
                        {anomalies.result.anomaly_count}
                      </Typography>
                      <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>anomalous years detected</Typography>
                      {anomalies.result.metrics.revenue.length > 0 && (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {anomalies.result.metrics.revenue.map((a) => (
                            <Chip key={a.year} label={a.year} size="small" sx={{ bgcolor: "rgba(239,68,68,0.12)", color: "#EF4444", fontFamily: "var(--font-mono)", fontSize: 12, mb: 0.5 }} />
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  ) : null}
                </Stack>
              </GlassCard>
            </Grid>

            {/* Screener Score */}
            <Grid item xs={12} sm={6} md={4}>
              <GlassCard sx={{ height: "100%", p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ScoreboardRoundedIcon sx={{ color: "#7C3AED" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Screener Score</Typography>
                  </Stack>
                  {mlLoading ? <Skeleton variant="circular" width={80} height={80} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} /> : screenerScore ? (
                    <Stack alignItems="center" spacing={1}>
                      <Box sx={{ position: "relative", display: "inline-flex" }}>
                        <CircularProgress variant="determinate" value={screenerScore.result.score} size={80} thickness={5}
                          sx={{ color: scoreColor(screenerScore.result.score), "& .MuiCircularProgress-circle": { strokeLinecap: "round" } }} />
                        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: scoreColor(screenerScore.result.score) }}>
                            {screenerScore.result.score}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>out of 100</Typography>
                    </Stack>
                  ) : null}
                </Stack>
              </GlassCard>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}
