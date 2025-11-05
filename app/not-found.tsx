import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Page Non Trouvée - CarRental",
  description: "La page demandée n'existe pas",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <AlertTriangle className="h-16 w-16 text-primary" />
            </div>
          </div>
          <CardTitle className="text-6xl font-bold text-gray-900 mb-2">
            404
          </CardTitle>
          <CardTitle className="text-2xl font-semibold text-gray-700 mb-2">
            Page Non Trouvée
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-3">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 transition-colors duration-200">
              <Link href="/" className="flex items-center justify-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Retour à l&apos;Accueil</span>
              </Link>
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,{" "}
                <Link
                  href="/contact"
                  className="text-primary hover:underline font-medium"
                >
                  contactez-nous
                </Link>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

