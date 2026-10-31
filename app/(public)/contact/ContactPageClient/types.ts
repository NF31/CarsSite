import type { LucideIcon } from "lucide-react";

export interface ContactCard {
  icon: LucideIcon;
  title: string;
  description: string;
  content: string;
  subcontent?: string;
  href: string;
}

export interface OpeningHours {
  day: string;
  hours: string;
}

export interface AboutFeature {
  text: string;
}

