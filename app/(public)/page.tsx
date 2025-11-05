import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Search, Car, Shield, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Trouvez votre véhicule idéal
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Réservez facilement votre voiture en ligne. Large choix de véhicules,
          tarifs transparents, réservation en 4 étapes.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/vehicles">
              <Search className="mr-2 h-5 w-5" />
              Rechercher un véhicule
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/about">En savoir plus</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Car className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Large choix</CardTitle>
              <CardDescription>
                Plus de 100 véhicules disponibles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Assurance incluse</CardTitle>
              <CardDescription>
                Protection complète pour votre tranquillité
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Réservation rapide</CardTitle>
              <CardDescription>
                En 4 étapes simples, moins de 5 minutes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}

