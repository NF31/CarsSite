"use client";

import { Suspense, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useURLParams, useVerifyEmail, useResendVerification } from "./hooks";
import {
  VerifyEmailHeader,
  SuccessView,
  WaitingView,
  ErrorView,
  LoadingView,
} from "./components";

function VerifyEmailContent() {
  const {
    token,
    email,
    status: urlStatus,
    message: urlMessage,
    devToken,
    setStatus: setUrlStatus,
    setMessage: setUrlMessage,
  } = useURLParams();

  const {
    status: verifyStatus,
    message: verifyMessage,
    verifyEmail,
  } = useVerifyEmail();

  const {
    isResending,
    error: resendError,
    status: resendStatus,
    message: resendMessage,
    resendVerification,
  } = useResendVerification();

  const hasVerifiedRef = useRef<string | null>(null);

  // Synchroniser les états
  const finalStatus = verifyStatus || resendStatus || urlStatus;
  const finalMessage = verifyMessage || resendMessage || urlMessage;

  // Vérifier automatiquement si token présent et pas en mode dev
  useEffect(() => {
    if (token && !devToken && urlStatus === "loading" && hasVerifiedRef.current !== token) {
      hasVerifiedRef.current = token;
      verifyEmail(token);
    }
  }, [token, devToken, urlStatus, verifyEmail]);

  // Synchroniser les messages de resend avec l'état principal
  useEffect(() => {
    if (resendStatus) {
      setUrlStatus(resendStatus);
      if (resendMessage) {
        setUrlMessage(resendMessage);
      }
    }
  }, [resendStatus, resendMessage, setUrlStatus, setUrlMessage]);

  const handleResendVerification = () => {
    if (email) {
      resendVerification(email);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-md">
        <VerifyEmailHeader status={finalStatus} message={finalMessage} />
        <CardContent className="space-y-4">
          {finalStatus === "success" && <SuccessView message={finalMessage} />}

          {finalStatus === "waiting" && (
            <WaitingView
              message={finalMessage}
              error={resendError}
              devToken={devToken}
              email={email}
              isResending={isResending}
              onVerifyEmail={verifyEmail}
              onResendVerification={handleResendVerification}
            />
          )}

          {finalStatus === "error" && (
            <ErrorView
              message={finalMessage}
              email={email}
              isResending={isResending}
              onResendVerification={handleResendVerification}
            />
          )}

          {finalStatus === "loading" && <LoadingView />}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4">
            <LoadingView />
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
