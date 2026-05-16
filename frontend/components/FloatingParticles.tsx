"use client";

import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import { useMemo } from "react";

type Particle = {
  id: number;
  x: string;
  y: string;
  size: number;
  dur: number;
  delay: number;
  opacity: number;
};

export default function FloatingParticles({ count = 20 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() => {
    const rng = (min: number, max: number) => min + Math.random() * (max - min);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: `${rng(2, 98)}%`,
      y: `${rng(2, 98)}%`,
      size: rng(3, 6),
      dur: rng(4, 8),
      delay: rng(0, 4),
      opacity: rng(0.15, 0.5),
    }));
  }, [count]);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{ y: [-30, 30], opacity: [p.opacity * 0.5, p.opacity] }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background:
              p.id % 2 === 0
                ? "rgba(124,58,237,0.4)"
                : "rgba(168,85,247,0.2)",
            willChange: "transform, opacity",
          }}
        />
      ))}
    </Box>
  );
}
