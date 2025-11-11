import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { getAdminNotificationData } from "@/lib/admin/notifications";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Facturation - Administration",
  description: "Consultez, téléchargez et envoyez les factures clients.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminInvoicesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const bookingNotifications = await getAdminNotificationData();

  return (
    <div className="flex min-h-screen flex-col">
      <AdminSidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <AdminNavbar session={session} bookingNotifications={bookingNotifications} />
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


