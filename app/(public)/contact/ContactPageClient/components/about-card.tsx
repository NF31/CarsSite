import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle2 } from "lucide-react";
import type { AboutFeature } from "../types";

interface AboutCardProps {
  features: AboutFeature[];
}

export function AboutCard({ features }: AboutCardProps) {
  return (
    <Card className="border-2 shadow-lg w-full">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl mb-1 break-words">À propos de CarRental</CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words">Votre partenaire de confiance</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          CarRental est une plateforme moderne de location de véhicules qui vous permet de réserver votre véhicule idéal
          en quelques clics.
        </p>
        <div className="space-y-2 sm:space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-full bg-emerald-500/10 p-1.5 flex-shrink-0">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground break-words">{feature.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

