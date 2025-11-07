import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ajouter un service - Administration",
  description: "Créez un nouveau service additionnel pour vos réservations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminServiceAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="max-w-4xl mx-auto w-full">{children}</div>;
}

