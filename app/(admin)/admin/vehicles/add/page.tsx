import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocationsAction } from "@/actions/admin/vehicles/get-locations";
import { VehicleForm } from "./VehicleForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ajouter un véhicule - Administration",
  description: "Créer un nouveau véhicule dans la flotte",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AddVehiclePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Charger les localisations
  const locationsResult = await getLocationsAction();
  const locations = locationsResult.success ? locationsResult.data : [];

  return <VehicleForm locations={locations} />;
}

