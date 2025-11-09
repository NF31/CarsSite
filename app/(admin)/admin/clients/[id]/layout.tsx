import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fiche client - Administration",
  description: "Consultez les informations détaillées d'un client et son historique de réservations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminClientDetailsLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">{children}</div>;
}


