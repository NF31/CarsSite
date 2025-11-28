"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useFieldStates, useResetPasswordSubmit } from "./hooks";
import {
  InvalidTokenView,
  SuccessView,
  ResetPasswordHeader,
  ResetPasswordForm,
} from "./components";

export default function ResetPasswordPage() {
  const { form, isLoading, error, success, tokenValid, token, onSubmit } =
    useResetPasswordSubmit();
  
  const fieldStates = useFieldStates(form);

  if (tokenValid === false) {
    return <InvalidTokenView error={error} />;
  }

  if (success) {
    return <SuccessView />;
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <ResetPasswordHeader />
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <ResetPasswordForm
            form={form}
            onSubmit={onSubmit}
            isLoading={isLoading}
            error={error}
            token={token}
            fieldStates={fieldStates}
          />
        </CardContent>
      </Card>
    </div>
  );
}

