import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicVehicleByIdAction } from "@/actions/public/vehicles/get-by-id";
import { BookingClientPage } from "./BookingClientPage";

export const metadata: Metadata = {
  title: "Réserver un véhicule - CarRental",
  description: "Réservez votre véhicule en quelques étapes simples",
};

interface BookingNewPageProps {
  searchParams: Promise<{
    vehicleId?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    pickup?: string;
    returnLocation?: string;
    pickupPlaceId?: string;
    returnPlaceId?: string;
    step?: string;
    serviceIds?: string;
    bookingId?: string; // ID de la réservation existante si on revient depuis la page de paiement
  }>;
}

export default async function BookingNewPage({
  searchParams,
}: BookingNewPageProps) {
  const params = await searchParams;

  // Log serveur pour voir tous les paramètres reçus AVANT extraction
  console.log("🔍 [BookingNewPage - SERVEUR] Paramètres reçus (RAW):", {
    timestamp: new Date().toISOString(),
    allKeys: Object.keys(params),
    bookingIdRaw: params.bookingId,
    bookingIdType: typeof params.bookingId,
    bookingIdLength: params.bookingId?.length,
    bookingIdValue: params.bookingId,
    vehicleId: params.vehicleId,
    step: params.step,
    // Afficher tous les paramètres pour debug
    allParams: Object.entries(params).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : value,
      type: typeof value,
      length: typeof value === 'string' ? value.length : undefined,
    })),
  });

  // Vérifier que vehicleId est fourni
  if (!params.vehicleId) {
    redirect("/vehicles");
  }

  // Récupérer les informations du véhicule
  const vehicleResult = await getPublicVehicleByIdAction(params.vehicleId);

  if (!vehicleResult.success || !vehicleResult.data) {
    redirect("/vehicles");
  }

  const vehicle = vehicleResult.data;

  // Extraire les paramètres de recherche
  const startDate = params.startDate || "";
  const endDate = params.endDate || "";
  const startTime = params.startTime || "";
  const endTime = params.endTime || "";
  const pickup = params.pickup || "";
  const returnLocation = params.returnLocation || "";
  const pickupPlaceId = params.pickupPlaceId || "";
  const returnPlaceId = params.returnPlaceId || "";
  const step = params.step ? parseInt(params.step, 10) : undefined;
  const serviceIds = params.serviceIds ? params.serviceIds.split(',').filter(Boolean) : [];
  const bookingId = params.bookingId?.trim() || undefined;

  // Log serveur pour déboguer l'extraction
  console.log("🔍 [BookingNewPage - SERVEUR] Paramètres extraits:", {
    timestamp: new Date().toISOString(),
    bookingId: bookingId || "UNDEFINED",
    bookingIdRaw: params.bookingId || "UNDEFINED",
    bookingIdAfterTrim: params.bookingId?.trim() || "UNDEFINED",
    step: step || "UNDEFINED",
    vehicleId: params.vehicleId || "UNDEFINED",
    allParamKeys: Object.keys(params),
    willPassToComponent: {
      existingBookingId: bookingId || undefined,
      initialStep: step,
    },
  });

  return (
    <BookingClientPage
      vehicle={vehicle}
      initialStartDate={startDate}
      initialEndDate={endDate}
      initialStartTime={startTime}
      initialEndTime={endTime}
      initialPickup={pickup}
      initialReturnLocation={returnLocation}
      initialPickupPlaceId={pickupPlaceId}
      initialReturnPlaceId={returnPlaceId}
      initialStep={step}
      initialServiceIds={serviceIds}
      existingBookingId={bookingId}
    />
  );
}

