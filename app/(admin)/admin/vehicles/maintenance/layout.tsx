import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance des véhicules - Administration",
  description:
    "Planifiez et suivez les opérations de maintenance de la flotte depuis l'espace d'administration.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VehiclesMaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8 w-full">{children}</div>
  );
}

