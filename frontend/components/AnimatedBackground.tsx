"use client";

import { motion } from "framer-motion";
import Box from "@mui/material/Box";

export default function AnimatedBackground() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "#05010F",
        pointerEvents: "none",
      }}
    >
      {/* Blob 1 — top-left purple */}
      <motion.div
        animate={{ x: [-20, 20], y: [-15, 15] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          willChange: "transform",
        }}
      />

      {/* Blob 2 — top-right violet */}
      <motion.div
        animate={{ x: [15, -15], y: [10, -10] }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-5%",
          right: "-8%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)",
          willChange: "transform",
        }}
      />

      {/* Blob 3 — bottom-center blue */}
      <motion.div
        animate={{ x: [-10, 10], y: [-20, 5] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "30%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          willChange: "transform",
        }}
      />

      {/* Grid overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.6,
        }}
      />
    </Box>
  );
}
