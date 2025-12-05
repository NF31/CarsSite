"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare } from "lucide-react";
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
import { motion } from "@/components/ui/motion";
import type { UseFormReturn } from "react-hook-form";
import type { ContactFormInput } from "@/lib/validations/contact";

interface ContactFormCardProps {
  form: UseFormReturn<ContactFormInput>;
  isSubmitting: boolean;
  onSubmit: (data: ContactFormInput) => Promise<void>;
}

export function ContactFormCard({ form, isSubmitting, onSubmit }: ContactFormCardProps) {
  return (
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
                        <Input placeholder="Votre nom" className="h-10 sm:h-11 w-full" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Minimum 2 caractères</FormDescription>
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
                        <Input type="email" placeholder="votre@email.com" className="h-10 sm:h-11 w-full" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Format valide requis</FormDescription>
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
                      <Input type="tel" placeholder="+33 6 12 34 56 78" className="h-10 sm:h-11 w-full" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Format français accepté</FormDescription>
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
                      <Input placeholder="Objet de votre message" className="h-10 sm:h-11 w-full" {...field} />
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
  );
}

