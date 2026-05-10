import type { Metadata } from "next";
import { ReactNode } from "react";

import Providers from "@/components/Providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "B100 Intelligence",
  description: "Financial intelligence platform for Nifty 100 companies."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

