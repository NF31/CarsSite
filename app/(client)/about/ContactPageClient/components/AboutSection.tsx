import { Building2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  "Réservation simple et rapide en ligne",
  "Véhicules récents et bien entretenus",
  "Paiement sécurisé via Stripe",
  "Assistance client 24/7",
  "Annulation flexible",
] as const;

export function AboutSection() {
  return (
    <Card className="border border-slate-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>À propos de CarRental</CardTitle>
            <CardDescription>Votre partenaire de confiance pour la location de véhicules</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          CarRental est une plateforme moderne de location de véhicules qui vous permet de réserver
          votre véhicule idéal en quelques clics. Nous proposons une large gamme de véhicules pour
          tous les besoins et tous les budgets.
        </p>
        <div className="space-y-2">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

