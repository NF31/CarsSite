import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos - CarRental",
  description: "Découvrez CarRental, votre spécialiste de la location de véhicules. Large choix, tarifs transparents, réservation en ligne simple.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

