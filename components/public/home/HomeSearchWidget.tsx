"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Car, Fuel, Loader2, MapPin, Plus, TrendingUp, X } from "lucide-react";
import { LoadScript } from "@react-google-maps/api";

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: typeof google.maps.places.Autocomplete;
        };
        event?: {
          clearInstanceListeners: (instance: any) => void;
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
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const todayDateString = getTodayDateString();
  const pickupInputRef = useRef<HTMLInputElement>(null);
  
  // Calculer l'heure minimale pour aujourd'hui (heure actuelle, sans délai supplémentaire)
  const getMinTimeForToday = (): string => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // Utiliser l'heure actuelle (pas de délai supplémentaire)
    return `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
  };
  
  // Vérifier si la date de départ est aujourd'hui et calculer l'heure minimale
  const isStartDateToday = startDate === todayDateString;
  // Utiliser useMemo pour recalculer seulement quand nécessaire
  const minStartTime = useMemo(() => {
    return isStartDateToday ? getMinTimeForToday() : "00:00";
  }, [isStartDateToday, startDate]); // Recalculer si la date change ou si c'est aujourd'hui
  const returnInputRef = useRef<HTMLInputElement>(null);
  const autocompletePickupRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteReturnRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialiser Autocomplete pour le pickup
  useEffect(() => {
    if (!pickupInputRef.current || typeof window === "undefined") {
      return;
    }

    // Vérifier si Google Maps est chargé
    if (!window.google?.maps?.places?.Autocomplete) {
      // Attendre que Google Maps soit chargé
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete && pickupInputRef.current) {
          clearInterval(checkGoogleMaps);
          initializePickupAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }

    initializePickupAutocomplete();

    function initializePickupAutocomplete() {
      if (!pickupInputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return;
      }

      // Nettoyer l'autocomplete existant si présent
      if (autocompletePickupRef.current) {
        google.maps.event.clearInstanceListeners(autocompletePickupRef.current);
        autocompletePickupRef.current = null;
      }

      // Créer l'Autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
        componentRestrictions: { country: "fr" },
        fields: ["formatted_address", "place_id", "geometry"],
        types: ["geocode"],
      });

      autocompletePickupRef.current = autocomplete;

      // Écouter la sélection d'un lieu
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          console.log("[HomeSearchWidget] 🎯 Place selected for pickup:", { displayName, placeId });
          if (displayName) {
            setPickupValue(displayName);
            if (placeId) {
              setPickupPlaceId(placeId);
            }
            
            // Mettre à jour le champ caché
            const form = pickupInputRef.current?.closest("form");
            if (form) {
              const hiddenInput = form.querySelector('input[name="pickup"]') as HTMLInputElement;
              if (hiddenInput) {
                hiddenInput.value = displayName;
              }
              const hiddenPlaceIdInput = form.querySelector('input[name="pickupPlaceId"]') as HTMLInputElement;
              if (hiddenPlaceIdInput && placeId) {
                hiddenPlaceIdInput.value = placeId;
              }
            }
          }
        }
      });

      console.log("[HomeSearchWidget] ✅ Autocomplete initialized for pickup");
    }

    // Cleanup
    return () => {
      if (autocompletePickupRef.current) {
        google.maps.event.clearInstanceListeners(autocompletePickupRef.current);
        autocompletePickupRef.current = null;
      }
    };
  }, []);

  // Initialiser Autocomplete pour le retour quand showDifferentReturn est true
  useEffect(() => {
    if (!showDifferentReturn || !returnInputRef.current || typeof window === "undefined") {
      // Nettoyer l'autocomplete de retour si showDifferentReturn est false
      if (autocompleteReturnRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteReturnRef.current);
        autocompleteReturnRef.current = null;
      }
      return;
    }

    // Vérifier si Google Maps est chargé
    if (!window.google?.maps?.places?.Autocomplete) {
      // Attendre que Google Maps soit chargé
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete && returnInputRef.current) {
          clearInterval(checkGoogleMaps);
          initializeReturnAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }

    initializeReturnAutocomplete();

    function initializeReturnAutocomplete() {
      if (!returnInputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return;
      }

      // Nettoyer l'autocomplete existant si présent
      if (autocompleteReturnRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteReturnRef.current);
        autocompleteReturnRef.current = null;
      }

      // Créer l'Autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(returnInputRef.current, {
        componentRestrictions: { country: "fr" },
        fields: ["formatted_address", "place_id", "geometry"],
        types: ["geocode"],
      });

      autocompleteReturnRef.current = autocomplete;

      // Écouter la sélection d'un lieu
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          console.log("[HomeSearchWidget] 🎯 Place selected for return:", { displayName, placeId });
          if (displayName) {
            setReturnValue(displayName);
            if (placeId) {
              setReturnPlaceId(placeId);
            }
            
            // Mettre à jour le champ caché
            const form = returnInputRef.current?.closest("form");
            if (form) {
              const hiddenInput = form.querySelector('input[name="returnLocation"]') as HTMLInputElement;
              if (hiddenInput) {
                hiddenInput.value = displayName;
              }
              const hiddenPlaceIdInput = form.querySelector('input[name="returnPlaceId"]') as HTMLInputElement;
              if (hiddenPlaceIdInput && placeId) {
                hiddenPlaceIdInput.value = placeId;
              }
            }
          }
        }
      });

      console.log("[HomeSearchWidget] ✅ Autocomplete initialized for return");
    }

    // Cleanup
    return () => {
      if (autocompleteReturnRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteReturnRef.current);
        autocompleteReturnRef.current = null;
      }
    };
  }, [showDifferentReturn]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-white/10 bg-white p-4 sm:p-6 md:p-8 text-slate-900 shadow-xl shadow-slate-950/10">
      {errorMessage && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm break-words">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900 transition-colors flex-shrink-0"
            aria-label="Fermer le message d'erreur"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-slate-100 p-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.value;
          return (
            <Button
              key={category.value}
              type="button"
              onClick={() => setSelectedCategory(category.value)}
              className={cn(
                "flex-1 justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition px-2 sm:px-3",
                isActive ? "bg-white text-slate-900 shadow" : "bg-transparent text-slate-500 hover:bg-white",
              )}
              variant={isActive ? "default" : "ghost"}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.label.split(" ")[0]}</span>
            </Button>
          );
        })}
      </div>

      <form 
        className="mt-4 sm:mt-6 space-y-4 sm:space-y-6" 
        action="/vehicles" 
        method="get"
        onSubmit={(e) => {
          e.preventDefault(); // Empêcher la soumission par défaut pour synchroniser les valeurs
          
          // Récupérer les valeurs depuis toutes les sources possibles
          // Utiliser directement l'état React (qui est synchronisé avec l'input via onChange)
          const finalPickupValue = pickupValue?.trim() || "";
          const finalPickupPlaceId = pickupPlaceId?.trim() || "";
          
          // Pour le retour
          let finalReturnValue = "";
          let finalReturnPlaceId = "";
          
          if (showDifferentReturn) {
            finalReturnValue = returnValue?.trim() || "";
            finalReturnPlaceId = returnPlaceId?.trim() || "";
          } else {
            // Si pas de lieu de retour différent, utiliser le lieu de retrait
            finalReturnValue = finalPickupValue;
            finalReturnPlaceId = finalPickupPlaceId;
          }
          
          console.log("[HomeSearchWidget] 🎯 Final values before redirect:", {
            pickupValue: finalPickupValue,
            pickupPlaceId: finalPickupPlaceId,
            returnValue: finalReturnValue,
            returnPlaceId: finalReturnPlaceId,
            selectedCategory,
            showDifferentReturn,
          });
          
          // Construire l'URL avec tous les paramètres
          const params = new URLSearchParams();
          
          // Catégorie
          if (selectedCategory) {
            params.set("category", selectedCategory);
          }
          
          // Lieux - toujours envoyer pickup même si vide pour le debug
          if (finalPickupValue && finalPickupValue.length > 0) {
            params.set("pickup", finalPickupValue);
          }
          if (finalPickupPlaceId && finalPickupPlaceId.length > 0) {
            params.set("pickupPlaceId", finalPickupPlaceId);
          }
          // Lieu de retour
          if (showDifferentReturn && finalReturnValue && finalReturnValue.length > 0) {
            params.set("returnLocation", finalReturnValue);
          } else if (!showDifferentReturn && finalPickupValue && finalPickupValue.length > 0) {
            // Si pas de lieu de retour différent, répéter le lieu de retrait
            params.set("returnLocation", finalPickupValue);
          }
          if (finalReturnPlaceId && finalReturnPlaceId.length > 0) {
            params.set("returnPlaceId", finalReturnPlaceId);
          }
          
          // Dates - Utiliser les valeurs de l'état React qui sont déjà validées
          if (startDate) {
            params.set("startDate", startDate);
          }
          const endDateInput = e.currentTarget.querySelector('input[name="endDate"]') as HTMLInputElement;
          if (endDateInput?.value) {
            params.set("endDate", endDateInput.value);
          }
          if (startTime) {
            params.set("startTime", startTime);
          }
          if (endTime) {
            params.set("endTime", endTime);
          }
          
          // Validation finale : vérifier que la date/heure de départ n'est pas dans le passé
          if (startDate === todayDateString) {
            const now = new Date();
            const [hours, minutes] = startTime.split(":").map(Number);
            const selectedDateTime = new Date();
            selectedDateTime.setHours(hours, minutes, 0, 0);
            
            // Vérifier que l'heure n'est pas dans le passé (sans délai supplémentaire)
            if (selectedDateTime < now) {
              setErrorMessage(`L'heure de départ ne peut pas être dans le passé. Veuillez sélectionner une heure future (au moins ${getMinTimeForToday()}).`);
              e.preventDefault();
              // Faire défiler vers le haut pour voir le message
              window.scrollTo({ top: 0, behavior: "smooth" });
              return;
            }
          }
          
          // Réinitialiser le message d'erreur si la validation passe
          setErrorMessage(null);
          
          const url = `/vehicles?${params.toString()}`;
          console.log("[HomeSearchWidget] Redirecting to:", url);
          
          // Rediriger vers la page des véhicules avec tous les paramètres
          window.location.href = url;
        }}
      >
        {/* Champ caché pour la catégorie */}
        <input type="hidden" name="category" value={selectedCategory} />
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickup" className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Badge className="bg-slate-900 text-white">1</Badge>
                Retrait & retour
              </Label>
              <div className="relative h-10 sm:h-12 rounded-lg sm:rounded-xl border border-slate-200 bg-white">
                <MapPin className="absolute left-3 sm:left-4 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-primary z-30 pointer-events-none" />
                <Input
                  ref={pickupInputRef}
                  id="pickup"
                  name="pickup"
                  type="text"
                  placeholder="Paris CDG Aéroport Terminal 2"
                  className="h-10 sm:h-12 w-full rounded-lg sm:rounded-xl border-0 bg-transparent pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={pickupValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPickupValue(value);
                    // Mettre à jour le champ caché
                    const form = e.target.closest("form");
                    if (form) {
                      const hiddenInput = form.querySelector('input[name="pickup"]') as HTMLInputElement;
                      if (hiddenInput) {
                        hiddenInput.value = value;
                      }
                    }
                    if (!value) {
                      setPickupPlaceId("");
                    }
                  }}
                  required
                />
                <input type="hidden" name="pickupPlaceId" value={pickupPlaceId || ""} />
              </div>
              {showDifferentReturn ? (
                <div className="relative h-10 sm:h-12 rounded-lg sm:rounded-xl border border-slate-200 bg-white">
                  <MapPin className="absolute left-3 sm:left-4 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-primary z-30 pointer-events-none" />
                  <Input
                    ref={returnInputRef}
                    id="returnLocation"
                    name="returnLocation"
                    type="text"
                    placeholder="Lieu de retour différent"
                    className="h-10 sm:h-12 w-full rounded-lg sm:rounded-xl border-0 bg-transparent pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={returnValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log("[HomeSearchWidget] 📝 Input change for return:", value);
                      setReturnValue(value);
                      // Si la valeur est vidée, réinitialiser le placeId
                      if (!value.trim()) {
                        setReturnPlaceId("");
                      }
                    }}
                  />
                  <input type="hidden" name="returnLocation" value={returnValue || ""} />
                  <input type="hidden" name="returnPlaceId" value={returnPlaceId || ""} />
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

          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-semibold text-slate-600">
                Date de départ
              </Label>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-2">
                <Input
                  id="start-date"
                  name="startDate"
                  type="date"
                  className="h-10 sm:h-12 rounded-lg sm:rounded-xl border-slate-200 text-sm"
                  min={todayDateString}
                  required
                  value={startDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setStartDate(newDate);
                    // Réinitialiser le message d'erreur quand la date change
                    setErrorMessage(null);
                    // Si la nouvelle date est aujourd'hui et que l'heure sélectionnée est dans le passé, la réinitialiser
                    if (newDate === todayDateString) {
                      const minTime = getMinTimeForToday();
                      if (startTime < minTime) {
                        setStartTime(minTime);
                      }
                    }
                  }}
                />
                <Input 
                  id="start-time" 
                  name="startTime" 
                  type="time" 
                  value={startTime}
                  min={minStartTime}
                  className="h-10 sm:h-12 rounded-lg sm:rounded-xl border-slate-200 text-sm" 
                  onChange={(e) => {
                    const newTime = e.target.value;
                    // Réinitialiser le message d'erreur quand l'heure change
                    setErrorMessage(null);
                    // Valider que l'heure n'est pas dans le passé si la date est aujourd'hui
                    if (isStartDateToday && newTime < minStartTime) {
                      // Si l'heure est dans le passé, utiliser l'heure minimale
                      setStartTime(minStartTime);
                    } else {
                      setStartTime(newTime);
                    }
                  }}
                />
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
                  className="h-10 sm:h-12 rounded-lg sm:rounded-xl border-slate-200 text-sm"
                  min={startDate || todayDateString}
                  required
                />
                <Input 
                  id="end-time" 
                  name="endTime" 
                  type="time" 
                  value={endTime}
                  className="h-10 sm:h-12 rounded-lg sm:rounded-xl border-slate-200 text-sm" 
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-11 sm:h-12 w-full rounded-lg sm:rounded-xl bg-primary text-primary-foreground text-sm sm:text-base font-semibold hover:bg-primary/90 md:w-auto md:px-8 lg:px-10"
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
  
  // Mémoriser le tableau de bibliothèques pour éviter les rechargements
  // GOOGLE_MAPS_LIBRARIES est déjà une constante, mais useMemo garantit la stabilité
  const libraries = useMemo(() => GOOGLE_MAPS_LIBRARIES, []);

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
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <SearchWidgetContent />
    </LoadScript>
  );
}
