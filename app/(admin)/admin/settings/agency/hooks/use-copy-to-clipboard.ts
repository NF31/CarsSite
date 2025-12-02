import { useCallback, useState } from "react";

type CopyField = "address" | "phone" | "email" | null;

interface UseCopyToClipboardReturn {
  copiedField: CopyField;
  handleCopy: (value: string, field: Exclude<CopyField, null>) => void;
}

/**
 * Hook pour gérer le copier-coller vers le presse-papiers
 */
export function useCopyToClipboard(
  onError?: (error: string) => void
): UseCopyToClipboardReturn {
  const [copiedField, setCopiedField] = useState<CopyField>(null);

  const handleCopy = useCallback(
    (value: string, field: Exclude<CopyField, null>) => {
      if (!value) {
        return;
      }

      navigator.clipboard
        ?.writeText(value)
        .then(() => {
          setCopiedField(field);
          setTimeout(() => {
            setCopiedField((prev) => (prev === field ? null : prev));
          }, 2000);
        })
        .catch(() => {
          onError?.("Impossible de copier cette valeur.");
        });
    },
    [onError]
  );

  return { copiedField, handleCopy };
}

