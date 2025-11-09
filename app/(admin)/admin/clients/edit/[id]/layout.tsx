import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Modifier un client - Administration",
  description: "Mettez à jour les informations d'un client enregistré.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminClientEditLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8 py-6">{children}</div>;
}



