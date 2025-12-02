import { useState } from "react";
import { submitContactFormAction } from "@/actions/client/contact/submit-contact-form";
import { toast } from "sonner";
import type { ContactFormData } from "../types";

interface UseContactFormProps {
  initialName: string;
  initialEmail: string;
}

export function useContactForm({ initialName, initialEmail }: UseContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: initialName,
    email: initialEmail,
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await submitContactFormAction({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      if (result.success) {
        setIsSubmitted(true);
        setFormData({
          name: initialName,
          email: initialEmail,
          phone: "",
          subject: "",
          message: "",
        });
        toast.success("Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.");
      } else {
        toast.error(result.error || "Une erreur est survenue lors de l'envoi du message.");
      }
    } catch (error) {
      console.error("[Contact] Erreur lors de l'envoi:", error);
      toast.error("Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    isSubmitting,
    isSubmitted,
    handleSubmit,
    updateField,
  };
}

