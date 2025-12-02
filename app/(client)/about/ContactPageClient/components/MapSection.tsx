import { MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContactInfo } from "@/actions/public/contact/get-contact-info";

interface MapSectionProps {
  contactInfo: ContactInfo;
}

export function MapSection({ contactInfo }: MapSectionProps) {
  // Construire l'URL Google Maps à partir de l'adresse
  const addressQuery = encodeURIComponent(contactInfo.address.full);
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
  
  // URL d'embed Google Maps (utilise l'API embed standard)
  const googleMapsEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937596!2d2.2922926156746234!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sTour%20Eiffel!5e0!3m2!1sfr!2sfr!4v1234567890`;

  return (
    <Card className="border border-slate-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Notre localisation</CardTitle>
            <CardDescription>Retrouvez-nous dans notre agence</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <iframe
            src={googleMapsEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Localisation - ${contactInfo.address.full}`}
          />
        </div>
        <div className="mt-4 text-center">
          <address className="not-italic text-base font-semibold text-gray-900">
            {contactInfo.address.street}
            <br />
            {contactInfo.address.city}
          </address>
          <a
            href={googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Voir sur Google Maps →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

