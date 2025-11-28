"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useFieldStates, useRegisterSubmit } from "./hooks";
import {
  RegisterHeader,
  RegisterForm,
  RegisterLinks,
} from "./components";

export default function RegisterPage() {
  const { form, isLoading, error, isFormValid, onSubmit } = useRegisterSubmit();
  const fieldStates = useFieldStates(form);

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <RegisterHeader />
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <RegisterForm
            form={form}
            onSubmit={onSubmit}
            isLoading={isLoading}
            error={error}
            isFormValid={isFormValid}
            fieldStates={fieldStates}
          />

          <RegisterLinks />
        </CardContent>
      </Card>
    </div>
  );
}
