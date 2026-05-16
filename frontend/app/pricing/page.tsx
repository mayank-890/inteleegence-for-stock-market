"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Plan, fetchPlans } from "@/lib/api";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";
import AnimatedBackground from "@/components/AnimatedBackground";

/* ── FAQ Data ───────────────────────────────────────────────── */

const faqs = [
  {
    q: "Can I upgrade anytime?",
    a: "Yes, upgrades take effect immediately.",
  },
  {
    q: "Is there a free trial?",
    a: "Our Free tier is free forever with 100 requests/day.",
  },
  {
    q: "What counts as a request?",
    a: "Every API call to any endpoint counts as one request.",
  },
  {
    q: "Do unused requests roll over?",
    a: "No, limits reset daily at midnight UTC.",
  },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Screener", href: "/screener" },
  { label: "Compare", href: "/dashboard" },
  { label: "Pricing", href: "/pricing" },
];

/* ── Component ──────────────────────────────────────────────── */

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPlans()
      .then(setPlans)
      .catch(() => setError("Unable to load pricing plans right now."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <AnimatedBackground />
      {/* ── Navbar ──────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: "rgba(5,1,15,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(124,58,237,0.15)",
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1200,
            width: "100%",
            mx: "auto",
            px: { xs: 2, md: 3 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 4, cursor: "pointer" }} onClick={() => router.push("/")}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
            <Typography sx={{ fontWeight: 800, fontSize: 20 }} className="gradient-text-purple">B100</Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 14 }}>Intelligence</Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={3}
            sx={{ flex: 1, display: { xs: "none", md: "flex" } }}
          >
            {navLinks.map((link) => (
              <Typography
                key={link.label}
                component={NextLink}
                href={link.href}
                sx={{
                  color: link.href === "/pricing" ? "#F8FAFC" : "#94A3B8",
                  fontSize: 14,
                  fontWeight: 500,
                  transition: "color 0.2s",
                  "&:hover": { color: "#F8FAFC" },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography component={NextLink} href="/login" sx={{ color: "#94A3B8", fontSize: 14, fontWeight: 500, "&:hover": { color: "#F8FAFC" } }}>Log in</Typography>
            <GradientButton href="/login">Get Started</GradientButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ── Hero ────────────────────────────────────────────── */}
      <Box
        sx={{
          pt: 16,
          pb: 8,
          textAlign: "center",
          position: "relative",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, mb: 2 }}
          >
            Simple, transparent pricing
          </Typography>
          <Typography
            sx={{ color: "#94A3B8", fontSize: 18, maxWidth: 540, mx: "auto" }}
          >
            Start free and scale as your data needs grow. No hidden fees.
          </Typography>
        </Container>
      </Box>

      {/* ── Pricing Cards ───────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 6, mt: -4 }}>
        {loading ? (
          <Grid container spacing={3}>
            {[0, 1, 2].map((i) => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton
                  variant="rounded"
                  height={420}
                  sx={{ borderRadius: 4, bgcolor: "rgba(124,58,237,0.08)" }}
                />
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={3}>
            {plans.map((plan) => {
              const isPopular = plan.tier === "basic";
              return (
                <Grid item xs={12} md={4} key={plan.tier}>
                  <GlassCard glow={isPopular} sx={{ height: "100%", position: "relative", p: 4, ...(isPopular && { border: "1px solid #7C3AED", boxShadow: "0 0 80px rgba(124,58,237,0.15)" }) }}>
                    {isPopular && (
                      <Box sx={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff", fontSize: 10, fontWeight: 700, px: 2, py: 0.5, borderRadius: "20px", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>MOST POPULAR</Box>
                    )}
                      <Stack spacing={3}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {plan.tier}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 42,
                            fontWeight: 700,
                            color: "#F8FAFC",
                          }}
                        >
                          {plan.price}
                        </Typography>
                        <Typography sx={{ color: "#94A3B8", fontSize: 15 }}>
                          {plan.requests_per_day.toLocaleString()} requests per day
                        </Typography>
                        <Divider sx={{ borderColor: "rgba(124,58,237,0.15)" }} />
                        <Stack spacing={1.5}>
                          {plan.features.map((feature) => (
                            <Stack
                              key={feature}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <CheckCircleOutlineRoundedIcon
                                sx={{ fontSize: 18, color: "#22C55E" }}
                              />
                              <Typography sx={{ fontSize: 14, color: "#94A3B8" }}>
                                {feature}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                        <GradientButton variant={isPopular ? "primary" : "glass"} href="/login" fullWidth>Get Started</GradientButton>
                      </Stack>
                  </GlassCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* ── FAQ Section ─────────────────────────────────────── */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, textAlign: "center", mb: 4 }}
        >
          Frequently Asked Questions
        </Typography>

        <Stack spacing={1.5}>
          {faqs.map((faq) => (
            <Accordion
              key={faq.q}
              sx={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(124,58,237,0.2)",
                borderRadius: "12px !important",
                "&:before": { display: "none" },
                "&.Mui-expanded": { margin: 0 },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#94A3B8" }} />}
              >
                <Typography sx={{ fontWeight: 600 }}>{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "#94A3B8" }}>{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>

      {/* ── Footer ──────────────────────────────────────────── */}
      <Box
        sx={{
          background: "rgba(5,1,15,0.5)",
          borderTop: "1px solid rgba(124,58,237,0.12)",
          py: 5,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "center", md: "flex-start" }}
            spacing={3}
          >
            <Stack spacing={0.5} alignItems={{ xs: "center", md: "flex-start" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                B100 Intelligence
              </Typography>
              <Typography sx={{ color: "#94A3B8", fontSize: 14 }}>
                Financial intelligence for India&apos;s top 100 companies.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3}>
              {[
                { label: "Pricing", href: "/pricing" },
                { label: "API Docs", href: "/api-keys" },
                { label: "Screener", href: "/screener" },
              ].map((link) => (
                <Typography
                  key={link.label}
                  component={NextLink}
                  href={link.href}
                  sx={{
                    color: "#94A3B8",
                    fontSize: 14,
                    transition: "color 0.2s",
                    "&:hover": { color: "#F8FAFC" },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
            <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>
              © 2024 B100 Intelligence
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
