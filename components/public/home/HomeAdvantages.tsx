"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Shield,
  Clock,
  DollarSign,
  Headphones,
  FileX,
} from "lucide-react";
import { m as motion } from "framer-motion";

const advantages = [
  {
    icon: CheckCircle2,
    title: "Réservation en 4 étapes",
    description: "Processus simplifié et rapide, moins de 5 minutes",
    color: "text-primary",
  },
  {
    icon: Shield,
    title: "Paiement sécurisé",
    description: "Transactions protégées et données chiffrées",
    color: "text-green-600",
  },
  {
    icon: Clock,
    title: "Véhicules récents",
    description: "Flotte moderne et entretenue régulièrement",
    color: "text-blue-600",
  },
  {
    icon: Headphones,
    title: "Assistance 24/7",
    description: "Support client disponible à tout moment",
    color: "text-purple-600",
  },
  {
    icon: FileX,
    title: "Annulation flexible",
    description: "Annulez votre réservation sans frais jusqu'à 24h avant",
    color: "text-orange-600",
  },
  {
    icon: DollarSign,
    title: "Prix transparents",
    description: "Pas de coûts cachés, prix clairs dès le début",
    color: "text-emerald-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function HomeAdvantages() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full"
    >
      {advantages.map((advantage, index) => {
        const Icon = advantage.icon;
        return (
          <motion.div key={index} variants={itemVariants}>
            <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-3 sm:p-4 shadow-sm flex-shrink-0`}>
                    <Icon className={`w-5 w-5 sm:w-6 sm:h-6 ${advantage.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl mb-1 break-words">{advantage.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground break-words leading-relaxed">{advantage.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

