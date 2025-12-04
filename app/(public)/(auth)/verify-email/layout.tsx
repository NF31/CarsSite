import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification d'email - CarRental",
  description: "Vérifiez votre adresse email pour activer votre compte",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}

