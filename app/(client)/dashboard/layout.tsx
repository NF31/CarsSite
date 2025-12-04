import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tableau de bord - CarRental",
  description: "Gérez vos réservations et votre profil",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Les admins peuvent accéder au dashboard client, pas de redirection

  return <>{children}</>;
}

