import { getAdminSettingsAction } from "@/actions/admin/settings";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsPageClient } from "./SettingsPageClient";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const result = await getAdminSettingsAction();

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-gray-900">
              Impossible de charger les paramètres pour le moment.
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez réessayer plus tard ou contacter le support technique.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <SettingsPageClient initialData={result.data} />;
}


