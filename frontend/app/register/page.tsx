"use client";

import { Alert, Box, Stack, TextField, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { registerUser } from "@/lib/api";
import { setStoredUser, setToken } from "@/lib/auth";
import AnimatedBackground from "@/components/AnimatedBackground";
import FloatingParticles from "@/components/FloatingParticles";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "8px",
    "& fieldset": { borderColor: "rgba(124,58,237,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(168,85,247,0.4)" },
    "&.Mui-focused fieldset": { borderColor: "#7C3AED", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" },
  },
};

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
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <AnimatedBackground />
      <FloatingParticles count={10} />

      <Box sx={{ width: "100%", maxWidth: 420, mx: "auto", p: 3, position: "relative", zIndex: 1 }}>
        <GlassCard hover={false} sx={{ p: 5 }}>
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 3 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
                <Typography sx={{ fontWeight: 800, fontSize: 18 }} className="gradient-text-purple">B100</Typography>
                <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>Intelligence</Typography>
              </Stack>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#F8FAFC" }}>Create your workspace</Typography>
              <Typography sx={{ fontSize: 14, color: "#94A3B8", mt: 0.5 }}>
                Start exploring the Nifty 100 with a financial intelligence layer built for research.
              </Typography>
            </Box>

            {error ? <Alert severity="error" sx={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>{error}</Alert> : null}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} required sx={inputSx} />
                <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} required sx={inputSx} />
                <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} required sx={inputSx} />
                <GradientButton type="submit" fullWidth disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </GradientButton>
              </Stack>
            </Box>

            <Typography sx={{ textAlign: "center", fontSize: 14, color: "#64748B" }}>
              Already signed up?{" "}
              <Typography component={NextLink} href="/login" sx={{ color: "#A855F7", fontSize: 14, fontWeight: 600, "&:hover": { color: "#C084FC" } }}>
                Log in
              </Typography>
            </Typography>
          </Stack>
        </GlassCard>
      </Box>
    </Box>
  );
}
