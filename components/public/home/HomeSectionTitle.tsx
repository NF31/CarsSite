"use client";

import { motion } from "@/components/ui/motion";

interface HomeSectionTitleProps {
  title: string;
  description: string;
}

export function HomeSectionTitle({ title, description }: HomeSectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-8 sm:mb-12"
    >
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 text-foreground">
        {title}
      </h2>
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

