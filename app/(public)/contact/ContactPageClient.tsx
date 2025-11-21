"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Building2,
  Users,
  Sparkles,
} from "lucide-react";
import { submitPublicContactFormAction } from "@/actions/public/contact/submit-contact-form";
import { toast } from "sonner";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactFormSchema, type ContactFormInput } from "@/lib/validations/contact";
import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { m as motion } from "framer-motion";

export function ContactPageClient() {
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

  const contactCards = [
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

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />
        
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto w-full"
          >
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Contactez notre équipe</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 text-foreground px-2">
              Nous sommes là pour vous aider
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 font-medium px-4">
              Une question ? Un besoin particulier ? Notre équipe est disponible pour répondre à toutes vos demandes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 w-full -mt-8 sm:-mt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full"
        >
          {contactCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="w-full"
            >
              <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl h-full w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-3 sm:p-4 shadow-sm flex-shrink-0">
                      <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-1 break-words">{card.title}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">{card.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {card.href.startsWith("http") ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors group break-words"
                    >
                      {card.content}
                      {card.subcontent && (
                        <>
                          <br />
                          <span className="text-xs sm:text-sm font-normal text-muted-foreground">{card.subcontent}</span>
                        </>
                      )}
                      <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  ) : (
                    <a
                      href={card.href}
                      className="block text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors break-words"
                    >
                      {card.content}
                      {card.subcontent && (
                        <>
                          <br />
                          <span className="text-xs sm:text-sm font-normal text-muted-foreground">{card.subcontent}</span>
                        </>
                      )}
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Main Content Section */}
      <section className="bg-muted/30 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
            {/* Contact Form - Takes 2 columns on desktop */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 w-full"
            >
              <Card className="border-2 shadow-xl w-full">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl sm:text-2xl mb-1 break-words">Envoyez-nous un message</CardTitle>
                      <CardDescription className="text-sm sm:text-base break-words">
                        Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel className="text-sm sm:text-base font-semibold">Nom complet *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Votre nom" 
                                  className="h-10 sm:h-11 w-full"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Minimum 2 caractères
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel className="text-sm sm:text-base font-semibold">Email *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="votre@email.com" 
                                  className="h-10 sm:h-11 w-full"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Format valide requis
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="text-sm sm:text-base font-semibold">Téléphone (optionnel)</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="+33 6 12 34 56 78" 
                                className="h-10 sm:h-11 w-full"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Format français accepté
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="text-sm sm:text-base font-semibold">Sujet *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Objet de votre message" 
                                className="h-10 sm:h-11 w-full"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              {form.watch("subject")?.length || 0}/200 caractères
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="text-sm sm:text-base font-semibold">Message *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Décrivez votre demande ou votre question..."
                                rows={6}
                                className="min-h-[150px] sm:min-h-[200px] resize-none w-full"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              {form.watch("message")?.length || 0}/1000 caractères (minimum 20)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                        disabled={isSubmitting}
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            Envoyer le message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar - Takes 1 column on desktop */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1 space-y-4 sm:space-y-6 w-full"
            >
              {/* About Section */}
              <Card className="border-2 shadow-lg w-full">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-1 break-words">À propos de CarRental</CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">Votre partenaire de confiance</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    CarRental est une plateforme moderne de location de véhicules qui vous permet de réserver
                    votre véhicule idéal en quelques clics.
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      "Réservation simple et rapide",
                      "Véhicules récents et entretenus",
                      "Paiement sécurisé",
                      "Assistance disponible",
                      "Annulation flexible",
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2 sm:gap-3">
                        <div className="rounded-full bg-emerald-500/10 p-1.5 flex-shrink-0">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground break-words">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Opening Hours */}
              <Card className="border-2 shadow-lg w-full">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-1 break-words">Horaires d&apos;ouverture</CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">Heures de disponibilité</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { day: "Lundi - Vendredi", hours: "9h00 - 18h00" },
                      { day: "Samedi", hours: "10h00 - 16h00" },
                      { day: "Dimanche", hours: "Fermé" },
                    ].map((schedule, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b last:border-0 gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm font-semibold text-foreground break-words">{schedule.day}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground break-words">{schedule.hours}</span>
                      </div>
                    ))}
                    <div className="mt-3 sm:mt-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="font-semibold text-foreground block mb-1">Assistance 24/7 :</strong>
                        Pour les urgences, contactez-nous au{" "}
                        <a
                          href="tel:+33123456789"
                          className="font-semibold text-primary hover:underline break-all"
                        >
                          +33 1 23 45 67 89
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Link */}
              <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 w-full">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-1 break-words">Besoin d&apos;aide ?</CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">Consultez notre FAQ</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Vous avez une question fréquente ? Consultez notre centre d&apos;aide.
                  </p>
                  <Button variant="outline" className="w-full h-10 sm:h-11 text-xs sm:text-sm font-semibold border-2" asChild>
                    <Link href="/vehicles">Découvrir nos véhicules</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <Card className="border-2 shadow-xl overflow-hidden w-full">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl mb-1 break-words">Notre localisation</CardTitle>
                  <CardDescription className="text-sm sm:text-base break-words">
                    Retrouvez-nous dans notre agence parisienne
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937596!2d2.2922926156746234!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sTour%20Eiffel!5e0!3m2!1sfr!2sfr!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation CarRental - 123 Avenue de la République, 75011 Paris"
                  className="w-full h-full"
                />
              </div>
              <div className="p-4 sm:p-6 text-center bg-muted/30">
                <address className="not-italic text-base sm:text-lg font-semibold text-foreground mb-2 break-words">
                  123 Avenue de la République
                  <br />
                  75011 Paris, France
                </address>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=123+Avenue+de+la+République+75011+Paris"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary hover:underline transition-all group"
                >
                  Voir sur Google Maps
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
