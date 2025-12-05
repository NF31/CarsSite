"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { motion } from "@/components/ui/motion";

const testimonials = [
  {
    id: 1,
    name: "Marie Dupont",
    rating: 5,
    comment:
      "Service excellent, véhicule en parfait état. Le processus de réservation est très simple et rapide. Je recommande vivement !",
    location: "Paris",
  },
  {
    id: 2,
    name: "Jean Martin",
    rating: 5,
    comment:
      "Très satisfait de ma location. Le véhicule était propre, bien entretenu et correspondait parfaitement à la description. Excellent rapport qualité-prix.",
    location: "Lyon",
  },
  {
    id: 3,
    name: "Sophie Bernard",
    rating: 5,
    comment:
      "Superbe expérience ! L'équipe est très professionnelle et à l'écoute. Le véhicule était impeccable et le prix très compétitif. Je reviendrai certainement.",
    location: "Marseille",
  },
  {
    id: 4,
    name: "Pierre Leroy",
    rating: 5,
    comment:
      "Service client au top, réservation facile et véhicule de qualité. Tout s'est parfaitement déroulé du début à la fin. Merci !",
    location: "Toulouse",
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

export function HomeTestimonials() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {testimonials.map((testimonial) => (
        <motion.div key={testimonial.id} variants={itemVariants}>
          <Card className="h-full border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                "{testimonial.comment}"
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

