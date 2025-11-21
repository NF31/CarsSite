import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales - CarRental",
  description: "Mentions légales et informations sur l'entreprise CarRental",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalNoticesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

