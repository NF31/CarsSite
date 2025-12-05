"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Lazy load MotionProvider (contient framer-motion) pour réduire le bundle initial
const MotionProvider = dynamic(
  () => import("@/components/providers/motion-provider").then((mod) => ({ default: mod.MotionProvider })),
  { ssr: false } // Pas de SSR pour éviter de charger framer-motion côté serveur
);

// Lazy load CookieConsent (contient framer-motion)
const CookieConsent = dynamic(
  () => import("@/components/layout/CookieConsent").then((mod) => ({ default: mod.CookieConsent })),
  { ssr: false }
);

type ClientMotionProviderProps = {
  children: ReactNode;
};

/**
 * Wrapper client component pour MotionProvider et CookieConsent
 * Permet d'utiliser ssr: false dans un Server Component parent
 */
export function ClientMotionProvider({ children }: ClientMotionProviderProps) {
  return (
    <>
      <MotionProvider>{children}</MotionProvider>
      <CookieConsent />
    </>
  );
}

