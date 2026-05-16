"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { SxProps, Theme } from "@mui/material";
import { forwardRef, ReactNode } from "react";
import Box from "@mui/material/Box";

type GlassCardProps = {
  children: ReactNode;
  hover?: boolean;
  glow?: boolean;
  sx?: SxProps<Theme>;
} & Omit<HTMLMotionProps<"div">, "children" | "style">;

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, hover = true, glow = false, sx, ...motionProps }, ref) => {
    return (
      <Box
        ref={ref}
        component={motion.div}
        whileHover={
          hover
            ? {
                y: -4,
                transition: { type: "spring", stiffness: 300, damping: 30 },
              }
            : undefined
        }
        {...motionProps}
        sx={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: "16px",
          boxShadow: glow
            ? "0 0 60px rgba(124,58,237,0.15)"
            : "0 0 40px rgba(124,58,237,0.06)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          "&:hover": hover
            ? {
                borderColor: "rgba(168,85,247,0.4)",
                boxShadow: "0 0 60px rgba(124,58,237,0.18)",
              }
            : undefined,
          ...sx,
        }}
      >
        {children}
      </Box>
    );
  }
);

GlassCard.displayName = "GlassCard";
export default GlassCard;
