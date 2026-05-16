"use client";

import { motion } from "framer-motion";
import {
  Alert, Box, Container, Divider, Grid, Skeleton, Stack, Typography,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Plan, fetchPlans } from "@/lib/api";
import AnimatedBackground from "@/components/AnimatedBackground";
import FloatingParticles from "@/components/FloatingParticles";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";
import MotionSection from "@/components/MotionSection";

/* ── static data (unchanged) ─────────────────── */
const tickerItems = [
  { symbol: "RELIANCE", change: "+2.3%", up: true },
  { symbol: "TCS", change: "-0.8%", up: false },
  { symbol: "INFY", change: "+1.2%", up: true },
  { symbol: "HDFC", change: "+0.5%", up: true },
  { symbol: "ICICI", change: "+1.8%", up: true },
  { symbol: "WIPRO", change: "-0.3%", up: false },
  { symbol: "BAJFINANCE", change: "+3.1%", up: true },
  { symbol: "AXISBANK", change: "+0.9%", up: true },
  { symbol: "MARUTI", change: "+2.1%", up: true },
  { symbol: "LT", change: "-0.4%", up: false },
];

const stats = [
  { value: "92", label: "Companies Tracked" },
  { value: "14", label: "Years of Data" },
  { value: "5", label: "ML Models Active" },
  { value: "3", label: "API Pricing Tiers" },
];

const features = [
  {
    icon: <BarChartRoundedIcon sx={{ fontSize: 24, color: "#A855F7" }} />,
    title: "Complete Financial Data",
    body: "Full P&L, Balance Sheet, and Cash Flow statements for all 92 Nifty 100 companies covering 2011 to 2024.",
  },
  {
    icon: <TrendingUpRoundedIcon sx={{ fontSize: 24, color: "#A855F7" }} />,
    title: "AI-Powered ML Insights",
    body: "Revenue trend detection, anomaly alerts, EPS growth analysis, and screener scores powered by scikit-learn.",
  },
  {
    icon: <CodeRoundedIcon sx={{ fontSize: 24, color: "#A855F7" }} />,
    title: "Developer API Access",
    body: "RESTful API with token auth, rate limiting by tier, and detailed documentation for seamless integration.",
  },
];

const companies = [
  { name: "Reliance Industries Ltd", symbol: "RELIANCE", sector: "Energy" },
  { name: "Tata Consultancy Services", symbol: "TCS", sector: "IT" },
  { name: "Infosys Ltd", symbol: "INFY", sector: "IT" },
  { name: "HDFC Bank Ltd", symbol: "HDFCBANK", sector: "Banking" },
  { name: "ICICI Bank Ltd", symbol: "ICICIBANK", sector: "Banking" },
  { name: "Wipro Ltd", symbol: "WIPRO", sector: "IT" },
  { name: "Bajaj Finance Ltd", symbol: "BAJFINANCE", sector: "Finance" },
  { name: "Axis Bank Ltd", symbol: "AXISBANK", sector: "Banking" },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Screener", href: "/screener" },
  { label: "Compare", href: "/dashboard" },
  { label: "Pricing", href: "/pricing" },
];

const trustItems = ["92 Companies", "14 Years of Data", "5 ML Models", "Free Tier Available"];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

