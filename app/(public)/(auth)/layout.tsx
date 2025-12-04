import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentification - CarRental",
  description: "Inscription et vérification de compte",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}

