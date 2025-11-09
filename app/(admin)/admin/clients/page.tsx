import { getClientsAction } from "@/actions/admin/clients";
import { ClientsPageClient } from "@/components/admin/clients/ClientsPageClient";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const result = await getClientsAction({
    page: 1,
    limit: 12,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Impossible de charger les clients pour le moment. Veuillez réessayer plus tard.
        </CardContent>
      </Card>
    );
  }

  return <ClientsPageClient initialData={result.data} />;
}
