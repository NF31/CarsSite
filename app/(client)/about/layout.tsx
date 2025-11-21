import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - CarRental",
  description: "Contactez-nous pour toute question concernant la location de véhicules",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function AboutLayout({
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

