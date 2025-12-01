import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";

export function FaqLinkCard() {
  return (
    <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl mb-1 break-words">Besoin d&apos;aide ?</CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words">Consultez notre FAQ</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Vous avez une question fréquente ? Consultez notre centre d&apos;aide.
        </p>
        <Button variant="outline" className="w-full h-10 sm:h-11 text-xs sm:text-sm font-semibold border-2" asChild>
          <Link href="/vehicles">Découvrir nos véhicules</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

