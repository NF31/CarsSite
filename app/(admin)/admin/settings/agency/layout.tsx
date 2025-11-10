import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paramètres agence - Administration",
  description:
    "Modifiez l'identité, les coordonnées et les horaires de votre agence principale.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AgencySettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


