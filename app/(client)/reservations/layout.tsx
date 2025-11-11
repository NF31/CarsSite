import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes réservations - CarRental",
  description: "Consultez et gérez l'ensemble de vos réservations.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ReservationsLayout({
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


