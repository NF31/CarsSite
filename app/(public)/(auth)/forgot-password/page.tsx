"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useForgotPasswordSubmit } from "./hooks";
import {
  ForgotPasswordHeader,
  SuccessMessage,
  ForgotPasswordForm,
  BackToLoginLink,
} from "./components";

export default function ForgotPasswordPage() {
  const { form, isLoading, error, success, onSubmit } =
    useForgotPasswordSubmit();

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <ForgotPasswordHeader />
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          {success ? (
            <SuccessMessage />
          ) : (
            <ForgotPasswordForm
              form={form}
              onSubmit={onSubmit}
              isLoading={isLoading}
              error={error}
            />
          )}

          <BackToLoginLink />
        </CardContent>
      </Card>
    </div>
  );
}

