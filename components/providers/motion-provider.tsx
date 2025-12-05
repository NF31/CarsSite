"use client";

import { ReactNode } from "react";
import { LazyMotion } from "framer-motion";

type MotionProviderProps = {
  children: ReactNode;
};

/**
 * MotionProvider optimisé avec chargement asynchrone de domAnimation
 * pour réduire la taille du bundle initial
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion 
      features={() => import("framer-motion").then((mod) => mod.domAnimation)} 
      strict
    >
      {children}
    </LazyMotion>
  );
}

