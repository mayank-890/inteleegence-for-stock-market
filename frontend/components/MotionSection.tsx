"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type MotionSectionProps = {
  children: ReactNode;
  delay?: number;
};

export default function MotionSection({
  children,
  delay = 0,
}: MotionSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
