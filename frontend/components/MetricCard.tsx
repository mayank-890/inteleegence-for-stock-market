"use client";

import { Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon?: ReactNode;
  loading?: boolean;
};

export default function MetricCard({ title, value, subtitle, icon, loading }: MetricCardProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {icon}
          </Stack>
          {loading ? (
            <>
              <Skeleton variant="text" width="60%" height={46} />
              <Skeleton variant="text" width="80%" height={24} />
            </>
          ) : (
            <>
              <Typography variant="h4">{value}</Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

