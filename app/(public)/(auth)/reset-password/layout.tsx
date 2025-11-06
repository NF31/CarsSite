import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe - CarRental",
  description: "Créez un nouveau mot de passe sécurisé",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

