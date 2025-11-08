import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Détails de la réservation - Administration",
  description: "Consultez toutes les informations d'une réservation client.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminBookingDetailsLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">{children}</div>;
}


