import { Send, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ContactFormData } from "../types";

const MESSAGE_MAX_LENGTH = 1000;

interface ContactFormProps {
  formData: ContactFormData;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onFieldChange: <K extends keyof ContactFormData>(field: K, value: ContactFormData[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ContactForm({
  formData,
  isSubmitting,
  isSubmitted,
  onFieldChange,
  onSubmit,
}: ContactFormProps) {
  return (
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
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => onFieldChange("name", e.target.value)}
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
                  onChange={(e) => onFieldChange("email", e.target.value)}
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
                onChange={(e) => onFieldChange("phone", e.target.value)}
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
                onChange={(e) => onFieldChange("subject", e.target.value)}
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
                  if (e.target.value.length <= MESSAGE_MAX_LENGTH) {
                    onFieldChange("message", e.target.value);
                  }
                }}
                placeholder="Décrivez votre demande ou votre question..."
                rows={6}
                className="min-h-[150px]"
                maxLength={MESSAGE_MAX_LENGTH}
              />
              <p className="text-xs text-muted-foreground">
                {formData.message.length}/{MESSAGE_MAX_LENGTH} caractères
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
  );
}

