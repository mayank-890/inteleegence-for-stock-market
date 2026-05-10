"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import ErrorState from "@/components/ErrorState";
import LoadingBlock from "@/components/LoadingBlock";

type SeriesConfig = {
  key: string;
  label: string;
  color: string;
};

type CompanyChartProps = {
  title: string;
  data: Record<string, string | number | null>[];
  xKey: string;
  type: "line" | "bar";
  series: SeriesConfig[];
  loading?: boolean;
  error?: string | null;
  height?: number;
};

export default function CompanyChart({
  title,
  data,
  xKey,
  type,
  series,
  loading,
  error,
  height = 320
}: CompanyChartProps) {
  if (loading) {
    return <LoadingBlock height={height + 40} />;
  }

  return (
    <Card sx={{ height: height + 40 }}>
      <CardContent sx={{ height: "100%" }}>
        <Stack spacing={2} sx={{ height: "100%" }}>
          <Typography variant="h6">{title}</Typography>
          {error ? (
            <ErrorState message={error} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {type === "line" ? (
                <LineChart data={data}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey={xKey} stroke="#B6C2D9" />
                  <YAxis stroke="#B6C2D9" />
                  <Tooltip
                    contentStyle={{
                      background: "#101D33",
                      border: "1px solid rgba(244, 185, 66, 0.18)",
                      borderRadius: 12
                    }}
                  />
                  <Legend />
                  {series.map((entry) => (
                    <Line
                      key={entry.key}
                      type="monotone"
                      dataKey={entry.key}
                      name={entry.label}
                      stroke={entry.color}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={data}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey={xKey} stroke="#B6C2D9" />
                  <YAxis stroke="#B6C2D9" />
                  <Tooltip
                    contentStyle={{
                      background: "#101D33",
                      border: "1px solid rgba(244, 185, 66, 0.18)",
                      borderRadius: 12
                    }}
                  />
                  <Legend />
                  {series.map((entry) => (
                    <Bar
                      key={entry.key}
                      dataKey={entry.key}
                      name={entry.label}
                      fill={entry.color}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

