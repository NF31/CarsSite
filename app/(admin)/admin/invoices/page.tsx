import { getInvoicesAction } from "@/actions/admin/invoices/get-invoices";
import { InvoicesPageClient } from "@/components/admin/invoices/InvoicesPageClient";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const result = await getInvoicesAction();

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Impossible de charger les factures pour le moment. Veuillez réessayer plus tard.
        </CardContent>
      </Card>
    );
  }

  return (
    <InvoicesPageClient
      invoices={result.data.invoices}
      summary={result.data.summary}
      clients={result.data.clients}
    />
  );
}


