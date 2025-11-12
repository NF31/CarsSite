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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {advantages.map((advantage, index) => {
        const Icon = advantage.icon;
        return (
          <motion.div key={index} variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className={`w-6 h-6 ${advantage.color}`} />
                </div>
                <CardTitle className="text-xl">{advantage.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{advantage.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

