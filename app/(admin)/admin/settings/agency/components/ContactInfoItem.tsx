import { Copy, Check, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo } from "react";

type ContactField = "address" | "phone" | "email";

interface ContactInfoItemProps {
  field: ContactField;
  value: string;
  copied: boolean;
  onCopy: () => void;
}

const icons = {
  address: MapPin,
  phone: Phone,
  email: Mail,
};

const labels = {
  address: "Adresse",
  phone: "Téléphone",
  email: "Email",
};

const placeholders = {
  address: "Adresse non renseignée",
  phone: "Numéro non renseigné",
  email: "Email non renseigné",
};

export const ContactInfoItem = memo(function ContactInfoItem({
  field,
  value,
  copied,
  onCopy,
}: ContactInfoItemProps) {
  const Icon = icons[field];
  const label = labels[field];
  const placeholder = placeholders[field];

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
      <Icon className="mt-1 h-4 w-4 text-muted-foreground" />
      <div className="flex-1 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{label}</p>
        <p>{value || placeholder}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onCopy}
        disabled={!value}
        aria-label={`Copier ${label.toLowerCase()}`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
});

