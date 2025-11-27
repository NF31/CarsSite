import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Modifier une réservation - Administration",
  description: "Modifiez les informations d'une réservation existante.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminBookingEditLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>;
}

