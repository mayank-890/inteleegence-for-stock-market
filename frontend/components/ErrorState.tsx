"use client";

import { Alert, Button, Stack } from "@mui/material";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Stack spacing={2}>
      <Alert severity="error">{message}</Alert>
      {onRetry ? (
        <Button variant="outlined" color="primary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Stack>
  );
}

