"use client";

import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { login } from "@/lib/api";
import { setStoredUser, setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await login(email, password);
      setToken(response.token);
      setStoredUser({ email, name: email.split("@")[0] });
      router.push(searchParams.get("next") || "/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Welcome back
              </Typography>
              <Typography color="text.secondary">
                Sign in to continue into your B100 Intelligence workspace.
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </Stack>
            </Box>

            <Typography color="text.secondary">
              New here?{" "}
              <Typography component={NextLink} href="/register" color="primary.main">
                Create an account
              </Typography>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

