import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer une réservation - Administration",
  description: "Planifiez une réservation manuelle pour un client.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminBookingAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto w-full max-w-5xl space-y-6">{children}</div>;
}



