import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllRefundsAction } from "@/actions/admin/refunds/get-all-refunds";
import { RefundsPageClient } from "./RefundsPageClient";

export default async function AdminRefundsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const result = await getAllRefundsAction();

  return <RefundsPageClient refunds={result.refunds || []} totalRefunded={result.totalRefunded || 0} error={result.error} />;
}

