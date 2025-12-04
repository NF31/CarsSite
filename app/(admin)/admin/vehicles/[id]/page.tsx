import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getVehicleByIdAction } from "@/actions/admin/vehicles/get-by-id";
import { VehicleDetailsPageClient } from "./VehicleDetailsPageClient";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const vehicleResult = await getVehicleByIdAction(id);
  
  if (!vehicleResult.success || !vehicleResult.data) {
    return {
      title: "Véhicule introuvable - Administration",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const vehicle = vehicleResult.data;
  return {
    title: `${vehicle.brand} ${vehicle.model} - Détails - Administration`,
    description: `Détails du véhicule ${vehicle.brand} ${vehicle.model} ${vehicle.year} - ${vehicle.licensePlate}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface VehicleDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VehicleDetailsPage({ params }: VehicleDetailsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const vehicleResult = await getVehicleByIdAction(id);

  if (!vehicleResult.success || !vehicleResult.data) {
    notFound();
  }

  return <VehicleDetailsPageClient vehicle={vehicleResult.data} />;
}

