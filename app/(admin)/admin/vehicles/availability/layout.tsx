import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disponibilité des véhicules - Administration",
  description: "Gérer la disponibilité et les blocages de dates pour les véhicules",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminVehiclesAvailabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="max-w-7xl mx-auto w-full">{children}</div>;
}

