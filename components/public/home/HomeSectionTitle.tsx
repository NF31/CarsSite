"use client";

import { m as motion } from "framer-motion";

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
      className="text-center mb-12"
    >
      <h2 className="text-3xl md:text-4xl font-black mb-4">
        {title}
      </h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {description}
      </p>
    </motion.div>
  );
}

