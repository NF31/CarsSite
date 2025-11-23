import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes factures | CarRental",
  description: "Consultez et téléchargez toutes vos factures",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function InvoicesLayout({
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

