import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription - CarRental",
  description: "Créez votre compte pour réserver des véhicules en ligne",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}

