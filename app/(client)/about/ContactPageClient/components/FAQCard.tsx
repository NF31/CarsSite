import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FAQCard() {
  return (
    <Card className="border border-slate-100 shadow-sm bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Besoin d&apos;aide ?</CardTitle>
            <CardDescription>Consultez notre FAQ ou contactez le support</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Vous avez une question fréquente ? Consultez notre centre d&apos;aide pour trouver des
          réponses rapides à vos questions.
        </p>
        <Button variant="outline" className="w-full" asChild>
          <a href="/vehicles" target="_blank" rel="noopener noreferrer">
            Découvrir nos véhicules
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

