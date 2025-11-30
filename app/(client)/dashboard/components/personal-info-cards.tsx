import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, CheckCircle2, FileText, Settings } from "lucide-react";
import Link from "next/link";
import type { Session } from "next-auth";

interface PersonalInfoCardsProps {
  session: Session;
}

export function PersonalInfoCards({ session }: PersonalInfoCardsProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Mettez à jour vos coordonnées et documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-gray-900">Nom :</span> {session.user.name}
          </div>
          <div>
            <span className="font-medium text-gray-900">Email :</span> {session.user.email}
          </div>
          <p className="text-xs text-muted-foreground">
            Rendez-vous sur la page profil pour modifier vos informations ou télécharger votre permis.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile" className="inline-flex items-center gap-2">
              Gérer mon profil
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Conseils & assistance</CardTitle>
          <CardDescription>Profitez au mieux de vos locations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
            <p>
              Pensez à vérifier vos factures quelques jours après chaque location pour garder un historique clair.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Car className="mt-0.5 h-4 w-4 text-primary" />
            <p>
              Besoin d&apos;un véhicule pour une occasion spéciale ? Réservez en avance pour garantir la disponibilité.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 text-indigo-500" />
            <p>
              Retrouvez toutes vos factures dans la section dédiée pour faciliter vos démarches administratives.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

