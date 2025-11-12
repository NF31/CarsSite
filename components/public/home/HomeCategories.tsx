"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Car, Fuel, TrendingUp, Truck } from "lucide-react";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";

const categories = [
  {
    id: "ECONOMY",
    label: "Économique",
    description: "Parfait pour la ville",
    icon: Car,
    color: "from-blue-500 to-blue-600",
    href: "/vehicles?category=ECONOMY",
  },
  {
    id: "COMPACT",
    label: "Compact",
    description: "Confort et économie",
    icon: Car,
    color: "from-green-500 to-green-600",
    href: "/vehicles?category=COMPACT",
  },
  {
    id: "SUV",
    label: "SUV",
    description: "Pour vos aventures",
    icon: Truck,
    color: "from-orange-500 to-orange-600",
    href: "/vehicles?category=SUV",
  },
  {
    id: "LUXURY",
    label: "Luxe",
    description: "Expérience premium",
    icon: TrendingUp,
    color: "from-purple-500 to-purple-600",
    href: "/vehicles?category=LUXURY",
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

export function HomeCategories() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <motion.div key={category.id} variants={itemVariants}>
            <Link href={category.href}>
              <Card className="group h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-primary">
                <CardContent className="p-6 text-center">
                  <div
                    className={cn(
                      "w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300",
                      category.color
                    )}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {category.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

