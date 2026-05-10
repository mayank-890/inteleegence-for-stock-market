"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { ReactNode } from "react";

import theme from "@/theme";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

