"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessDeniedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, ne pas rediriger automatiquement
    // Laisser l'utilisateur voir la page d'accès refusé
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="max-w-md w-full shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
          Accès Refusé
        </CardTitle>
        <CardDescription className="text-lg text-gray-600">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {session ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-gray-500">
              Vous êtes connecté en tant que <span className="font-medium">{session.user?.email}</span> mais n&apos;avez pas les permissions nécessaires.
            </p>
            <p className="text-sm text-destructive font-medium">
              Accès refusé - Contactez l&apos;administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-gray-500">
              Vous devez être connecté pour accéder à cette page.
            </p>
          </div>
        )}

        <div className="space-y-3 pt-4">
          {!session ? (
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Se connecter</span>
            </Button>
          ) : (
            <Button
              onClick={() => router.push(session.user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard")}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour au tableau de bord</span>
            </Button>
          )}

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3 px-6 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Retour à l&apos;accueil</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

