import { m as motion } from "framer-motion";
import { AboutCard } from "./about-card";
import { OpeningHoursCard } from "./opening-hours-card";
import { FaqLinkCard } from "./faq-link-card";
import type { AboutFeature, OpeningHours } from "../types";

interface SidebarProps {
  aboutFeatures: AboutFeature[];
  openingHours: OpeningHours[];
  emergencyPhone: string;
}

export function Sidebar({ aboutFeatures, openingHours, emergencyPhone }: SidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="lg:col-span-1 space-y-4 sm:space-y-6 w-full"
    >
      <AboutCard features={aboutFeatures} />
      <OpeningHoursCard hours={openingHours} emergencyPhone={emergencyPhone} />
      <FaqLinkCard />
    </motion.div>
  );
}

