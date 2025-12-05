"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin } from "lucide-react";
import type { BookingData } from "../types";
import { useGoogleMapsAutocomplete } from "../hooks/use-google-maps-autocomplete";

interface DatesLocationsCardProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
}

export function DatesLocationsCard({ bookingData, updateBookingData }: DatesLocationsCardProps) {
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);
  const autocompletePickupRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteReturnRef = useRef<google.maps.places.Autocomplete | null>(null);

  useGoogleMapsAutocomplete({
    inputRef: pickupInputRef,
    autocompleteRef: autocompletePickupRef,
    fieldName: "pickup",
    placeIdFieldName: "pickupPlaceId",
    updateBookingData,
  });

  useGoogleMapsAutocomplete({
    inputRef: returnInputRef,
    autocompleteRef: autocompleteReturnRef,
    fieldName: "returnLocation",
    placeIdFieldName: "returnPlaceId",
    updateBookingData,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Dates de location</h4>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="startDate">Date de départ</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <Label htmlFor="startDate" className="sr-only">Date de départ - Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={bookingData.startDate}
                      onChange={(e) => updateBookingData({ startDate: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime" className="sr-only">Date de départ - Heure</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={bookingData.startTime}
                      onChange={(e) => updateBookingData({ startTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="endDate">Date de retour</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <Label htmlFor="endDate" className="sr-only">Date de retour - Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={bookingData.endDate}
                      onChange={(e) => updateBookingData({ endDate: e.target.value })}
                      min={bookingData.startDate || new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="sr-only">Date de retour - Heure</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={bookingData.endTime}
                      onChange={(e) => updateBookingData({ endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Lieux</h4>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="pickup">Lieu de retrait</Label>
                <Input
                  ref={pickupInputRef}
                  id="pickup"
                  type="text"
                  value={bookingData.pickup}
                  onChange={(e) => updateBookingData({ pickup: e.target.value })}
                  placeholder="Paris CDG Aéroport"
                  required
                />
              </div>
              <div>
                <Label htmlFor="returnLocation">Lieu de retour</Label>
                <Input
                  ref={returnInputRef}
                  id="returnLocation"
                  type="text"
                  value={bookingData.returnLocation}
                  onChange={(e) => updateBookingData({ returnLocation: e.target.value })}
                  placeholder="Paris CDG Aéroport"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

