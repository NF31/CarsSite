import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion - CarRental",
  description: "Connectez-vous à votre compte pour réserver des véhicules",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}

