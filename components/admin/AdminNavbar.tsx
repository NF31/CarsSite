"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AdminSidebarMobile } from "./AdminSidebar";
import type { Session } from "next-auth";
import type { AdminNotificationData, BookingNotificationItem } from "@/lib/admin/notifications";
import { moderateBookingStatusAction } from "@/actions/admin/bookings";
import { markNotificationAsViewedAction } from "@/actions/admin/notifications/mark-as-viewed";

interface AdminNavbarProps {
  session: Session;
  bookingNotifications?: AdminNotificationData;
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return dateTimeFormatter.format(date);
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return currencyFormatter.format(value);
}

function truncateReference(reference: string) {
  if (reference.length <= 12) {
    return reference;
  }
  return `${reference.slice(0, 8)}…${reference.slice(-2)}`;
}

type NavbarNotificationItem = BookingNotificationItem & {
  type?: "creation" | "modification" | "cancellation" | "payment" | "modificationPayment";
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

  // Log pour debug
  console.log("[AdminNavbar] 🔔 Notifications reçues:", {
    totalPending: bookingNotifications?.totalPending ?? 0,
    itemsCount: bookingNotifications?.items?.length ?? 0,
    items: bookingNotifications?.items,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [isModerating, startModerate] = useTransition();
  const [isMarkingAsViewed, startMarkAsViewed] = useTransition();
  // État pour le dialog de refus (annulation ou modification)
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionBookingId, setRejectionBookingId] = useState<string | null>(null);
  const [rejectionBookingType, setRejectionBookingType] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

// Les notifications déjà vues sont filtrées côté serveur dans getAdminNotificationData
// Donc pendingBookings contient déjà uniquement les notifications non vues
const notificationCount = pendingBookings.length;
const hiddenNotifications =
  Math.max(
    0,
    (bookingNotifications?.totalPending ?? 0) -
      pendingBookings.filter((item) => item.requiresAction !== false).length,
  ) || 0;

const handleModeration = (bookingId: string, action: "approve" | "reject", bookingType?: string) => {
    // Empêcher les doubles clics
    if (activeBookingId === bookingId || isModerating) {
      return;
    }
    
    setActionError(null);
    
    // Si c'est un rejet d'annulation OU de modification, ouvrir le dialog pour saisir le message
    if (action === "reject" && (bookingType === "cancellation" || bookingType === "modification")) {
      setRejectionBookingId(bookingId);
      setRejectionBookingType(bookingType || null);
      setRejectionReason("");
      setRejectionDialogOpen(true);
      return;
    }
    
    // Sinon, procéder normalement
    setActiveBookingId(bookingId);
    startModerate(async () => {
      try {
        const result = await moderateBookingStatusAction({ bookingId, action });
        if (!result.success) {
          const errorMessage = result.error ?? "Impossible de traiter cette réservation.";
          setActionError(errorMessage);
          toast.error(errorMessage);
          setActiveBookingId(null);
          return;
        }
        
        // Afficher un message de succès selon le type et l'action
        if (action === "approve") {
          if (bookingType === "modification") {
            toast.success("Modification validée !", {
              description: `L'email a été envoyé au client avec les instructions de paiement.`,
            });
          } else if (bookingType === "cancellation") {
            toast.success("Annulation validée !", {
              description: `L'email de confirmation d'annulation a été envoyé au client.`,
            });
          } else {
            toast.success("Réservation validée !", {
              description: `L'email de confirmation a été envoyé au client.`,
            });
          }
        } else {
          if (bookingType === "modification") {
            toast.success("Modification refusée", {
              description: `L'email de refus a été envoyé au client.`,
            });
          } else if (bookingType === "cancellation") {
            toast.success("Annulation refusée", {
              description: `L'email de refus d'annulation a été envoyé au client.`,
            });
          } else {
            toast.success("Réservation refusée", {
              description: `L'email de refus a été envoyé au client.`,
            });
          }
        }
        
        // Ne pas marquer comme vue ni retirer de la liste ici
        // La logique dans getAdminNotificationData gère déjà l'affichage des PENDING
        // On laisse router.refresh() mettre à jour les notifications depuis la BDD
        
        // Revalider les données pour mettre à jour l'interface
        router.refresh();
      } catch (error) {
        console.error("[Admin Navbar] Erreur lors de la modération:", error);
        const errorMessage = "Une erreur est survenue lors du traitement.";
        setActionError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setActiveBookingId(null);
      }
  });
};

const handleRejectionConfirm = () => {
  if (!rejectionBookingId) return;
  
  // Empêcher les doubles clics
  if (activeBookingId === rejectionBookingId || isModerating) {
    return;
  }
  
  setActionError(null);
      setActiveBookingId(rejectionBookingId);
    startModerate(async () => {
      try {
        const result = await moderateBookingStatusAction({ 
          bookingId: rejectionBookingId, 
          action: "reject",
          rejectionReason: rejectionReason.trim() || undefined, // Envoyer undefined si vide
        });
        if (!result.success) {
          const errorMessage = result.error ?? "Impossible de traiter cette réservation.";
          setActionError(errorMessage);
          toast.error(errorMessage);
          setActiveBookingId(null);
          return;
        }
        
        // Adapter le message selon le type
        if (rejectionBookingType === "modification") {
          toast.success("Modification refusée", {
            description: `L'email de refus a été envoyé au client.`,
          });
        } else {
          toast.success("Annulation refusée", {
            description: `L'email de refus d'annulation a été envoyé au client.`,
          });
        }
        
        // Ne pas marquer comme vue ni retirer de la liste ici
        // La logique dans getAdminNotificationData gère déjà l'affichage des PENDING
        // On laisse router.refresh() mettre à jour les notifications depuis la BDD
        
        // Revalider les données pour mettre à jour l'interface
        router.refresh();
    } catch (error) {
      console.error("[Admin Navbar] Erreur lors du rejet:", error);
      const errorMessage = "Une erreur est survenue lors du traitement.";
      setActionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActiveBookingId(null);
      setRejectionDialogOpen(false);
      setRejectionBookingId(null);
      setRejectionBookingType(null);
      setRejectionReason("");
    }
  });
};

const handleDismiss = (bookingId: string) => {
  setActiveBookingId(bookingId);
  startMarkAsViewed(async () => {
    const result = await markNotificationAsViewedAction(bookingId);
    if (result.success) {
      // Retirer de la liste affichée
      setPendingBookings((previous) => previous.filter((item) => item.id !== bookingId));
    } else {
      console.error("[Admin Navbar] Erreur lors du marquage de la notification comme vue:", result.error);
    }
    setActiveBookingId(null);
  });
};

const handleViewNotification = (bookingId: string) => {
  // Marquer automatiquement comme vue quand on clique sur "Voir"
  setActiveBookingId(bookingId);
  startMarkAsViewed(async () => {
    const result = await markNotificationAsViewedAction(bookingId);
    if (result.success) {
      // Retirer de la liste affichée
      setPendingBookings((previous) => previous.filter((item) => item.id !== bookingId));
    } else {
      console.error("[Admin Navbar] Erreur lors du marquage de la notification comme vue:", result.error);
    }
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
                      const requiresAction = booking.requiresAction !== false;
                      const isCancellation = booking.type === "cancellation";
                      const isPaymentNotification = booking.type === "payment";
                      const isModificationPayment = booking.type === "modificationPayment";
                      const badgeLabel = isCancellation
                        ? "Annulation demandée"
                        : isModificationPayment
                        ? "Paiement modification reçu"
                        : isPaymentNotification
                        ? "Paiement reçu"
                        : "Validation requise";

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
                                  variant={isCancellation ? "destructive" : "secondary"}
                                  className={`text-[10px] ${
                                    isPaymentNotification
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : ""
                                  }`}
                                >
                                  {badgeLabel}
                                </Badge>
                              </div>
                              {booking.userEmail ? (
                                <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
                              ) : null}
                            </div>
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="text-xs text-primary underline-offset-2 hover:underline disabled:opacity-50"
                              onClick={() => handleViewNotification(booking.id)}
                            >
                              {isMarkingAsViewed && activeBookingId === booking.id ? "Marquage..." : "Voir"}
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
                          {isCancellation ? (
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
                                Acompte : {formatCurrency(booking.depositPaid)}.
                                {booking.cancellationRefundRate === 1
                                  ? " Remboursement estimé : 100%."
                                  : booking.cancellationRefundRate === 0.5
                                  ? " Remboursement estimé : 50%."
                                  : " Aucun remboursement estimé."}
                              </p>
                            </div>
                          ) : isModificationPayment ? (
                            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                              <p className="font-semibold flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Paiement supplémentaire de modification confirmé
                              </p>
                              <p className="mt-1">
                                Le client a effectué le paiement supplémentaire pour la modification de dates.
                              </p>
                              <p className="mt-1">
                                Acompte total payé : {formatCurrency(booking.depositPaid)}.
                              </p>
                              <p className="mt-1 text-blue-700">
                                La réservation est confirmée avec les nouvelles dates, aucune action requise.
                              </p>
                            </div>
                          ) : isPaymentNotification ? (
                            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                              <p className="font-semibold flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Paiement confirmé automatiquement
                              </p>
                              <p className="mt-1">
                                Acompte reçu : {formatCurrency(booking.depositPaid)}.
                              </p>
                              <p className="mt-1 text-emerald-700">
                                La réservation est déjà confirmée, aucune action requise.
                              </p>
                            </div>
                          ) : null}
                          {requiresAction ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={isProcessing || activeBookingId !== null}
                                onClick={() => handleModeration(booking.id, "reject", booking.type)}
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
                                disabled={isProcessing || activeBookingId !== null}
                                onClick={() => handleModeration(booking.id, "approve")}
                                className="inline-flex items-center gap-1"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                {booking.type === "cancellation"
                                  ? "Confirmer l'annulation"
                                  : "Valider"}
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-3 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => handleDismiss(booking.id)}
                                disabled={isMarkingAsViewed && activeBookingId === booking.id}
                              >
                                {isMarkingAsViewed && activeBookingId === booking.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                {isMarkingAsViewed && activeBookingId === booking.id ? "Marquage..." : "Marquer comme lu"}
                              </Button>
                            </div>
                          )}
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

      {/* Dialog pour le message de refus (annulation ou modification) */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {rejectionBookingType === "modification" 
                ? "Refuser la modification" 
                : "Rejeter la demande d&apos;annulation"}
            </DialogTitle>
            <DialogDescription>
              {rejectionBookingType === "modification"
                ? "Veuillez expliquer pourquoi vous refusez cette modification de dates. Ce message sera envoyé au client par email."
                : "Vous pouvez ajouter un message expliquant pourquoi la demande d&apos;annulation est refusée. Ce message sera envoyé au client par email."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                Message de refus (optionnel)
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder={
                  rejectionBookingType === "modification"
                    ? "Ex: Les nouvelles dates demandées ne sont pas disponibles. Le véhicule est déjà réservé pour cette période..."
                    : "Ex: La réservation est trop proche de la date de début pour permettre une annulation selon notre politique..."
                }
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {rejectionReason.length}/500 caractères
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialogOpen(false);
                setRejectionBookingId(null);
                setRejectionBookingType(null);
                setRejectionReason("");
              }}
              disabled={isModerating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRejectionConfirm}
              disabled={isModerating}
            >
              {isModerating && activeBookingId === rejectionBookingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Confirmer le refus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

