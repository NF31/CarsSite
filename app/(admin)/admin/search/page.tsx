import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Car, Calendar, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const query = searchParams.q || "";
  const searchTerm = query.trim();

  let vehicles: any[] = [];
  let bookings: any[] = [];
  let clients: any[] = [];

  if (searchTerm) {
    // Recherche dans les véhicules
    vehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { brand: { contains: searchTerm, mode: "insensitive" } },
          { model: { contains: searchTerm, mode: "insensitive" } },
          { licensePlate: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      include: {
        location: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    });

    // Recherche dans les réservations
    bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { reference: { contains: searchTerm, mode: "insensitive" } },
          {
            user: {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { email: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
          {
            vehicle: {
              OR: [
                { brand: { contains: searchTerm, mode: "insensitive" } },
                { model: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
        ],
      },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Recherche dans les clients (exclure les comptes supprimés)
    clients = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        deletedAt: null, // Exclure les comptes supprimés
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }

  const totalResults = vehicles.length + bookings.length + clients.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recherche</h1>
        <p className="text-gray-600 mt-1">
          {searchTerm
            ? `${totalResults} résultat${totalResults > 1 ? "s" : ""} trouvé${totalResults > 1 ? "s" : ""} pour "${searchTerm}"`
            : "Recherchez des véhicules, réservations ou clients"}
        </p>
      </div>

      {!searchTerm && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Utilisez la barre de recherche en haut pour rechercher
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm && totalResults === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun résultat trouvé pour "{searchTerm}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm && totalResults > 0 && (
        <div className="space-y-6">
          {/* Véhicules */}
          {vehicles.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  <CardTitle>Véhicules ({vehicles.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <Link
                      key={vehicle.id}
                      href={`/admin/vehicles/${vehicle.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.licensePlate} • {vehicle.location.city}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Réservations */}
          {bookings.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>Réservations ({bookings.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">
                        #{booking.reference} - {booking.user.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.vehicle.brand} {booking.vehicle.model} •{" "}
                        {new Date(booking.startDate).toLocaleDateString("fr-FR")}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clients */}
          {clients.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Clients ({clients.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/admin/clients/${client.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.email} {client.phone && `• ${client.phone}`}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

