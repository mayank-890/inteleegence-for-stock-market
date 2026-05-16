"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import ProtectedRoute from "@/components/ProtectedRoute";
import {
  APIKeyRecord,
  UsageStat,
  fetchApiKeys,
  createApiKey,
  deleteApiKey,
  fetchUsageStats,
} from "@/lib/api";

/* ── Helpers ────────────────────────────────────────────────── */

const tableCellSx = {
  borderBottom: "1px solid rgba(124,58,237,0.15)",
  color: "#F8FAFC",
};

const monoSx = { fontFamily: "var(--font-mono)", fontWeight: 700 };

const tierColors: Record<string, { bg: string; color: string }> = {
  free: { bg: "rgba(148,163,184,0.15)", color: "#94A3B8" },
  basic: { bg: "rgba(124,58,237,0.15)", color: "#A855F7" },
  pro: { bg: "rgba(244,185,66,0.15)", color: "#F4B942" },
};

const maskKey = (key: string) => {
  if (key.length <= 8) return key;
  return `sk-****${key.slice(-4)}`;
};

/* ── Component ──────────────────────────────────────────────── */

export default function ApiKeysPage() {
  // Keys
  const [keys, setKeys] = useState<APIKeyRecord[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);

  // Usage
  const [usageData, setUsageData] = useState<{ day: string; requests: number }[]>([]);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTier, setNewTier] = useState<"free" | "basic" | "pro">("free");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Snackbar
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const data = await fetchApiKeys();
      setKeys(Array.isArray(data) ? data : (data as Record<string, unknown>).results as APIKeyRecord[] ?? (data as Record<string, unknown>).keys as APIKeyRecord[] ?? []);
    } catch {
      setKeysError("Failed to load API keys.");
    } finally {
      setKeysLoading(false);
    }
  }, []);

  const loadUsage = useCallback(async () => {
    try {
      const usage = await fetchUsageStats();
      // Aggregate by day
      const byDay: Record<string, number> = {};
      usage.forEach((u: UsageStat) => {
        byDay[u.day] = (byDay[u.day] || 0) + u.request_count;
      });
      setUsageData(
        Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, requests]) => ({ day, requests }))
      );
    } catch {
      /* usage is non-critical */
    }
  }, []);

  useEffect(() => {
    loadKeys();
    loadUsage();
  }, [loadKeys, loadUsage]);

  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createApiKey({ name: newName, tier: newTier });
      setDialogOpen(false);
      setNewName("");
      setNewTier("free");
      loadKeys();
      setSnackMsg("API key created successfully.");
    } catch {
      setCreateError("Failed to create key.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      await deleteApiKey(id);
      loadKeys();
      setSnackMsg("API key revoked.");
    } catch {
      setSnackMsg("Failed to revoke key.");
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setSnackMsg("Key copied to clipboard.");
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
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            API Key Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", "&:hover": { boxShadow: "0 0 30px rgba(124,58,237,0.4)" } }}
          >
            Create New Key
          </Button>
        </Stack>

        {/* Keys Table */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 0 }}>
            {keysLoading ? (
              <Stack spacing={1} sx={{ p: 3 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={48} sx={{ bgcolor: "rgba(124,58,237,0.08)" }} />
                ))}
              </Stack>
            ) : keysError ? (
              <Alert severity="error" sx={{ m: 2 }}>{keysError}</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Name", "Key", "Tier", "Created", "Actions"].map((h) => (
                        <TableCell key={h} sx={{ ...tableCellSx, color: "#94A3B8", fontWeight: 600 }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {keys.map((k) => {
                      const tc = tierColors[k.tier] || tierColors.free;
                      return (
                        <TableRow key={k.id} sx={{ "&:hover": { bgcolor: "rgba(124,58,237,0.06)" } }}>
                          <TableCell sx={tableCellSx}>{k.name}</TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx, fontSize: 13 }}>
                            {maskKey(k.key)}
                          </TableCell>
                          <TableCell sx={tableCellSx}>
                            <Chip
                              label={k.tier}
                              size="small"
                              sx={{
                                bgcolor: tc.bg,
                                color: tc.color,
                                fontWeight: 600,
                                textTransform: "capitalize",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ ...tableCellSx, ...monoSx, fontSize: 13 }}>
                            {new Date(k.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={tableCellSx}>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Copy key">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopy(k.key)}
                                  sx={{ color: "#7C3AED" }}
                                >
                                  <ContentCopyRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Revoke key">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRevoke(k.id)}
                                  sx={{ color: "#EF4444" }}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {keys.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ ...tableCellSx, textAlign: "center", py: 4 }}>
                          <Typography sx={{ color: "#94A3B8" }}>
                            No API keys yet. Create one to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Usage Chart */}
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>
          API Usage
        </Typography>
        <Card>
          <CardContent sx={{ p: 3 }}>
            {usageData.length === 0 ? (
              <Typography sx={{ color: "#94A3B8", textAlign: "center", py: 4 }}>
                No usage data available yet.
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageData}>
                  <CartesianGrid stroke="rgba(124,58,237,0.12)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#94A3B8"
                    tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "rgba(5,1,15,0.95)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      borderRadius: 12,
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                  <Bar
                    dataKey="requests"
                    name="Requests"
                    fill="#7C3AED"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Create Key Dialog ─────────────────────────────── */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          PaperProps={{
            sx: {
              background: "rgba(5,1,15,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: 3,
              minWidth: 380,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Create New API Key</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {createError && <Alert severity="error">{createError}</Alert>}
              <TextField
                label="Key Name"
                fullWidth
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255,255,255,0.04)",
                    "& fieldset": { borderColor: "rgba(124,58,237,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(168,85,247,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
                  },
                }}
              />
              <Box>
                <Typography sx={{ color: "#94A3B8", fontSize: 12, mb: 0.5 }}>Tier</Typography>
                <Select
                  fullWidth
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as "free" | "basic" | "pro")}
                  sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124,58,237,0.2)" } }}
                >
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                </Select>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ color: "#94A3B8" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!newName.trim() || createLoading}
              sx={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
            >
              {createLoading ? "Creating…" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={!!snackMsg}
          autoHideDuration={3000}
          onClose={() => setSnackMsg(null)}
          message={snackMsg}
        />
      </Box>
    </ProtectedRoute>
  );
}
