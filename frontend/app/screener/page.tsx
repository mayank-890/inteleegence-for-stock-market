"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import GlassCard from "@/components/GlassCard";
import { CompanyListItem, fetchScreener } from "@/lib/api";

/* ── Constants ──────────────────────────────────────────────── */

const SECTORS = [
  "All Sectors",
  "Banking",
  "IT",
  "Energy",
  "Finance",
  "Pharma",
  "FMCG",
  "Auto",
  "Cement",
  "Metals",
  "Telecom",
  "Infrastructure",
];

const YEARS = Array.from({ length: 14 }, (_, i) => 2024 - i);

type SortKey = "company_name" | "ticker_symbol" | "revenue" | "profit_after_tax" | "basic_eps";

const tableCellSx = {
  borderBottom: "1px solid rgba(124,58,237,0.15)",
  color: "#F8FAFC",
};
const monoSx = { fontFamily: "var(--font-mono)", fontWeight: 700 };

const formatNum = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return n.toLocaleString("en-IN");
};

/* ── Component ──────────────────────────────────────────────── */

export default function ScreenerPage() {
  const router = useRouter();

  // Filters
  const [sector, setSector] = useState("All Sectors");
  const [minRevenue, setMinRevenue] = useState("");
  const [minPat, setMinPat] = useState("");
  const [minEps, setMinEps] = useState("");
  const [year, setYear] = useState<number>(2024);

  // Data
  const [results, setResults] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("company_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | undefined> = {};
      if (sector !== "All Sectors") params.sector = sector;
      if (minRevenue) params.min_revenue = Number(minRevenue);
      if (minPat) params.min_profit = Number(minPat);
      if (minEps) params.min_eps = Number(minEps);
      params.year = year;
      const data = await fetchScreener(params);
      const items = data.items;
      const unique = Object.values(
        items.reduce((acc, item) => {
          const key = item.ticker_symbol ?? item.company_name;
          if (!acc[key]) acc[key] = item;
          return acc;
        }, {} as Record<string, typeof items[0]>)
      );
      setResults(unique);
    } catch {
      setError("Failed to load screener results.");
    } finally {
      setLoading(false);
    }
  }, [sector, minRevenue, minPat, minEps, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReset = () => {
    setSector("All Sectors");
    setMinRevenue("");
    setMinPat("");
    setMinEps("");
    setYear(2024);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;
    const cmp = typeof valA === "string"
      ? valA.localeCompare(valB as string)
      : (valA as number) - (valB as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      background: "rgba(255,255,255,0.03)",
      "& fieldset": { borderColor: "rgba(124,58,237,0.2)" },
      "&:hover fieldset": { borderColor: "rgba(168,85,247,0.4)" },
      "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
    },
  };

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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Company Screener
        </Typography>

        <Grid container spacing={3}>
          {/* ── Left Filter Panel ───────────────────────────── */}
          <Grid item xs={12} md={3}>
            <GlassCard hover={false} sx={{ p: 2.5 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FilterListRoundedIcon sx={{ color: "#7C3AED" }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Filters
                    </Typography>
                  </Stack>

                  <Box>
                    <Typography sx={{ color: "#94A3B8", fontSize: 12, mb: 0.5 }}>Sector</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124,58,237,0.2)" } }}
                    >
                      {SECTORS.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </Box>

                  <TextField
                    label="Min Revenue"
                    type="number"
                    size="small"
                    fullWidth
                    value={minRevenue}
                    onChange={(e) => setMinRevenue(e.target.value)}
                    sx={inputSx}
                  />

                  <TextField
                    label="Min Profit After Tax"
                    type="number"
                    size="small"
                    fullWidth
                    value={minPat}
                    onChange={(e) => setMinPat(e.target.value)}
                    sx={inputSx}
                  />

                  <TextField
                    label="Min EPS"
                    type="number"
                    size="small"
                    fullWidth
                    value={minEps}
                    onChange={(e) => setMinEps(e.target.value)}
                    sx={inputSx}
                  />

                  <Box>
                    <Typography sx={{ color: "#94A3B8", fontSize: 12, mb: 0.5 }}>Year</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124,58,237,0.2)" } }}
                    >
                      {YEARS.map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </Select>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={loadData}
                    sx={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", "&:hover": { boxShadow: "0 0 30px rgba(124,58,237,0.4)" } }}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="text"
                    fullWidth
                    onClick={handleReset}
                    sx={{ color: "#94A3B8" }}
                  >
                    Reset
                  </Button>
                </Stack>
            </GlassCard>
          </Grid>

          {/* ── Right Results Table ─────────────────────────── */}
          <Grid item xs={12} md={9}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Results
              </Typography>
              <Chip
                label={results.length}
                size="small"
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  bgcolor: "rgba(124,58,237,0.15)",
                  color: "#A855F7",
                }}
              />
            </Stack>

            <GlassCard hover={false} sx={{ overflow: "hidden" }}>
                {loading ? (
                  <Stack spacing={1} sx={{ p: 3 }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} variant="rounded" height={40} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                    ))}
                  </Stack>
                ) : error ? (
                  <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                ) : (
                  <TableContainer sx={{ maxHeight: "70vh" }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          {(
                            [
                              { key: "company_name" as SortKey, label: "Company" },
                              { key: "ticker_symbol" as SortKey, label: "Symbol" },
                              { key: "revenue" as SortKey, label: "Revenue" },
                              { key: "profit_after_tax" as SortKey, label: "PAT" },
                              { key: "basic_eps" as SortKey, label: "EPS" },
                            ] as const
                          ).map((col) => (
                            <TableCell
                              key={col.key}
                              sx={{
                                ...tableCellSx,
                                color: "#94A3B8",
                                fontWeight: 600,
                                bgcolor: "rgba(5,1,15,0.9)",
                              }}
                            >
                              <TableSortLabel
                                active={sortKey === col.key}
                                direction={sortKey === col.key ? sortDir : "asc"}
                                onClick={() => handleSort(col.key)}
                                sx={{
                                  color: "#94A3B8 !important",
                                  "& .MuiTableSortLabel-icon": { color: "#7C3AED !important" },
                                }}
                              >
                                {col.label}
                              </TableSortLabel>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedResults.map((row) => (
                          <TableRow
                            key={row.company_id}
                            hover
                            onClick={() => router.push(`/company/${row.ticker_symbol}`)}
                            sx={{
                              cursor: "pointer",
                              "&:hover": { bgcolor: "rgba(124,58,237,0.06)" },
                            }}
                          >
                            <TableCell sx={tableCellSx}>{row.company_name}</TableCell>
                            <TableCell sx={{ ...tableCellSx, ...monoSx, color: "#A855F7" }}>
                              {row.ticker_symbol}
                            </TableCell>
                            <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.revenue)}</TableCell>
                            <TableCell sx={{ ...tableCellSx, ...monoSx }}>{formatNum(row.profit_after_tax)}</TableCell>
                            <TableCell sx={{ ...tableCellSx, ...monoSx }}>
                              {row.basic_eps != null ? row.basic_eps.toFixed(2) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
            </GlassCard>
          </Grid>
        </Grid>
      </Box>
    </ProtectedRoute>
  );
}
