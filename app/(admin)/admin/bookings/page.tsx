import { getLocationsAction } from "@/actions/admin/vehicles/get-locations";
import { BookingsPageClient } from "./BookingsPageClient";

export default async function AdminBookingsPage() {
  const locationsResult = await getLocationsAction();
  const locations = locationsResult.success ? locationsResult.data : [];

  return <BookingsPageClient initialLocations={locations} />;
}

