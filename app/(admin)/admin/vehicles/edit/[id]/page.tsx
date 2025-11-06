import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocationsAction } from "@/actions/admin/vehicles/get-locations";
import { getVehicleByIdAction } from "@/actions/admin/vehicles/get-by-id";
import { VehicleEditForm } from "./VehicleEditForm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Modifier un véhicule - Administration",
  description: "Modifier les informations d'un véhicule de la flotte",
  robots: {
    index: false,
    follow: false,
  },
};

interface EditVehiclePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Charger les localisations et le véhicule en parallèle
  const [locationsResult, vehicleResult] = await Promise.all([
    getLocationsAction(),
    getVehicleByIdAction(id),
  ]);

  const locations = locationsResult.success ? locationsResult.data : [];

  if (!vehicleResult.success || !vehicleResult.data) {
    notFound();
  }

  return <VehicleEditForm locations={locations} vehicle={vehicleResult.data} />;
}

