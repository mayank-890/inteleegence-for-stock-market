"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Alert, Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect, useState } from "react";

import LoadingBlock from "@/components/LoadingBlock";
import { Plan, fetchPlans } from "@/lib/api";

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        setPlans(await fetchPlans());
      } catch {
        setError("Pricing plans could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Stack spacing={3} sx={{ mb: 5 }}>
        <Typography variant="h3">Pricing</Typography>
        <Typography color="text.secondary">
          Choose the access level that matches your workflow, from research-grade fundamentals to product-grade integrations.
        </Typography>
      </Stack>

      {loading ? (
        <Grid container spacing={3}>
          {[0, 1, 2].map((entry) => (
            <Grid item xs={12} md={4} key={entry}>
              <LoadingBlock height={300} />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.tier}>
              <Card
                sx={{
                  height: "100%",
                  borderColor: plan.tier === "basic" ? "primary.main" : undefined
                }}
              >
                <CardContent sx={{ height: "100%" }}>
                  <Stack spacing={2.5} sx={{ height: "100%" }}>
                    <Box>
                      <Typography variant="h5" sx={{ textTransform: "capitalize", mb: 1 }}>
                        {plan.tier}
                      </Typography>
                      {plan.tier === "basic" ? (
                        <Typography color="primary.main" fontWeight={700}>
                          Most Popular
                        </Typography>
                      ) : null}
                    </Box>
                    <Typography variant="h3">{plan.price}</Typography>
                    <Typography color="text.secondary">
                      {plan.requests_per_day.toLocaleString()} requests per day
                    </Typography>
                    <Stack spacing={1.5} sx={{ flex: 1 }}>
                      {plan.features.map((feature) => (
                        <Stack key={feature} direction="row" spacing={1.5} alignItems="center">
                          <CheckRoundedIcon color="primary" fontSize="small" />
                          <Typography color="text.secondary">{feature}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Button component={NextLink} href="/register" variant={plan.tier === "basic" ? "contained" : "outlined"}>
                      Get Started
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

