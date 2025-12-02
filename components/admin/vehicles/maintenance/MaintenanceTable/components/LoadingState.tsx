import { Card } from "@/components/ui/card";

export function LoadingState() {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="p-10 flex flex-col gap-4">
        <div className="h-6 w-64 bg-muted animate-pulse rounded" />
        <div className="h-32 w-full bg-muted animate-pulse rounded" />
      </div>
    </Card>
  );
}

