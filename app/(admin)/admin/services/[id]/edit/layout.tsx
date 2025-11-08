import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modifier un service - Administration",
  description: "Mettez à jour les informations d'un service additionnel.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminServiceEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="max-w-4xl mx-auto w-full">{children}</div>;
}


