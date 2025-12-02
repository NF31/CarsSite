"use client";

import type { AdminAgencySettings } from "@/types/admin-settings";
import { useAgencyForm, useCopyToClipboard, useAgencySettingsSubmit } from "./hooks";
import { AgencyHeader, AgencyPreviewCard, AgencyForm } from "./components";

interface AgencySettingsPageClientProps {
  initialAgency: AdminAgencySettings;
}

export default function AgencySettingsPageClient({
  initialAgency,
}: AgencySettingsPageClientProps) {
  const { form, setErrors, getError, updateField, resetForm } = useAgencyForm(initialAgency);
  const { isPending, message, setMessage, handleSubmit } = useAgencySettingsSubmit(setErrors);
  const { copiedField, handleCopy } = useCopyToClipboard((error) => {
    setMessage({ type: "error", text: error });
  });

  const handleReset = () => {
    resetForm();
    setMessage(null);
  };

  return (
    <div className="space-y-8">
      <AgencyHeader onReset={handleReset} isPending={isPending} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <AgencyPreviewCard form={form} copiedField={copiedField} onCopy={handleCopy} />
        </div>

        <AgencyForm
          form={form}
          message={message}
          onMessageClose={() => setMessage(null)}
          getError={getError}
          updateField={updateField}
          onSubmit={handleSubmit(form)}
        />
      </div>
    </div>
  );
}
