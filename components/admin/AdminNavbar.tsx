"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Shield,
  Search,
  Check,
  X,
  Loader2,
  Clock,
} from "lucide-react";
import { AdminSidebarMobile } from "./AdminSidebar";
import type { Session } from "next-auth";
import type { AdminNotificationData, BookingNotificationItem } from "@/lib/admin/notifications";
import { moderateBookingStatusAction } from "@/actions/admin/bookings";

interface AdminNavbarProps {
  session: Session;
  bookingNotifications?: AdminNotificationData;
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return dateTimeFormatter.format(date);
}

function truncateReference(reference: string) {
  if (reference.length <= 12) {
    return reference;
  }
  return `${reference.slice(0, 8)}…${reference.slice(-2)}`;
}

type NavbarNotificationItem = BookingNotificationItem & {
  type?: "creation" | "modification" | "cancellation";
  cancellationReason?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationRefundRate?: number | null;
  depositPaid?: number;
};

export function AdminNavbar({ session, bookingNotifications }: AdminNavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingBookings, setPendingBookings] = useState<NavbarNotificationItem[]>(
    (bookingNotifications?.items as NavbarNotificationItem[]) ?? [],
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [isModerating, startModerate] = useTransition();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Rediriger vers une page de recherche ou passer le paramètre
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const notificationCount = pendingBookings.length;
  const hiddenNotifications =
    Math.max(0, (bookingNotifications?.totalPending ?? 0) - pendingBookings.length) || 0;

  const handleModeration = (bookingId: string, action: "approve" | "reject") => {
    setActionError(null);
    setActiveBookingId(bookingId);
    startModerate(async () => {
      const result = await moderateBookingStatusAction({ bookingId, action });
      if (!result.success) {
        setActionError(result.error ?? "Impossible de traiter cette réservation.");
        setActiveBookingId(null);
        return;
      }
      setPendingBookings((previous) => previous.filter((item) => item.id !== bookingId));
      setActiveBookingId(null);
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 lg:ml-64">
        {/* Bouton menu mobile */}
        <div className="lg:hidden -ml-1">
          <AdminSidebarMobile />
        </div>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher véhicules, réservations, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full"
            />
          </div>
        </form>

        {/* Espace flexible pour mobile */}
        <div className="flex-1 md:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Bouton recherche mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Search className="h-4 w-4" />
                <span className="sr-only">Rechercher</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
              <DropdownMenuLabel>Recherche</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form onSubmit={handleSearch} className="p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 max-w-[calc(100vw-2rem)]">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationCount === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune demande de validation ou d&apos;annulation en attente.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-3 px-2 py-2">
                    {pendingBookings.map((booking) => {
                      const isProcessing = isModerating && activeBookingId === booking.id;
                      return (
                        <div
                          key={booking.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">
                                  {booking.userName}
                                </span>
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {truncateReference(booking.reference)}
                                </Badge>
                                <Badge
                                  variant={booking.type === "cancellation" ? "destructive" : "secondary"}
                                  className="text-[10px]"
                                >
                                  {booking.type === "cancellation"
                                    ? "Annulation demandée"
                                    : "Validation requise"}
                                </Badge>
                              </div>
                              {booking.userEmail ? (
                                <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
                              ) : null}
                            </div>
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="text-xs text-primary underline-offset-2 hover:underline"
                            >
                              Voir
                            </Link>
                          </div>
                          <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              Période demandée
                            </div>
                            <p className="mt-1">
                              {formatDateTime(booking.startDate)} → {formatDateTime(booking.endDate)}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {booking.vehicleLabel}
                              {booking.vehiclePlate ? ` • ${booking.vehiclePlate}` : ""}
                            </p>
                          </div>
                          {booking.type === "cancellation" ? (
                            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                              <p className="font-semibold">Annulation à valider</p>
                              {booking.cancellationRequestedAt ? (
                                <p>
                                  Demandée le{" "}
                                  {formatDateTime(booking.cancellationRequestedAt)}
                                </p>
                              ) : null}
                              {booking.cancellationReason ? (
                                <p className="mt-1 italic text-rose-800">
                                  « {booking.cancellationReason} »
                                </p>
                              ) : null}
                              <p className="mt-1">
                                Acompte : {booking.depositPaid ? `${booking.depositPaid.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}` : "—"}.
                                {booking.cancellationRefundRate === 1
                                  ? " Remboursement estimé : 100%."
                                  : booking.cancellationRefundRate === 0.5
                                  ? " Remboursement estimé : 50%."
                                  : " Aucun remboursement estimé."}
                              </p>
                            </div>
                          ) : null}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleModeration(booking.id, "reject")}
                              className="inline-flex items-center gap-1"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                              {booking.type === "cancellation" ? "Rejeter la demande" : "Refuser"}
                            </Button>
                            <Button
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleModeration(booking.id, "approve")}
                              className="inline-flex items-center gap-1"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              {booking.type === "cancellation" ? "Confirmer l'annulation" : "Valider"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {hiddenNotifications > 0 && (
                <div className="px-4 pb-3 text-xs text-muted-foreground">
                  Et {hiddenNotifications} autre{hiddenNotifications > 1 ? "s" : ""} demande{hiddenNotifications > 1 ? "s" : ""} en file d&apos;attente.
                </div>
              )}
              {actionError ? (
                <div className="px-4 pb-3 text-xs font-medium text-red-600">{actionError}</div>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu utilisateur */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || "Admin"}
                    />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {session.user.name ? getInitials(session.user.name) : "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 sm:w-64 max-w-[calc(100vw-2rem)]" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard Client
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/dashboard" className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Dashboard Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                {/* Lien Avis clients désactivé pour le moment */}
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

