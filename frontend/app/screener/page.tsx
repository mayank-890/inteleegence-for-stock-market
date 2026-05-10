"use client";

import {
  Alert,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import TopBar from "@/components/TopBar";
import { CompanyListItem, fetchScreener } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";

type SortField = "company_name" | "sector_name" | "revenue" | "profit_after_tax" | "basic_eps";

export default function ScreenerPage() {
  const router = useRouter();
  const user = getStoredUser();
  const [rows, setRows] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("company_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const loadRows = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchScreener({ page_size: 100 });
        setRows(response.items);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Unable to load the screener.");
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const lower = search.toLowerCase();
    const base = search
      ? rows.filter((row) => row.company_name.toLowerCase().includes(lower))
      : rows;

    return [...base].sort((left, right) => {
      const leftValue = left[sortField] ?? "";
      const rightValue = right[sortField] ?? "";

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      return sortDirection === "asc"
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue));
    });
  }, [rows, search, sortField, sortDirection]);

  const requestSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };

  return (
    <ProtectedRoute>
      <TopBar
        title="Screener"
        subtitle="Sortable company intelligence for the Nifty 100 universe."
        userLabel={user?.email}
        onLogout={() => {
          clearSession();
          window.location.href = "/login";
        }}
      />

      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Stack spacing={3}>
          <TextField
            label="Search by company name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ maxWidth: 420 }}
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === "company_name"}
                      direction={sortDirection}
                      onClick={() => requestSort("company_name")}
                    >
                      Company
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === "sector_name"}
                      direction={sortDirection}
                      onClick={() => requestSort("sector_name")}
                    >
                      Sector
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === "revenue"}
                      direction={sortDirection}
                      onClick={() => requestSort("revenue")}
                    >
                      Revenue
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === "profit_after_tax"}
                      direction={sortDirection}
                      onClick={() => requestSort("profit_after_tax")}
                    >
                      Profit after tax
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === "basic_eps"}
                      direction={sortDirection}
                      onClick={() => requestSort("basic_eps")}
                    >
                      Basic EPS
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">Loading screener rows...</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow
                      key={row.company_id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => router.push(`/company/${row.ticker_symbol}`)}
                    >
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={600}>{row.company_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {row.ticker_symbol}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.sector_name}</TableCell>
                      <TableCell align="right">
                        {row.revenue == null ? "N/A" : row.revenue.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell align="right">
                        {row.profit_after_tax == null ? "N/A" : row.profit_after_tax.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell align="right">
                        {row.basic_eps == null ? "N/A" : row.basic_eps.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}

