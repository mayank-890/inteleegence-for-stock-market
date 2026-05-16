"use client";

import { motion } from "framer-motion";
import NextLink from "next/link";
import { ReactNode } from "react";

type GradientButtonProps = {
  children: ReactNode;
  variant?: "primary" | "glass";
  href?: string;
  onClick?: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function GradientButton({
  children,
  variant = "primary",
  href,
  onClick,
  fullWidth = false,
  disabled = false,
  type = "button",
}: GradientButtonProps) {
  const isPrimary = variant === "primary";

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 28px",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    outline: "none",
    color: "#fff",
    width: fullWidth ? "100%" : undefined,
    opacity: disabled ? 0.5 : 1,
    textDecoration: "none",
    ...(isPrimary
      ? {
          background: "linear-gradient(135deg, #7C3AED, #A855F7)",
          boxShadow: "0 0 30px rgba(124,58,237,0.4)",
        }
      : {
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "none",
        }),
  };

  const motionProps = {
    whileHover: disabled
      ? undefined
      : {
          scale: 1.02,
          boxShadow: isPrimary
            ? "0 0 50px rgba(124,58,237,0.6)"
            : "0 0 30px rgba(255,255,255,0.08)",
        },
    whileTap: disabled ? undefined : { scale: 0.98 },
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  };

  if (href) {
    return (
      <motion.div {...motionProps} style={{ width: fullWidth ? "100%" : undefined }}>
        <NextLink href={href} style={baseStyle}>
          {children}
        </NextLink>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
