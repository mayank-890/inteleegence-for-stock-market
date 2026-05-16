"use client";

import { motion } from "framer-motion";
import { Alert, Box, Stack, TextField, Typography } from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import AnimatedBackground from "@/components/AnimatedBackground";
import FloatingParticles from "@/components/FloatingParticles";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const bullets = [
  "92 Nifty 100 companies covered",
  "14 years of financial data",
  "5 ML analytical models",
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(username, password);
      setToken(data.token);
      router.push(next);
    } catch {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      background: "rgba(255,255,255,0.04)",
      borderRadius: "8px",
      "& fieldset": { borderColor: "rgba(124,58,237,0.2)" },
      "&:hover fieldset": { borderColor: "rgba(168,85,247,0.4)" },
      "&.Mui-focused fieldset": { borderColor: "#7C3AED", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" },
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", position: "relative" }}>
      <AnimatedBackground />
      <FloatingParticles count={12} />

      {/* ── Left panel ── */}
      <Box sx={{ width: "50%", display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "center", p: 10, borderRight: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.03)", position: "relative", zIndex: 1 }}>
        <motion.div {...fadeUp(0.1)}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 8 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
            <Typography sx={{ fontWeight: 800, fontSize: 20 }} className="gradient-text-purple">B100</Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 14 }}>Intelligence</Typography>
          </Stack>
        </motion.div>

        <motion.div {...fadeUp(0.2)}>
          <Typography sx={{ fontSize: 40, fontWeight: 800, color: "#F8FAFC", lineHeight: 1.2, mb: 5 }}>
            Financial intelligence<br />for <span className="gradient-text">professionals.</span>
          </Typography>
        </motion.div>

        <Stack spacing={2}>
          {bullets.map((b, i) => (
            <motion.div key={b} {...fadeUp(0.3 + i * 0.1)}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircleOutlineRoundedIcon sx={{ fontSize: 12, color: "#10B981" }} />
                </Box>
                <Typography sx={{ fontSize: 15, color: "#94A3B8" }}>{b}</Typography>
              </Stack>
            </motion.div>
          ))}
        </Stack>

        <Typography sx={{ mt: "auto", pt: 8, fontSize: 14, color: "#64748B", fontStyle: "italic" }}>
          Join analysts and developers using B100 to make smarter financial decisions.
        </Typography>
      </Box>

      {/* ── Right panel ── */}
      <Box sx={{ width: { xs: "100%", md: "50%" }, display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 3, md: 5 }, position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ width: "100%", maxWidth: 400 }}>
          <GlassCard hover={false} sx={{ p: 5 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Box>
                  <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#F8FAFC" }}>Welcome back</Typography>
                  <Typography sx={{ fontSize: 14, color: "#94A3B8", mt: 0.5 }}>Sign in to your account</Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>{error}</Alert>
                )}

                <TextField id="login-username" label="Username" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" sx={inputSx} />
                <TextField id="login-password" label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" sx={inputSx} />

                <Box sx={{ mt: 1 }}>
                  <GradientButton type="submit" fullWidth disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                  </GradientButton>
                </Box>

                <Typography sx={{ textAlign: "center", fontSize: 14, color: "#64748B" }}>
                  Don&apos;t have an account?{" "}
                  <Typography component={NextLink} href="/register" sx={{ color: "#A855F7", fontSize: 14, fontWeight: 600, "&:hover": { color: "#C084FC" } }}>
                    Get started free
                  </Typography>
                </Typography>
              </Stack>
            </form>
          </GlassCard>
        </motion.div>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
