"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy load Header et Footer (contiennent framer-motion) pour réduire le bundle initial
const Header = dynamic(
  () => import("./header").then((mod) => ({ default: mod.Header })),
  { ssr: false }
);

const Footer = dynamic(
  () => import("./footer").then((mod) => ({ default: mod.Footer })),
  { ssr: false }
);

export function ConditionalHeaderFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}

