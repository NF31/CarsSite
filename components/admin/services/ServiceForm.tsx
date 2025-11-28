"use client";

import { Form } from "@/components/ui/form";
import type { SingleServiceRecord } from "@/actions/admin/services";
import { useServiceForm } from "@/components/admin/services/hooks/useServiceForm";
import { useServiceSubmit } from "@/components/admin/services/hooks/useServiceSubmit";
import {
  ServiceFormHeader,
  FeedbackBanner,
  ServiceGeneralInfoCard,
  ServicePricingCard,
  ServiceAvailabilityCard,
  ServiceFormActions,
} from "@/components/admin/services/form";

interface ServiceFormProps {
  mode: "create" | "edit";
  service?: SingleServiceRecord;
}

export function ServiceForm({ mode, service }: ServiceFormProps) {
  const {
    form,
    isEditMode,
    allCategories,
    setAllCategories,
    isActive,
    setIsActive,
    pricingType,
    selectedCategories,
  } = useServiceForm({ mode, service });

  const {
    onSubmit,
    serverError,
    setServerError,
    successMessage,
    isPending,
  } = useServiceSubmit({
    form,
    isEditMode,
    service,
    allCategories,
    isActive,
  });

  return (
    <div className="space-y-6">
      <ServiceFormHeader isEditMode={isEditMode} />

      {serverError && (
        <FeedbackBanner
          type="error"
          message={serverError}
          onDismiss={() => setServerError(null)}
        />
      )}

      {successMessage && (
        <FeedbackBanner type="success" message={successMessage} />
      )}

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <ServiceGeneralInfoCard
            form={form}
            isEditMode={isEditMode}
            isActive={isActive}
            setIsActive={setIsActive}
            isPending={isPending}
          />

          <ServicePricingCard
            form={form}
            pricingType={pricingType}
            isPending={isPending}
          />

          <ServiceAvailabilityCard
            form={form}
            allCategories={allCategories}
            setAllCategories={setAllCategories}
            selectedCategories={selectedCategories}
            isPending={isPending}
          />

          <ServiceFormActions isPending={isPending} isEditMode={isEditMode} />
        </form>
      </Form>
    </div>
  );
}

