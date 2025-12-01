import type { LucideIcon } from "lucide-react";
import type { ContactFormInput } from "@/lib/validations/contact";

export interface ContactPageClientProps {
  // Props vides pour l'instant, mais prêt pour extension
}

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

export interface ContactFormData extends ContactFormInput {}

