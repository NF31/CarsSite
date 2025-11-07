import { ServicesPageClient } from "./ServicesPageClient";
import { getServicesAction } from "@/actions/admin/services/get-services";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const result = await getServicesAction();

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Impossible de charger les services pour le moment. Veuillez réessayer plus tard.
        </CardContent>
      </Card>
    );
  }

  return (
    <ServicesPageClient
      services={result.data.services}
      summary={result.data.summary}
    />
  );
}

