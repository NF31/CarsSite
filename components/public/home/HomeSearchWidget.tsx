"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Car, Fuel, Loader2, MapPin, Plus, TrendingUp } from "lucide-react";
import { LoadScript } from "@react-google-maps/api";

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          PlaceAutocompleteElement: typeof google.maps.places.PlaceAutocompleteElement;
        };
      };
    };
  }
}

const categories = [
  { value: "cars", label: "Voitures", icon: Car },
  { value: "utility", label: "Utilitaires", icon: Fuel },
  { value: "subscription", label: "Abonnement", icon: TrendingUp },
];

// Tableau statique pour les libraries Google Maps (évite le rechargement)
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

// Fonction utilitaire pour obtenir la date du jour au format ISO (YYYY-MM-DD)
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Composant interne pour le widget de recherche avec Google Places
function SearchWidgetContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("cars");
  const [showDifferentReturn, setShowDifferentReturn] = useState(false);
  const [pickupValue, setPickupValue] = useState("");
  const [pickupPlaceId, setPickupPlaceId] = useState("");
  const [returnValue, setReturnValue] = useState("");
  const [returnPlaceId, setReturnPlaceId] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const todayDateString = getTodayDateString();
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const returnAutocompleteContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const returnAutocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);

  // Initialiser PlaceAutocompleteElement après le chargement de Google Maps
  useEffect(() => {
    if (!autocompleteContainerRef.current || typeof window === "undefined") {
      return;
    }

    // Vérifier si Google Maps est chargé
    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      // Attendre que Google Maps soit chargé
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places?.PlaceAutocompleteElement && autocompleteContainerRef.current) {
          clearInterval(checkGoogleMaps);
          initializeAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }

    initializeAutocomplete();

    function initializeAutocomplete() {
      if (!autocompleteContainerRef.current || !window.google?.maps?.places?.PlaceAutocompleteElement) {
        return;
      }

      // Nettoyer l'élément existant si présent
      if (autocompleteElementRef.current) {
        autocompleteElementRef.current.remove();
        autocompleteElementRef.current = null;
      }

      // Créer le PlaceAutocompleteElement
      const PlaceAutocompleteElement = window.google.maps.places.PlaceAutocompleteElement;
      const autocompleteElement = new PlaceAutocompleteElement({
        componentRestrictions: { country: "fr" },
        requestedLanguage: "fr",
        types: ["geocode"],
      } as google.maps.places.PlaceAutocompleteElementOptions);

      // Configurer les attributs du Web Component
      autocompleteElement.setAttribute("class", "w-full h-full");
      autocompleteElement.style.width = "100%";
      autocompleteElement.style.height = "100%";

      // Écouter l'événement de sélection de lieu
      autocompleteElement.addEventListener("g-place-select", (event: any) => {
        const place = event.place;
        if (place) {
          // Essayer différentes propriétés possibles
          const displayName = place.formattedAddress || place.displayName || place.name || "";
          const placeId = place.id || place.place_id || "";
          if (displayName && placeId) {
            setPickupValue(displayName);
            setPickupPlaceId(placeId);
          }
        }
      });

      // Ajouter le Web Component au conteneur
      autocompleteContainerRef.current.appendChild(autocompleteElement);
      autocompleteElementRef.current = autocompleteElement;

      // Configurer l'input dans le shadow DOM après l'ajout au DOM
      setTimeout(() => {
        const shadowRoot = autocompleteElement.shadowRoot;
        if (shadowRoot) {
          const input = shadowRoot.querySelector("input") as HTMLInputElement;
          if (input) {
            // Styles minimalistes - seulement la couleur du texte et le placeholder
            const existingStyle = shadowRoot.querySelector("style[data-pickup-styles]");
            if (!existingStyle) {
              const style = document.createElement("style");
              style.setAttribute("data-pickup-styles", "true");
              style.textContent = `
                input {
                  color: #1e293b !important;
                  padding-left: 2.75rem !important;
                }
                input::placeholder {
                  color: #94a3b8 !important;
                  opacity: 1 !important;
                }
              `;
              shadowRoot.appendChild(style);
            }

            // Configurer l'input
            input.placeholder = "Paris CDG Aéroport Terminal 2";
            input.required = true;
            input.name = "pickup";
            input.id = "pickup";
            input.style.color = "#1e293b";
            input.style.paddingLeft = "2.75rem";

            // Écouter les changements de valeur
            const handleInput = (e: Event) => {
              const target = e.target as HTMLInputElement;
              setPickupValue(target.value);
              if (!target.value) {
                setPickupPlaceId("");
              }
            };
            input.addEventListener("input", handleInput, { passive: true });
          }
        }
      }, 500);
    }

    // Cleanup
    return () => {
      if (autocompleteElementRef.current) {
        autocompleteElementRef.current.remove();
        autocompleteElementRef.current = null;
      }
    };
  }, []);

  // Initialiser PlaceAutocompleteElement pour le retour quand showDifferentReturn est true
  useEffect(() => {
    if (!showDifferentReturn || !returnAutocompleteContainerRef.current || typeof window === "undefined") {
      // Nettoyer l'élément de retour si showDifferentReturn est false
      if (returnAutocompleteElementRef.current) {
        returnAutocompleteElementRef.current.remove();
        returnAutocompleteElementRef.current = null;
      }
      return;
    }

    // Vérifier si Google Maps est chargé
    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      // Attendre que Google Maps soit chargé
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places?.PlaceAutocompleteElement && returnAutocompleteContainerRef.current) {
          clearInterval(checkGoogleMaps);
          initializeReturnAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }

    initializeReturnAutocomplete();

    function initializeReturnAutocomplete() {
      if (!returnAutocompleteContainerRef.current || !window.google?.maps?.places?.PlaceAutocompleteElement) {
        return;
      }

      // Nettoyer l'élément existant si présent
      if (returnAutocompleteElementRef.current) {
        returnAutocompleteElementRef.current.remove();
        returnAutocompleteElementRef.current = null;
      }

      // Créer le PlaceAutocompleteElement pour le retour
      const PlaceAutocompleteElement = window.google.maps.places.PlaceAutocompleteElement;
      const autocompleteElement = new PlaceAutocompleteElement({
        componentRestrictions: { country: "fr" },
        requestedLanguage: "fr",
        types: ["geocode"],
      } as google.maps.places.PlaceAutocompleteElementOptions);

      // Configurer les attributs du Web Component
      autocompleteElement.setAttribute("class", "w-full h-full");
      autocompleteElement.style.width = "100%";
      autocompleteElement.style.height = "100%";

      // Écouter l'événement de sélection de lieu
      autocompleteElement.addEventListener("g-place-select", (event: any) => {
        const place = event.place;
        if (place) {
          // Essayer différentes propriétés possibles
          const displayName = place.formattedAddress || place.displayName || place.name || "";
          const placeId = place.id || place.place_id || "";
          if (displayName && placeId) {
            setReturnValue(displayName);
            setReturnPlaceId(placeId);
          }
        }
      });

      // Ajouter le Web Component au conteneur
      returnAutocompleteContainerRef.current.appendChild(autocompleteElement);
      returnAutocompleteElementRef.current = autocompleteElement;

      // Configurer l'input dans le shadow DOM après l'ajout au DOM
      setTimeout(() => {
        const shadowRoot = autocompleteElement.shadowRoot;
        if (shadowRoot) {
          const input = shadowRoot.querySelector("input") as HTMLInputElement;
          if (input) {
            // Styles minimalistes - seulement la couleur du texte et le placeholder
            const existingStyle = shadowRoot.querySelector("style[data-return-styles]");
            if (!existingStyle) {
              const style = document.createElement("style");
              style.setAttribute("data-return-styles", "true");
              style.textContent = `
                input {
                  color: #1e293b !important;
                  padding-left: 2.75rem !important;
                }
                input::placeholder {
                  color: #94a3b8 !important;
                  opacity: 1 !important;
                }
              `;
              shadowRoot.appendChild(style);
            }

            // Configurer l'input
            input.placeholder = "Lieu de retour différent";
            input.required = false;
            input.name = "returnLocation";
            input.id = "returnLocation";
            input.style.color = "#1e293b";
            input.style.paddingLeft = "2.75rem";

            // Écouter les changements de valeur
            const handleInput = (e: Event) => {
              const target = e.target as HTMLInputElement;
              setReturnValue(target.value);
              if (!target.value) {
                setReturnPlaceId("");
              }
            };
            input.addEventListener("input", handleInput, { passive: true });
          }
        }
      }, 500);
    }

    // Cleanup
    return () => {
      if (returnAutocompleteElementRef.current) {
        returnAutocompleteElementRef.current.remove();
        returnAutocompleteElementRef.current = null;
      }
    };
  }, [showDifferentReturn]);

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-xl shadow-slate-950/10 md:p-8">
      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.value;
          return (
            <Button
              key={category.value}
              type="button"
              onClick={() => setSelectedCategory(category.value)}
              className={cn(
                "flex-1 justify-center gap-2 rounded-xl text-sm font-medium transition",
                isActive ? "bg-white text-slate-900 shadow" : "bg-transparent text-slate-500 hover:bg-white",
              )}
              variant={isActive ? "default" : "ghost"}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>

      <form className="mt-6 space-y-6" action="/vehicles" method="get">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickup" className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Badge className="bg-slate-900 text-white">1</Badge>
                Retrait & retour
              </Label>
              <div className="relative h-12 rounded-xl border border-slate-200 bg-white">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary z-30 pointer-events-none" />
                <div
                  ref={autocompleteContainerRef}
                  className="relative w-full h-full rounded-xl"
                />
                <input type="hidden" name="pickupPlaceId" value={pickupPlaceId} />
                <input type="hidden" name="pickup" value={pickupValue} />
              </div>
              {showDifferentReturn ? (
                <div className="relative h-12 rounded-xl border border-slate-200 bg-white">
                  <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary z-30 pointer-events-none" />
                  <div
                    ref={returnAutocompleteContainerRef}
                    className="relative w-full h-full rounded-xl"
                  />
                  <input type="hidden" name="returnPlaceId" value={returnPlaceId} />
                  <input type="hidden" name="returnLocation" value={returnValue} />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setShowDifferentReturn((prev) => !prev)}
                className="flex items-center gap-2 text-sm font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                {showDifferentReturn ? "Annuler le lieu de retour différent" : "Lieu de retour différent"}
              </button>
              <Link href="/contact" className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline">
                Appliquer un tarif entreprise
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-semibold text-slate-600">
                Date de départ
              </Label>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-2">
                <Input
                  id="start-date"
                  name="startDate"
                  type="date"
                  className="h-12 rounded-xl border-slate-200"
                  min={todayDateString}
                  required
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input id="start-time" name="startTime" type="time" defaultValue="10:00" className="h-12 rounded-xl border-slate-200" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-semibold text-slate-600">
                Date de retour
              </Label>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-2">
                <Input
                  id="end-date"
                  name="endDate"
                  type="date"
                  className="h-12 rounded-xl border-slate-200"
                  min={startDate || todayDateString}
                  required
                />
                <Input id="end-time" name="endTime" type="time" defaultValue="10:00" className="h-12 rounded-xl border-slate-200" />
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 md:w-auto md:px-10"
          aria-label="Voir les véhicules disponibles"
        >
          Voir les véhicules
        </Button>
      </form>
    </div>
  );
}

export function HomeSearchWidget() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-xl shadow-slate-950/10 md:p-8">
        <p className="text-center text-muted-foreground">
          Clé API Google Maps non configurée. Veuillez configurer NEXT_PUBLIC_GOOGLE_MAPS_API_KEY dans votre fichier .env
        </p>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
      <SearchWidgetContent />
    </LoadScript>
  );
}
