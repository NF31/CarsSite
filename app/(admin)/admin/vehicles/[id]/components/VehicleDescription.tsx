import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface VehicleDescriptionProps {
  description: string;
}

export const VehicleDescription = memo(function VehicleDescription({
  description,
}: VehicleDescriptionProps) {
  if (!description) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
      </CardContent>
    </Card>
  );
});

