import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - CarRental",
  description: "Contactez-nous pour toute question concernant la location de véhicules",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

