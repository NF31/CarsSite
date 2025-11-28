import { memo } from "react";

export const LoadingView = memo(function LoadingView() {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">
        Veuillez patienter pendant la vérification...
      </p>
    </div>
  );
});

