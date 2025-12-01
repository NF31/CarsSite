"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

type ProfileMessagesProps = {
  error: string | null;
  success: string | null;
};

export function ProfileMessages({ error, success }: ProfileMessagesProps) {
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}
    </>
  );
}

