"use client";

import { useEffect, useState } from "react";
import type { ContactPageClientProps } from "./ContactPageClient/types";
import { useContactForm } from "./ContactPageClient/hooks";
import { getContactInfoAction } from "@/actions/public/contact/get-contact-info";
import type { ContactInfo } from "@/actions/public/contact/get-contact-info";
import {
  HeroSection,
  ContactInfoCards,
  ContactForm,
  AboutSection,
  OpeningHoursSection,
  FAQCard,
  MapSection,
} from "./ContactPageClient/components";

export function ContactPageClient({ userEmail, userName }: ContactPageClientProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const { formData, isSubmitting, isSubmitted, handleSubmit, updateField } = useContactForm({
    initialName: userName,
    initialEmail: userEmail,
  });

  useEffect(() => {
    async function loadContactInfo() {
      const result = await getContactInfoAction();
      if (result.success && result.data) {
        setContactInfo(result.data);
      }
    }
    loadContactInfo();
  }, []);

  if (!contactInfo) {
    return (
      <div className="flex flex-col space-y-12">
        <div className="text-center text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-12">
      <HeroSection />

      <ContactInfoCards contactInfo={contactInfo} />

      <div className="grid gap-8 lg:grid-cols-2">
        <ContactForm
          formData={formData}
          isSubmitting={isSubmitting}
          isSubmitted={isSubmitted}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
        />

        <div className="space-y-6">
          <AboutSection />
          <OpeningHoursSection openingHours={contactInfo.openingHours} phone={contactInfo.phone} />
          <FAQCard />
        </div>
      </div>

      <MapSection contactInfo={contactInfo} />
    </div>
  );
}
