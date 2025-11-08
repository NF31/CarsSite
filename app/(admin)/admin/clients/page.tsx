import { getClientsAction } from "@/actions/admin/clients";
import { ClientsPageClient } from "@/components/admin/clients/ClientsPageClient";

export const revalidate = 0;

export default async function AdminClientsPage() {
  const initialResult = await getClientsAction({
    page: 1,
    limit: 12,
    status: "active",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return <ClientsPageClient initialData={initialResult.success ? initialResult.data : undefined} />;
}


