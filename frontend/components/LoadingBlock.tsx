"use client";

import { Card, CardContent, Skeleton, Stack } from "@mui/material";

type LoadingBlockProps = {
  lines?: number;
  height?: number;
};

export default function LoadingBlock({ lines = 4, height = 280 }: LoadingBlockProps) {
  return (
    <Card sx={{ height }}>
      <CardContent>
        <Stack spacing={1.5}>
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              variant={index === 0 ? "text" : "rounded"}
              height={index === 0 ? 28 : 48}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

