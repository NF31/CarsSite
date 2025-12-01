import { Phone, Mail, MapPin } from "lucide-react";
import type { ContactCard, OpeningHours, AboutFeature } from "./types";

export const contactCards: ContactCard[] = [
  {
    icon: Phone,
    title: "Téléphone",
    description: "Appelez-nous directement",
    content: "+33 1 23 45 67 89",
    subcontent: "Lun - Ven : 9h - 18h",
    href: "tel:+33123456789",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Écrivez-nous un message",
    content: "contact@carrental.fr",
    subcontent: "Réponse sous 24h",
    href: "mailto:contact@carrental.fr",
  },
  {
    icon: MapPin,
    title: "Adresse",
    description: "Venez nous rendre visite",
    content: "123 Avenue de la République",
    subcontent: "75011 Paris, France",
    href: "https://www.google.com/maps/search/?api=1&query=123+Avenue+de+la+République+75011+Paris",
  },
];

export const openingHours: OpeningHours[] = [
  { day: "Lundi - Vendredi", hours: "9h00 - 18h00" },
  { day: "Samedi", hours: "10h00 - 16h00" },
  { day: "Dimanche", hours: "Fermé" },
];

export const aboutFeatures: AboutFeature[] = [
  { text: "Réservation simple et rapide" },
  { text: "Véhicules récents et entretenus" },
  { text: "Paiement sécurisé" },
  { text: "Assistance disponible" },
  { text: "Annulation flexible" },
];

export const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937596!2d2.2922926156746234!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sTour%20Eiffel!5e0!3m2!1sfr!2sfr!4v1234567890";

export const MAP_SEARCH_URL =
  "https://www.google.com/maps/search/?api=1&query=123+Avenue+de+la+République+75011+Paris";

export const ADDRESS = {
  street: "123 Avenue de la République",
  city: "75011 Paris, France",
};

export const EMERGENCY_PHONE = "+33 1 23 45 67 89";

