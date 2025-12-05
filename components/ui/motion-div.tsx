"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

// Lazy load motion.div pour éviter de charger framer-motion dans le bundle initial
const MotionDivBase = dynamic(
  async () => {
    const { motion } = await import("@/components/ui/motion");
    return motion.div;
  },
  { ssr: false }
);

type MotionDivProps = ComponentProps<typeof MotionDivBase>;

export function MotionDivWrapper(props: MotionDivProps) {
  return <MotionDivBase {...props} />;
}

