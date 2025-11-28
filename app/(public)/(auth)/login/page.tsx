"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useURLParams, useLoginSubmit } from "./hooks";
import {
  LoginHeader,
  SuccessBanner,
  LoginForm,
  LoginLinks,
} from "./components";

export default function LoginPage() {
  const { showSuccess, urlError } = useURLParams();
  const { form, rememberMe, setRememberMe, isLoading, error, onSubmit } =
    useLoginSubmit();

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <LoginHeader />
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          {showSuccess && <SuccessBanner />}

          <LoginForm
            form={form}
            onSubmit={onSubmit}
            rememberMe={rememberMe}
            onRememberMeChange={setRememberMe}
            isLoading={isLoading}
            error={error}
            urlError={urlError}
          />

          <LoginLinks />
        </CardContent>
      </Card>
    </div>
  );
}


