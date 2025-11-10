import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Calendrier des réservations - Administration",
  description:
    "Visualisez les réservations confirmées, en cours et terminées directement dans un calendrier interactif.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminBookingsCalendarLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <div className="mx-auto w-full max-w-5xl space-y-6">{children}</div>;

}
