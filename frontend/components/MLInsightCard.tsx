"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

import ErrorState from "@/components/ErrorState";
import LoadingBlock from "@/components/LoadingBlock";

type MLInsightCardProps = {
  title: string;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
};

export default function MLInsightCard({ title, loading, error, children }: MLInsightCardProps) {
  if (loading) {
    return <LoadingBlock height={220} />;
  }

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{title}</Typography>
          {error ? <ErrorState message={error} /> : children}
        </Stack>
      </CardContent>
    </Card>
  );
}

