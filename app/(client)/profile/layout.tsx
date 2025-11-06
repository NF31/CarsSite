import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon profil - CarRental",
  description: "Gérez vos informations personnelles et votre compte",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}

