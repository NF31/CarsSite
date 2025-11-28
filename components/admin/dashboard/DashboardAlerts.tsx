import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardAlertsProps {
  alerts: Array<{
    type: "reservation" | "maintenance";
    message: string;
    count: number;
  }>;
}

export const DashboardAlerts = memo(function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-900">Alertes</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-orange-800">{alert.message}</span>
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800 border-orange-300"
              >
                {alert.count}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

