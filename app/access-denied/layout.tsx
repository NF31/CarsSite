import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Accès Refusé - CarRental",
  description: "Vous n'avez pas les permissions pour accéder à cette page",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccessDeniedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {children}
    </div>
  );
}

