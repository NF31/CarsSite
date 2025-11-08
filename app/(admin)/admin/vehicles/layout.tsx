import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestion des Véhicules - Administration",
  description: "Gérez tous les véhicules de la flotte",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminVehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminSidebar />
      <div className="flex flex-col flex-1 lg:pl-64">
        <AdminNavbar session={session} />
        <main className="flex-1 overflow-x-hidden">
          <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

