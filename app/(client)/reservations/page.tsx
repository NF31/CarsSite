import { ReservationsPage } from "@/components/client/reservations/ReservationsPage/ReservationsPage";
import type { ReservationsPageProps } from "@/components/client/reservations/ReservationsPage/types";

export const dynamic = "force-dynamic";

export default function ClientReservationsPage(props: ReservationsPageProps) {
  return <ReservationsPage {...props} />;
}
