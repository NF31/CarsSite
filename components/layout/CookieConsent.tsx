"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import Link from "next/link";
import { motion } from "@/components/ui/motion";
import { AnimatePresence } from "framer-motion";
import { getCookieConsent, setCookieConsentClient } from "@/lib/cookies";
import { setCookieConsentAction } from "@/actions/public/cookies/set-cookie-consent";

export function CookieConsent() {
  // Éviter l'erreur d'hydratation en ne vérifiant le cookie qu'après le montage
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Marquer le composant comme monté (côté client uniquement)
    // Note: Pattern standard pour éviter les erreurs d'hydratation
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    // Vérifier si le consentement a déjà été donné
    const consent = getCookieConsent();
    
    // Aucun consentement enregistré, afficher le bandeau
    setIsVisible(consent === null);
  }, []);

  const handleAccept = async () => {
    setIsLoading(true);
    
    // Stocker dans cookie HTTP côté client (synchronisation immédiate)
    setCookieConsentClient("accepted");
    
    // Stocker dans cookie HTTP côté serveur (sécurisé) via action serveur
    try {
      await setCookieConsentAction({ status: "accepted" });
    } catch (error) {
      console.error("[CookieConsent] Erreur lors de l'enregistrement du consentement:", error);
    }
    
    setIsVisible(false);
    setIsLoading(false);
    
    // Recharger la page pour activer Google Analytics si nécessaire
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    
    // Stocker dans cookie HTTP côté client (synchronisation immédiate)
    setCookieConsentClient("rejected");
    
    // Stocker dans cookie HTTP côté serveur (sécurisé) via action serveur
    try {
      await setCookieConsentAction({ status: "rejected" });
    } catch (error) {
      console.error("[CookieConsent] Erreur lors de l'enregistrement du consentement:", error);
    }
    
    setIsVisible(false);
    setIsLoading(false);
    
    // Recharger la page pour désactiver Google Analytics si nécessaire
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Ne rien rendre jusqu'à ce que le composant soit monté côté client
  // Cela évite les erreurs d'hydratation
  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
        >
          <Card className="max-w-4xl mx-auto shadow-2xl border-2 pointer-events-auto">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                <div className="flex-shrink-0 hidden sm:block">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-primary" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base sm:text-lg mb-2">
                        Utilisation des cookies
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Nous utilisons des cookies pour améliorer votre expérience sur notre site et personnaliser les contenus. L&apos;analyse du trafic est anonymisée et conforme au RGPD. Vous pouvez choisir d&apos;accepter ou de refuser les cookies de personnalisation.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Pour en savoir plus sur l&apos;utilisation de vos données, consultez notre{" "}
                        <Link
                          href="/legal/privacy"
                          className="text-primary hover:underline font-medium"
                        >
                          politique de confidentialité
                        </Link>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8 sm:hidden"
                      onClick={handleClose}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    Refuser
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? "Enregistrement..." : "Accepter"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

