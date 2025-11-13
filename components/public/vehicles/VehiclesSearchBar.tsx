"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { LoadScript } from "@react-google-maps/api";

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: typeof google.maps.places.Autocomplete;
        };
        event?: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
  }
}

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface VehiclesSearchBarProps {
  initialPickup?: string;
  initialPickupPlaceId?: string;
  initialReturnLocation?: string;
  initialReturnPlaceId?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialCategory?: string;
}

function SearchBarContent({
  initialPickup = "",
  initialPickupPlaceId = "",
  initialReturnLocation = "",
  initialReturnPlaceId = "",
  initialStartDate = "",
  initialEndDate = "",
  initialStartTime = "",
  initialEndTime = "",
  initialCategory = "cars",
}: VehiclesSearchBarProps) {
  const router = useRouter();
  const [pickupValue, setPickupValue] = useState(initialPickup);
  const [pickupPlaceId, setPickupPlaceId] = useState(initialPickupPlaceId);
  const [returnValue, setReturnValue] = useState(initialReturnLocation);
  const [returnPlaceId, setReturnPlaceId] = useState(initialReturnPlaceId);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [category, setCategory] = useState(initialCategory);
  const [showDifferentReturn, setShowDifferentReturn] = useState(
    initialReturnLocation !== initialPickup && initialReturnLocation !== ""
  );

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);
  const autocompletePickupRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteReturnRef = useRef<google.maps.places.Autocomplete | null>(null);
  const todayDateString = getTodayDateString();

  // Initialiser Autocomplete pour le pickup
  useEffect(() => {
    if (!pickupInputRef.current || typeof window === "undefined") {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
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

      if (autocompletePickupRef.current) {
        google.maps.event.clearInstanceListeners(autocompletePickupRef.current);
        autocompletePickupRef.current = null;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        pickupInputRef.current,
        {
          componentRestrictions: { country: "fr" },
          fields: ["formatted_address", "place_id", "geometry"],
          types: ["geocode"],
        }
      );

      autocompletePickupRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          if (displayName) {
            setPickupValue(displayName);
            if (placeId) {
              setPickupPlaceId(placeId);
            }
          }
        }
      });
    }

    return () => {
      if (autocompletePickupRef.current) {
        google.maps.event.clearInstanceListeners(autocompletePickupRef.current);
        autocompletePickupRef.current = null;
      }
    };
  }, []);

  // Initialiser Autocomplete pour le retour
  useEffect(() => {
    if (!showDifferentReturn || !returnInputRef.current || typeof window === "undefined") {
      if (autocompleteReturnRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteReturnRef.current);
        autocompleteReturnRef.current = null;
      }
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
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

      if (autocompleteReturnRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteReturnRef.current);
        autocompleteReturnRef.current = null;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        returnInputRef.current,
        {
          componentRestrictions: { country: "fr" },
          fields: ["formatted_address", "place_id", "geometry"],
          types: ["geocode"],
        }
      );

      autocompleteReturnRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          if (displayName) {
            setReturnValue(displayName);
            if (placeId) {
              setReturnPlaceId(placeId);
            }
          }
        }
      });
    }

    return () => {
      if (autocompleteReturnRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteReturnRef.current);
        autocompleteReturnRef.current = null;
      }
    };
  }, [showDifferentReturn]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validation des champs requis
    if (!pickupValue || !pickupPlaceId) {
      return; // Le navigateur affichera l'erreur de validation HTML5
    }
    if (!startDate || !startTime || !endDate || !endTime) {
      return; // Le navigateur affichera l'erreur de validation HTML5
    }

    const params = new URLSearchParams();

    if (category) {
      params.set("category", category);
    }
    if (pickupValue) {
      params.set("pickup", pickupValue);
    }
    if (pickupPlaceId) {
      params.set("pickupPlaceId", pickupPlaceId);
    }
    if (showDifferentReturn && returnValue) {
      params.set("returnLocation", returnValue);
    } else if (pickupValue) {
      params.set("returnLocation", pickupValue);
    }
    if (showDifferentReturn && returnPlaceId) {
      params.set("returnPlaceId", returnPlaceId);
    } else if (pickupPlaceId) {
      params.set("returnPlaceId", pickupPlaceId);
    }
    if (startDate) {
      params.set("startDate", startDate);
    }
    if (endDate) {
      params.set("endDate", endDate);
    }
    if (startTime) {
      params.set("startTime", startTime);
    }
    if (endTime) {
      params.set("endTime", endTime);
    }

    router.push(`/vehicles?${params.toString()}`);
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm w-full max-w-full overflow-hidden"
    >
      {/* MOBILE LAYOUT - Visible uniquement sur mobile (< 768px) */}
      <div className="flex flex-col md:hidden space-y-4 w-full">
        {/* 1. Lieu de retrait - PLEINE LARGEUR */}
        <div className="w-full min-w-0 flex-shrink-0">
          <Label className="text-sm text-muted-foreground mb-2 block font-semibold">Lieu de retrait</Label>
          <div className="relative w-full">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none flex-shrink-0" />
            <Input
              ref={pickupInputRef}
              type="text"
              placeholder="Paris CDG Aéroport"
              value={pickupValue}
              onChange={(e) => {
                setPickupValue(e.target.value);
                if (!e.target.value) {
                  setPickupPlaceId("");
                }
              }}
              required
              className="h-11 w-full pl-10 pr-3 text-sm min-w-0"
            />
            <input type="hidden" value={pickupPlaceId} />
          </div>
        </div>

        {/* 2. Lieu de retour - TOUJOURS VISIBLE */}
        <div className="w-full min-w-0 flex-shrink-0">
          <Label className="text-sm text-muted-foreground mb-2 block font-semibold">
            Lieu de retour
            {!showDifferentReturn && (
              <span className="text-xs font-normal text-muted-foreground ml-1">(identique au retrait)</span>
            )}
          </Label>
          <div className="relative w-full">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none flex-shrink-0" />
            <Input
              ref={returnInputRef}
              type="text"
              placeholder={showDifferentReturn ? "Lieu de retour" : pickupValue || "Même lieu que le retrait"}
              value={showDifferentReturn ? returnValue : pickupValue}
              onChange={(e) => {
                if (showDifferentReturn) {
                  setReturnValue(e.target.value);
                  if (!e.target.value) {
                    setReturnPlaceId("");
                  }
                }
              }}
              disabled={!showDifferentReturn}
              className={`h-11 w-full pl-10 pr-3 text-sm min-w-0 ${
                !showDifferentReturn 
                  ? 'bg-gray-50 text-muted-foreground cursor-not-allowed opacity-75' 
                  : 'bg-white'
              }`}
            />
            <input type="hidden" value={showDifferentReturn ? returnPlaceId : pickupPlaceId} />
          </div>
        </div>

        {/* 3. Dates - DÉPART ET RETOUR CÔTE À CÔTE (2 COLONNES) */}
        <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
          {/* Date de départ */}
          <div className="w-full min-w-0 flex flex-col flex-shrink-0">
            <Label className="text-sm text-muted-foreground mb-2 block font-semibold">Départ</Label>
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 w-full min-w-0">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={todayDateString}
                required
                className="h-11 w-full min-w-0 flex-1"
                style={{ 
                  fontSize: 'clamp(10px, 2.5vw, 13px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  paddingLeft: 'clamp(8px, 2vw, 12px)',
                  paddingRight: 'clamp(8px, 2vw, 12px)',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
              />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="h-11 w-full min-w-0 flex-1"
                style={{ 
                  fontSize: 'clamp(10px, 2.5vw, 13px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  paddingLeft: 'clamp(8px, 2vw, 12px)',
                  paddingRight: 'clamp(8px, 2vw, 12px)',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
              />
            </div>
          </div>

          {/* Date de retour */}
          <div className="w-full min-w-0 flex flex-col flex-shrink-0">
            <Label className="text-sm text-muted-foreground mb-2 block font-semibold">Retour</Label>
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 w-full min-w-0">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || todayDateString}
                required
                className="h-11 w-full min-w-0 flex-1"
                style={{ 
                  fontSize: 'clamp(10px, 2.5vw, 13px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  paddingLeft: 'clamp(8px, 2vw, 12px)',
                  paddingRight: 'clamp(8px, 2vw, 12px)',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
              />
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="h-11 w-full min-w-0 flex-1"
                style={{ 
                  fontSize: 'clamp(10px, 2.5vw, 13px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  paddingLeft: 'clamp(8px, 2vw, 12px)',
                  paddingRight: 'clamp(8px, 2vw, 12px)',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
              />
            </div>
          </div>
        </div>

        {/* 4. Boutons - PLEINE LARGEUR */}
        <div className="w-full flex flex-col gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDifferentReturn(!showDifferentReturn)}
            className="text-sm h-10 text-primary w-full font-medium"
          >
            {showDifferentReturn ? "Même lieu" : "Lieu différent"}
          </Button>
          <Button type="submit" onClick={handleSearch} className="h-11 w-full text-sm font-semibold" size="sm">
            Rechercher
          </Button>
        </div>
      </div>

      {/* DESKTOP LAYOUT - Visible uniquement sur desktop (>= 768px) */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:items-end w-full">
        {/* Lieu de retrait */}
        <div className={showDifferentReturn ? "md:col-span-3" : "md:col-span-4"}>
          <Label className="text-xs text-muted-foreground mb-1 block">Lieu de retrait</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              ref={pickupInputRef}
              type="text"
              placeholder="Paris CDG Aéroport"
              value={pickupValue}
              onChange={(e) => {
                setPickupValue(e.target.value);
                if (!e.target.value) {
                  setPickupPlaceId("");
                }
              }}
              required
              className="h-10 pl-9 pr-3 text-sm w-full"
            />
            <input type="hidden" value={pickupPlaceId} />
          </div>
        </div>

        {/* Lieu de retour - TOUJOURS VISIBLE */}
        <div className={showDifferentReturn ? "md:col-span-3" : "md:col-span-4"}>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Lieu de retour
            {!showDifferentReturn && (
              <span className="text-[10px] font-normal text-muted-foreground ml-1">(identique)</span>
            )}
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              ref={returnInputRef}
              type="text"
              placeholder={showDifferentReturn ? "Lieu de retour" : pickupValue || "Même lieu que le retrait"}
              value={showDifferentReturn ? returnValue : pickupValue}
              onChange={(e) => {
                if (showDifferentReturn) {
                  setReturnValue(e.target.value);
                  if (!e.target.value) {
                    setReturnPlaceId("");
                  }
                }
              }}
              disabled={!showDifferentReturn}
              className={`h-10 pl-9 pr-3 text-sm w-full ${
                !showDifferentReturn 
                  ? 'bg-gray-50 text-muted-foreground cursor-not-allowed opacity-75' 
                  : 'bg-white'
              }`}
            />
            <input type="hidden" value={showDifferentReturn ? returnPlaceId : pickupPlaceId} />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 lg:gap-3 md:col-span-4 min-w-0">
          {/* Date de départ */}
          <div className="min-w-0 flex flex-col flex-shrink-0">
            <Label className="text-xs text-muted-foreground mb-1 block">Départ</Label>
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 w-full min-w-0">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={todayDateString}
                required
                className="h-10 w-full min-w-0 flex-1"
                style={{ 
                  fontSize: 'clamp(11px, 1.2vw, 14px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  paddingLeft: 'clamp(8px, 1.5vw, 12px)',
                  paddingRight: 'clamp(8px, 1.5vw, 12px)',
                  boxSizing: 'border-box'
                }}
              />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="h-10 w-full min-w-0 flex-1"
                style={{ 
                  fontSize: 'clamp(11px, 1.2vw, 14px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  paddingLeft: 'clamp(8px, 1.5vw, 12px)',
                  paddingRight: 'clamp(8px, 1.5vw, 12px)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Date de retour */}
          <div className="min-w-0 flex flex-col flex-shrink-0">
            <Label className="text-xs text-muted-foreground mb-1 block">Retour</Label>
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 w-full min-w-0">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || todayDateString}
                required
                className="h-10 w-full min-w-0 flex-1"
                style={{ 
                  fontSize: 'clamp(11px, 1.2vw, 14px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  paddingLeft: 'clamp(8px, 1.5vw, 12px)',
                  paddingRight: 'clamp(8px, 1.5vw, 12px)',
                  boxSizing: 'border-box'
                }}
              />
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="h-10 w-full min-w-0 flex-1"
                style={{ 
                  fontSize: 'clamp(11px, 1.2vw, 14px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  paddingLeft: 'clamp(8px, 1.5vw, 12px)',
                  paddingRight: 'clamp(8px, 1.5vw, 12px)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className={showDifferentReturn ? "md:col-span-2" : "md:col-span-4 lg:col-span-2"}>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDifferentReturn(!showDifferentReturn)}
              className="text-xs h-9 text-primary w-full"
            >
              {showDifferentReturn ? "Même lieu" : "Lieu différent"}
            </Button>
            <Button type="submit" onClick={handleSearch} className="h-10 w-full" size="sm">
              Rechercher
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function VehiclesSearchBar(props: VehiclesSearchBarProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  return (
    <LoadScript 
      googleMapsApiKey={apiKey} 
      libraries={GOOGLE_MAPS_LIBRARIES}
      onError={(error) => {
        if (error?.message?.includes("RefererNotAllowedMapError")) {
          console.error(
            "⚠️ Erreur Google Maps: RefererNotAllowedMapError\n" +
            "Pour résoudre ce problème :\n" +
            "1. Allez dans Google Cloud Console > APIs & Services > Credentials\n" +
            "2. Sélectionnez votre clé API\n" +
            "3. Dans 'Application restrictions', ajoutez :\n" +
            "   - http://localhost:3000/*\n" +
            "   - https://votre-domaine.com/*\n" +
            "4. Consultez docs/google-maps-setup.md pour plus de détails"
          );
        }
      }}
    >
      <SearchBarContent {...props} />
    </LoadScript>
  );
}

