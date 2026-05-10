"use client";

import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { FormEvent, useEffect, useMemo, useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import TopBar from "@/components/TopBar";
import { APIKeyRecord, UsageStat, createApiKey, deleteApiKey, fetchApiKeys, fetchUsageStats } from "@/lib/api";
import { clearSession, getStoredUser, setApiKey } from "@/lib/auth";

export default function ApiKeysPage() {
  const user = getStoredUser();
  const [keys, setKeys] = useState<APIKeyRecord[]>([]);
  const [usage, setUsage] = useState<UsageStat[]>([]);
  const [name, setName] = useState("");
  const [tier, setTier] = useState<"free" | "basic" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const [keysResponse, usageResponse] = await Promise.all([fetchApiKeys(), fetchUsageStats()]);
      setKeys(keysResponse);
      setUsage(usageResponse);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const usageByKey = useMemo(() => {
    return usage.reduce<Record<number, UsageStat[]>>((accumulator, entry) => {
      const current = accumulator[entry.api_key_id] || [];
      current.push(entry);
      accumulator[entry.api_key_id] = current;
      return accumulator;
    }, {});
  }, [usage]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const created = await createApiKey({ name, tier });
      setApiKey(created.key);
      setSuccess(`Created API key "${created.name}". It has been stored locally for browser requests.`);
      setName("");
      setTier("free");
      await loadPage();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to create API key.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      await deleteApiKey(id);
      await loadPage();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to revoke API key.");
    }
  };

  return (
    <ProtectedRoute>
      <TopBar
        title="API Keys"
        subtitle="Create keys, assign tiers, and keep an eye on how integrations are using the platform."
        userLabel={user?.email}
        onLogout={() => {
          clearSession();
          window.location.href = "/login";
        }}
      />

      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Stack spacing={2.5} component="form" onSubmit={handleCreate}>
                  <Typography variant="h6">Create a new key</Typography>
                  <TextField label="Key name" value={name} onChange={(event) => setName(event.target.value)} required />
                  <TextField select label="Tier" value={tier} onChange={(event) => setTier(event.target.value as "free" | "basic" | "pro")}>
                    <MenuItem value="free">Free</MenuItem>
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="pro">Pro</MenuItem>
                  </TextField>
                  <Button type="submit" variant="contained" disabled={submitting}>
                    {submitting ? "Creating..." : "Create key"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Stack spacing={2}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}

              {loading ? (
                <Alert severity="info">Loading API keys...</Alert>
              ) : (
                keys.map((key) => (
                  <Card key={key.id}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                          <Stack spacing={0.5}>
                            <Typography variant="h6">{key.name}</Typography>
                            <Typography color="text.secondary" sx={{ textTransform: "capitalize" }}>
                              Tier: {key.tier}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={1}>
                            <IconButton
                              color="primary"
                              onClick={() => {
                                navigator.clipboard.writeText(key.key);
                                setSuccess(`Copied "${key.name}" to your clipboard.`);
                              }}
                            >
                              <ContentCopyRoundedIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDelete(key.id)}>
                              <DeleteOutlineRoundedIcon />
                            </IconButton>
                          </Stack>
                        </Stack>

                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "rgba(255,255,255,0.03)",
                            overflowX: "auto"
                          }}
                        >
                          {key.key}
                        </Typography>

                        <Divider />

                        <Stack spacing={1}>
                          <Typography variant="subtitle2">Usage stats</Typography>
                          {(usageByKey[key.id] || []).length === 0 ? (
                            <Typography color="text.secondary">No usage logged yet.</Typography>
                          ) : (
                            (usageByKey[key.id] || []).map((entry) => (
                              <Typography key={`${entry.api_key_id}-${entry.endpoint}-${entry.day}`} color="text.secondary">
                                {entry.day} • {entry.endpoint} • {entry.request_count} requests
                              </Typography>
                            ))
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </ProtectedRoute>
  );
}

