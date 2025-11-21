"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Building2,
  Users,
} from "lucide-react";
import { submitContactFormAction } from "@/actions/client/contact/submit-contact-form";
import { toast } from "sonner";

interface ContactPageClientProps {
  userEmail: string;
  userName: string;
}

export function ContactPageClient({ userEmail, userName }: ContactPageClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail,
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
          name: userName,
          email: userEmail,
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

  return (
    <div className="flex flex-col space-y-12">
      {/* Hero Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Contactez-nous</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Nous sommes là pour répondre à toutes vos questions concernant la location de véhicules.
          N&apos;hésitez pas à nous contacter, nous vous répondrons dans les plus brefs délais.
        </p>
      </div>

      {/* Contact Information Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Téléphone</CardTitle>
                <CardDescription>Appelez-nous directement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href="tel:+33123456789"
              className="text-base font-semibold text-gray-900 hover:text-primary transition-colors"
            >
              +33 1 23 45 67 89
            </a>
            <p className="mt-1 text-sm text-muted-foreground">Lun - Ven : 9h - 18h</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Email</CardTitle>
                <CardDescription>Écrivez-nous un message</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href="mailto:contact@carrental.fr"
              className="text-base font-semibold text-gray-900 hover:text-primary transition-colors break-all"
            >
              contact@carrental.fr
            </a>
            <p className="mt-1 text-sm text-muted-foreground">Réponse sous 24h</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Adresse</CardTitle>
                <CardDescription>Venez nous rendre visite</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <address className="not-italic text-base font-semibold text-gray-900">
              123 Avenue de la République
              <br />
              75011 Paris, France
            </address>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Form */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Envoyez-nous un message</CardTitle>
                <CardDescription>
                  Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Message envoyé avec succès !</strong>
                  <br />
                  Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Objet de votre message"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) {
                        setFormData({ ...formData, message: e.target.value });
                      }
                    }}
                    placeholder="Décrivez votre demande ou votre question..."
                    rows={6}
                    className="min-h-[150px]"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.message.length}/1000 caractères
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* About & Information */}
        <div className="space-y-6">
          {/* About Section */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>À propos de CarRental</CardTitle>
                  <CardDescription>Votre partenaire de confiance pour la location de véhicules</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                CarRental est une plateforme moderne de location de véhicules qui vous permet de réserver
                votre véhicule idéal en quelques clics. Nous proposons une large gamme de véhicules pour
                tous les besoins et tous les budgets.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Réservation simple et rapide en ligne</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Véhicules récents et bien entretenus</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Paiement sécurisé via Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Assistance client 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Annulation flexible</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Horaires d&apos;ouverture</CardTitle>
                  <CardDescription>Heures de disponibilité de notre service client</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Lundi - Vendredi</span>
                  <span className="text-muted-foreground">9h00 - 18h00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Samedi</span>
                  <span className="text-muted-foreground">10h00 - 16h00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Dimanche</span>
                  <span className="text-muted-foreground">Fermé</span>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong className="font-semibold text-gray-900">Assistance 24/7 :</strong> Pour les
                    urgences liées à une réservation en cours, contactez-nous au{" "}
                    <a
                      href="tel:+33123456789"
                      className="font-semibold text-primary hover:underline"
                    >
                      +33 1 23 45 67 89
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Link */}
          <Card className="border border-slate-100 shadow-sm bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Besoin d&apos;aide ?</CardTitle>
                  <CardDescription>Consultez notre FAQ ou contactez le support</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Vous avez une question fréquente ? Consultez notre centre d&apos;aide pour trouver des
                réponses rapides à vos questions.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/vehicles" target="_blank" rel="noopener noreferrer">
                  Découvrir nos véhicules
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Map Section */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Notre localisation</CardTitle>
              <CardDescription>Retrouvez-nous dans notre agence parisienne</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {/* Google Maps iframe - Replace with your actual Google Maps embed URL */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937596!2d2.2922926156746234!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sTour%20Eiffel!5e0!3m2!1sfr!2sfr!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localisation CarRental - 123 Avenue de la République, 75011 Paris"
            />
          </div>
          <div className="mt-4 text-center">
            <address className="not-italic text-base font-semibold text-gray-900">
              123 Avenue de la République
              <br />
              75011 Paris, France
            </address>
            <a
              href="https://www.google.com/maps/search/?api=1&query=123+Avenue+de+la+République+75011+Paris"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              Voir sur Google Maps →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

