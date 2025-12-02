import { Phone, Mail, MapPin } from "lucide-react";
import type { ContactInfo } from "@/actions/public/contact/get-contact-info";
import { ContactInfoCard } from "./ContactInfoCard";

interface ContactInfoCardsProps {
  contactInfo: ContactInfo;
}

export function ContactInfoCards({ contactInfo }: ContactInfoCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <ContactInfoCard
        icon={Phone}
        title="Téléphone"
        description="Appelez-nous directement"
      >
        <a
          href={`tel:${contactInfo.phone.number}`}
          className="text-base font-semibold text-gray-900 hover:text-primary transition-colors"
        >
          {contactInfo.phone.display}
        </a>
        <p className="mt-1 text-sm text-muted-foreground">{contactInfo.phone.hours}</p>
      </ContactInfoCard>

      <ContactInfoCard icon={Mail} title="Email" description="Écrivez-nous un message">
        <a
          href={`mailto:${contactInfo.email.address}`}
          className="text-base font-semibold text-gray-900 hover:text-primary transition-colors break-all"
        >
          {contactInfo.email.address}
        </a>
        <p className="mt-1 text-sm text-muted-foreground">{contactInfo.email.responseTime}</p>
      </ContactInfoCard>

      <ContactInfoCard icon={MapPin} title="Adresse" description="Venez nous rendre visite">
        <address className="not-italic text-base font-semibold text-gray-900">
          {contactInfo.address.street}
          <br />
          {contactInfo.address.city}
        </address>
      </ContactInfoCard>
    </div>
  );
}

