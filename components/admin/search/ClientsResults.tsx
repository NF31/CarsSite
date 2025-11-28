import { memo } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Client {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

interface ClientsResultsProps {
  clients: Client[];
}

export const ClientsResults = memo(function ClientsResults({
  clients,
}: ClientsResultsProps) {
  if (clients.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Clients ({clients.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium">{client.name || client.email}</div>
              <div className="text-sm text-muted-foreground">
                {client.email}
                {client.phone && ` • ${client.phone}`}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

