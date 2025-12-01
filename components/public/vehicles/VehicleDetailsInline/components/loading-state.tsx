import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

