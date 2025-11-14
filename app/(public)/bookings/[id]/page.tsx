import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getClientBookingByIdAction } from "@/actions/client/bookings/get-booking";
import { ClientBookingDetailsPage } from "./ClientBookingDetailsPage";

interface BookingDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?redirect=/bookings");
  }

  const { id } = await params;

  const result = await getClientBookingByIdAction(id);

  if (!result.success || !result.data) {
    redirect("/dashboard");
  }

  return <ClientBookingDetailsPage booking={result.data} />;
}

