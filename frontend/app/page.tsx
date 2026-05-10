"use client";

import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import DataUsageRoundedIcon from "@mui/icons-material/DataUsageRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import NextLink from "next/link";
import { useEffect, useState } from "react";

import LoadingBlock from "@/components/LoadingBlock";
import { Plan, fetchPlans } from "@/lib/api";

const features = [
  {
    title: "Financial Data",
    description: "Profit & loss, balance sheet, and cash flow histories aligned to a warehouse-grade schema.",
    icon: <DataUsageRoundedIcon color="primary" />
  },
  {
    title: "ML Analytics",
    description: "Revenue trends, anomaly detection, and EPS growth intelligence generated on demand.",
    icon: <AutoGraphRoundedIcon color="primary" />
  },
  {
    title: "API Access",
    description: "Secure token and API key workflows for plugging intelligence into your own products.",
    icon: <KeyRoundedIcon color="primary" />
  }
];

export default function LandingPage() {
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
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          backgroundImage:
            "linear-gradient(rgba(10,22,40,0.76), rgba(10,22,40,0.92)), url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ maxWidth: 760 }}>
            <Chip label="Mini-Palantir for Nifty 100" color="primary" sx={{ width: "fit-content" }} />
            <Typography variant="h2">Financial Intelligence for Nifty 100</Typography>
            <Typography variant="h5" color="text.secondary">
              AI-powered analytics, ML insights, and real-time financial data for India&apos;s top 100 listed companies.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={NextLink}
                href="/register"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Get Started Free
              </Button>
              <Button component={NextLink} href="/pricing" variant="outlined" size="large">
                View Demo
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Stack spacing={6}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1.5 }}>
              Built for fast financial decisions
            </Typography>
            <Typography color="text.secondary">
              The platform is tuned for scanning, comparing, and drilling into company fundamentals without friction.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((feature) => (
              <Grid item xs={12} md={4} key={feature.title}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack spacing={2}>
                      {feature.icon}
                      <Typography variant="h6">{feature.title}</Typography>
                      <Typography color="text.secondary">{feature.description}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Straightforward pricing
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Start free, graduate into richer data access, and scale into product integrations.
            </Typography>

            {loadingPlans ? (
              <Grid container spacing={3}>
                {[0, 1, 2].map((entry) => (
                  <Grid item xs={12} md={4} key={entry}>
                    <LoadingBlock height={260} />
                  </Grid>
                ))}
              </Grid>
            ) : plansError ? (
              <Alert severity="error">{plansError}</Alert>
            ) : (
              <Grid container spacing={3}>
                {plans.map((plan) => (
                  <Grid item xs={12} md={4} key={plan.tier}>
                    <Card sx={{ height: "100%", borderColor: plan.tier === "basic" ? "primary.main" : undefined }}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ textTransform: "capitalize" }}>
                              {plan.tier}
                            </Typography>
                            {plan.tier === "basic" ? <Chip label="Popular" color="primary" /> : null}
                          </Stack>
                          <Typography variant="h4">{plan.price}</Typography>
                          <Typography color="text.secondary">
                            {plan.requests_per_day.toLocaleString()} requests per day
                          </Typography>
                          <Stack spacing={1}>
                            {plan.features.map((feature) => (
                              <Typography variant="body2" color="text.secondary" key={feature}>
                                • {feature}
                              </Typography>
                            ))}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

