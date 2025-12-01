import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { contactFormSchema, type ContactFormInput } from "@/lib/validations/contact";
import { submitPublicContactFormAction } from "@/actions/public/contact/submit-contact-form";
import { toast } from "sonner";

export function useContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema) as Resolver<ContactFormInput>,
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormInput) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitPublicContactFormAction({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        subject: data.subject,
        message: data.message,
      });

      if (result.success) {
        form.reset({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });

        toast.success("✅ Message envoyé avec succès !", {
          description: "Un email de confirmation vous a été envoyé. Nous vous répondrons dans les plus brefs délais.",
          duration: 3000,
        });
      } else {
        toast.error("❌ Erreur lors de l'envoi", {
          description: result.error || "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("[Contact] Erreur lors de l'envoi:", error);
      toast.error("❌ Erreur lors de l'envoi", {
        description: "Une erreur inattendue est survenue. Veuillez réessayer ou nous contacter directement.",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
  };
}

