import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface VehicleMetadataProps {
  createdAt: Date;
  updatedAt: Date;
}

export const VehicleMetadata = memo(function VehicleMetadata({
  createdAt,
  updatedAt,
}: VehicleMetadataProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Informations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Créé le</span>
          <span className="font-medium">
            {format(new Date(createdAt), "dd MMMM yyyy", { locale: fr })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Modifié le</span>
          <span className="font-medium">
            {format(new Date(updatedAt), "dd MMMM yyyy", { locale: fr })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

