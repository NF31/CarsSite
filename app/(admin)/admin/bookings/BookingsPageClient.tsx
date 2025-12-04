"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, CalendarDays, List, Grid3x3, X } from "lucide-react";
import {
  getBookingsAction,
  type GetBookingsFilters,
  type BookingListItem,
} from "@/actions/admin/bookings";
import { BookingsFilters } from "@/components/admin/bookings/BookingsFilters";
import { BookingsGridView } from "@/components/admin/bookings/BookingsGridView";
import { BookingsListView } from "@/components/admin/bookings/BookingsListView";
import { BookingsPagination } from "@/components/admin/bookings/BookingsPagination";

type ViewMode = "grid" | "list";

interface BookingsPageClientProps {
  initialLocations: Array<{ id: string; name: string; city: string }>;
}

export function BookingsPageClient({ initialLocations }: BookingsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState<GetBookingsFilters>({
    page: 1,
    limit: 12,
  });
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<"created" | "updated" | "cancelled" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const success = searchParams.get("success");
    if (!success) {
      return;
    }

    if (success === "booking-created") {
      setSuccessType("created");
      setShowSuccess(true);
    } else if (success === "booking-updated") {
      setSuccessType("updated");
      setShowSuccess(true);
    } else if (success === "booking-cancelled") {
      setSuccessType("cancelled");
      setShowSuccess(true);
    }

    if (success) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      router.replace(newUrl);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setSuccessType(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, router]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) {
      return undefined;
    }

    const messages: Record<string, string> = {
      "booking-invalid": "La réservation demandée est introuvable ou invalide.",
      "booking-locked": "Cette réservation ne peut plus être modifiée car sa période est déjà passée.",
      "booking-update-failed": "Impossible de mettre à jour la réservation. Veuillez réessayer.",
    };

    const message = messages[error];

    if (!message) {
      return undefined;
    }

    setErrorMessage(message);
    setShowError(true);

    const paramsCopy = new URLSearchParams(searchParams.toString());
    paramsCopy.delete("error");
    const newUrl = paramsCopy.toString()
      ? `${window.location.pathname}?${paramsCopy.toString()}`
      : window.location.pathname;
    router.replace(newUrl);

    const timeout = window.setTimeout(() => {
      setShowError(false);
      setErrorMessage(null);
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [router, searchParams]);

  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const result = await getBookingsAction(filters);
        if (result.success && result.data) {
          setBookings(result.data.bookings);
          setPagination(result.data.pagination);
        }
      } catch (error) {
        console.error("Error loading bookings:", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [filters]);

  const handleFiltersChange = (newFilters: GetBookingsFilters) => {
    setFilters({
      ...newFilters,
      page: 1,
      limit: filters.limit ?? 12,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startIndex = useMemo(() => (pagination.page - 1) * pagination.limit, [pagination.page, pagination.limit]);

  return (
    <div className="space-y-6">
      {showError && errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => {
              setShowError(false);
              setErrorMessage(null);
            }}
            className="text-red-700 hover:text-red-900 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer la notification d'erreur</span>
          </button>
        </div>
      )}

      {showSuccess && successType && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>
              {successType === "created"
                ? "Réservation créée avec succès !"
                : successType === "updated"
                ? "Réservation mise à jour avec succès !"
                : "Réservation annulée avec succès !"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowSuccess(false);
              setSuccessType(null);
            }}
            className="text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer la notification</span>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Réservations</h1>
          <p className="text-gray-600 mt-1">
            Suivez toutes les réservations clients ({pagination.total} réservation
            {pagination.total > 1 ? "s" : ""})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1 bg-white shadow-sm">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="sr-only">Vue grille</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Vue liste</span>
            </Button>
          </div>
          <Button asChild>
            <Link href="/admin/bookings/add">
              <CalendarDays className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Link>
          </Button>
        </div>
      </div>

      <BookingsFilters filters={filters} onFiltersChange={handleFiltersChange} locations={initialLocations} />

      {isLoading || isPending ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Chargement des réservations...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="space-y-6">
              <BookingsGridView bookings={bookings} startIndex={startIndex} />
              {bookings.length > 0 && (
                <BookingsPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                  startIndex={startIndex}
                  itemsPerPage={pagination.limit}
                  totalItems={pagination.total}
                />
              )}
            </div>
          ) : (
            <>
              <BookingsListView bookings={bookings} startIndex={startIndex} />
              {bookings.length > 0 && (
                <BookingsPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                  startIndex={startIndex}
                  itemsPerPage={pagination.limit}
                  totalItems={pagination.total}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}


