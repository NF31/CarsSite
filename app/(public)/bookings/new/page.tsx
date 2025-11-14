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
  }>;
}

export default async function BookingNewPage({
  searchParams,
}: BookingNewPageProps) {
  const params = await searchParams;

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
    />
  );
}

