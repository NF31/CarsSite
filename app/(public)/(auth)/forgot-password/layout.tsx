import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié - CarRental",
  description: "Réinitialisez votre mot de passe en toute sécurité",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

