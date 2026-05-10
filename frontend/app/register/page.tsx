"use client";

import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { registerUser } from "@/lib/api";
import { setStoredUser, setToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await registerUser({ name, email, password });
      setToken(response.token);
      setStoredUser(response.user || { email, name });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
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
                Create your workspace
              </Typography>
              <Typography color="text.secondary">
                Start exploring the Nifty 100 with a financial intelligence layer built for research.
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField label="Name" fullWidth value={name} onChange={(event) => setName(event.target.value)} required />
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
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </Stack>
            </Box>

            <Typography color="text.secondary">
              Already signed up?{" "}
              <Typography component={NextLink} href="/login" color="primary.main">
                Log in
              </Typography>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

