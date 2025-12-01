"use client";

import { HeroSection } from "./components/hero-section";
import { ContactCardsSection } from "./components/contact-cards-section";
import { ContactFormCard } from "./components/contact-form-card";
import { Sidebar } from "./components/sidebar";
import { MapSection } from "./components/map-section";
import { useContactForm } from "./hooks/use-contact-form";
import {
  contactCards,
  openingHours,
  aboutFeatures,
  MAP_EMBED_URL,
  MAP_SEARCH_URL,
  ADDRESS,
  EMERGENCY_PHONE,
} from "./constants";

export function ContactPageClient() {
  const { form, isSubmitting, onSubmit } = useContactForm();

  return (
    <div className="flex flex-col w-full">
      <HeroSection />

      <ContactCardsSection cards={contactCards} />

      <section className="bg-muted/30 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
            <ContactFormCard form={form} isSubmitting={isSubmitting} onSubmit={onSubmit} />

            <Sidebar
              aboutFeatures={aboutFeatures}
              openingHours={openingHours}
              emergencyPhone={EMERGENCY_PHONE}
            />
          </div>
        </div>
      </section>

      <MapSection embedUrl={MAP_EMBED_URL} searchUrl={MAP_SEARCH_URL} address={ADDRESS} />
    </div>
  );
}

