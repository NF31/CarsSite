import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

export const ClientsSkeleton = memo(function ClientsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="animate-pulse border border-slate-100">
          <CardContent className="space-y-4 p-6">
            <div className="h-6 w-1/2 rounded bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 rounded bg-slate-100" />
              <div className="h-4 rounded bg-slate-100" />
              <div className="h-4 rounded bg-slate-100" />
            </div>
            <div className="h-20 rounded bg-slate-100" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