/* ── component ───────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        setPlansError(null);
        setPlans(await fetchPlans());
      } catch {
        setPlansError("Unable to load pricing plans right now.");
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  return (
    <Box>
      <AnimatedBackground />
      <FloatingParticles count={15} />

      {/* ═══ NAVBAR ═══ */}
      <Box
        component={motion.nav}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        sx={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 64,
          background: "rgba(5,1,15,0.8)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(124,58,237,0.15)",
          display: "flex", alignItems: "center",
        }}
      >
        <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center" }}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 4, cursor: "pointer" }} onClick={() => router.push("/")}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
            <Typography sx={{ fontWeight: 800, fontSize: 20 }} className="gradient-text-purple">B100</Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 14, ml: 0.5 }}>Intelligence</Typography>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ flex: 1, display: { xs: "none", md: "flex" } }}>
            {navLinks.map((l) => (
              <Typography key={l.label} component={NextLink} href={l.href} sx={{ color: "#94A3B8", fontSize: 14, fontWeight: 500, transition: "color 0.2s", "&:hover": { color: "#F8FAFC" } }}>
                {l.label}
              </Typography>
            ))}
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography component={NextLink} href="/login" sx={{ color: "#94A3B8", fontSize: 14, fontWeight: 500, transition: "color 0.2s", "&:hover": { color: "#F8FAFC" }, display: { xs: "none", sm: "block" } }}>
              Log in
            </Typography>
            <GradientButton href="/login">Get Started</GradientButton>
          </Stack>
        </Container>
      </Box>

      {/* ═══ HERO ═══ */}
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", pt: "64px", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center", "&::after": { content: '""', position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,1,15,0.75) 0%, rgba(5,1,15,0.92) 60%, #05010F 100%)" } }} />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center", py: 10 }}>
          <motion.div {...fadeUp(0.2)}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "20px", px: 2, py: 0.75, mb: 4 }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
              <Typography sx={{ fontSize: 13, color: "#A855F7", fontWeight: 500 }}>AI-Powered Financial Intelligence Platform</Typography>
            </Box>
          </motion.div>

          <motion.div {...fadeUp(0.3)}>
            <Typography variant="h1" sx={{ fontSize: { xs: 40, md: 72 }, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#F8FAFC", mb: 3 }}>
              Financial Intelligence{" "}<br />for <span className="gradient-text">Nifty 100</span>
            </Typography>
          </motion.div>

          <motion.div {...fadeUp(0.4)}>
            <Typography sx={{ fontSize: 18, color: "#94A3B8", maxWidth: 540, mx: "auto", lineHeight: 1.7 }}>
              ML-powered analytics, real-time data, and institutional-grade insights for India&apos;s top 100 listed companies.
            </Typography>
          </motion.div>

          <motion.div {...fadeUp(0.5)}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mt: 5 }}>
              <GradientButton href="/login">Get Started Free →</GradientButton>
              <GradientButton variant="glass" href="/dashboard">View Demo</GradientButton>
            </Stack>
          </motion.div>

          <motion.div {...fadeUp(0.6)}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 6, flexWrap: "wrap" }}>
              {trustItems.map((item, i) => (
                <Stack key={item} direction="row" spacing={1} alignItems="center">
                  {i > 0 && <Typography sx={{ color: "rgba(124,58,237,0.4)", fontSize: 13 }}>·</Typography>}
                  <Typography sx={{ fontSize: 13, color: "#64748B" }}>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* ═══ TICKER ═══ */}
      <Box sx={{ background: "rgba(124,58,237,0.06)", borderTop: "1px solid rgba(124,58,237,0.12)", borderBottom: "1px solid rgba(124,58,237,0.12)", py: 1.25, overflow: "hidden" }}>
        <Box sx={{ display: "flex", width: "max-content", animation: "ticker-scroll 25s linear infinite" }}>
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <Typography key={i} sx={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: t.up ? "#10B981" : "#EF4444", whiteSpace: "nowrap", mx: 2.5 }}>
              {t.symbol} {t.change} {t.up ? "▲" : "▼"}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* ═══ STATS ═══ */}
      <MotionSection>
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Typography className="section-label" sx={{ textAlign: "center", mb: 6 }}>PLATFORM METRICS</Typography>
          <Grid container spacing={3}>
            {stats.map((s, i) => (
              <Grid item xs={6} md={3} key={s.label}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                  <GlassCard sx={{ p: 4, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }} className="gradient-text-purple">{s.value}</Typography>
                    <Typography sx={{ fontSize: 13, color: "#94A3B8", mt: 1 }}>{s.label}</Typography>
                  </GlassCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </MotionSection>

      {/* ═══ FEATURES ═══ */}
      <MotionSection>
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Typography className="section-label" sx={{ mb: 2 }}>WHY B100 INTELLIGENCE</Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 800, color: "#F8FAFC", mb: 1 }}>
            Everything you need for
          </Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 800, mb: 2 }} className="gradient-text">
            financial intelligence.
          </Typography>
          <Typography sx={{ color: "#94A3B8", maxWidth: 480, mb: 8 }}>Access comprehensive data, ML insights, and developer APIs — all in one platform.</Typography>

          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid item xs={12} md={4} key={f.title}>
                <GlassCard sx={{ p: 4, height: "100%" }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: "12px", background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))", display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5 }}>
                    {f.icon}
                  </Box>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#F8FAFC", mb: 1.5 }}>{f.title}</Typography>
                  <Typography sx={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.7 }}>{f.body}</Typography>
                  <Typography sx={{ fontSize: 14, color: "#7C3AED", mt: 2.5, cursor: "pointer", "&:hover": { color: "#A855F7" } }}>Learn more →</Typography>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </MotionSection>

      {/* ═══ COMPANIES ═══ */}
      <MotionSection>
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Typography className="section-label" sx={{ mb: 2 }}>COVERED COMPANIES</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Explore Nifty 100</Typography>
          <Typography sx={{ color: "#94A3B8", mb: 5 }}>Click any company to view full financials and ML insights.</Typography>

          <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            {companies.map((c) => (
              <GlassCard key={c.symbol} sx={{ minWidth: 180, flex: "0 0 auto", p: 2.5, cursor: "pointer" }} onClick={() => router.push(`/company/${c.symbol}`)}>
                <Typography sx={{ fontSize: 22, fontWeight: 800 }} className="gradient-text">{c.symbol}</Typography>
                <Typography sx={{ fontSize: 12, color: "#94A3B8", mt: 1, lineHeight: 1.3 }}>{c.name}</Typography>
                <Box sx={{ display: "inline-block", mt: 1.5, background: "rgba(124,58,237,0.15)", color: "#A855F7", fontSize: 11, fontWeight: 600, px: 1.25, py: 0.25, borderRadius: "20px" }}>{c.sector}</Box>
              </GlassCard>
            ))}
          </Box>
        </Container>
      </MotionSection>

      {/* ═══ PRICING ═══ */}
      <MotionSection>
        <Box sx={{ py: { xs: 8, md: 12 }, background: "rgba(124,58,237,0.02)", borderTop: "1px solid rgba(124,58,237,0.1)", borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography className="section-label" sx={{ mb: 2 }}>PRICING</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Simple, <span className="gradient-text">transparent</span> pricing</Typography>
              <Typography sx={{ color: "#94A3B8" }}>Start free and scale as your needs grow. No hidden fees.</Typography>
            </Box>

            {loadingPlans ? (
              <Grid container spacing={3}>
                {[0, 1, 2].map((i) => (
                  <Grid item xs={12} md={4} key={i}>
                    <Skeleton variant="rounded" height={420} sx={{ borderRadius: 4, bgcolor: "rgba(124,58,237,0.08)" }} />
                  </Grid>
                ))}
              </Grid>
            ) : plansError ? (
              <Alert severity="error">{plansError}</Alert>
            ) : (
              <Grid container spacing={3}>
                {plans.map((plan) => {
                  const isPopular = plan.tier === "basic";
                  return (
                    <Grid item xs={12} md={4} key={plan.tier}>
                      <GlassCard glow={isPopular} sx={{ p: 4, height: "100%", position: "relative", ...(isPopular && { border: "1px solid #7C3AED", boxShadow: "0 0 80px rgba(124,58,237,0.15)" }) }}>
                        {isPopular && (
                          <Box sx={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff", fontSize: 10, fontWeight: 700, px: 2, py: 0.5, borderRadius: "20px", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>MOST POPULAR</Box>
                        )}
                        <Typography sx={{ fontSize: 12, letterSpacing: "0.15em", color: "#A855F7", textTransform: "uppercase", fontWeight: 600 }}>{plan.tier}</Typography>
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 52, fontWeight: 800, color: "#F8FAFC", mt: 1 }}>{plan.price}</Typography>
                        <Divider sx={{ borderColor: "rgba(124,58,237,0.15)", my: 3 }} />
                        <Typography sx={{ fontSize: 14, color: "#94A3B8", mb: 3 }}>{plan.requests_per_day.toLocaleString()} requests per day</Typography>
                        <Stack spacing={1.5} sx={{ mb: 4 }}>
                          {plan.features.map((f) => (
                            <Stack key={f} direction="row" spacing={1.25} alignItems="center">
                              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16, color: "#7C3AED" }} />
                              <Typography sx={{ fontSize: 14, color: "#94A3B8" }}>{f}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                        <GradientButton variant={isPopular ? "primary" : "glass"} href="/login" fullWidth>Get Started</GradientButton>
                      </GlassCard>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Container>
        </Box>
      </MotionSection>

      {/* ═══ FOOTER ═══ */}
      <Box sx={{ borderTop: "1px solid rgba(124,58,237,0.12)", py: 6 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "center", md: "flex-start" }} spacing={3}>
            <Stack spacing={0.5} alignItems={{ xs: "center", md: "flex-start" }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
                <Typography sx={{ fontWeight: 800 }} className="gradient-text-purple">B100</Typography>
                <Typography sx={{ color: "#94A3B8", fontSize: 14 }}>Intelligence</Typography>
              </Stack>
              <Typography sx={{ color: "#64748B", fontSize: 14 }}>Financial intelligence for India&apos;s top 100 companies.</Typography>
            </Stack>
            <Stack direction="row" spacing={3}>
              {[{ label: "Pricing", href: "/pricing" }, { label: "Screener", href: "/screener" }, { label: "API Docs", href: "/api-keys" }].map((l) => (
                <Typography key={l.label} component={NextLink} href={l.href} sx={{ color: "#64748B", fontSize: 14, "&:hover": { color: "#94A3B8" } }}>{l.label}</Typography>
              ))}
            </Stack>
          </Stack>
          <Box sx={{ borderTop: "1px solid rgba(124,58,237,0.08)", mt: 4, pt: 3, textAlign: "center" }}>
            <Typography sx={{ color: "#64748B", fontSize: 13 }}>© 2026 B100 Intelligence. Built for financial professionals.</Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
