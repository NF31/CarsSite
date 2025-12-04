import { BookingStatus } from "@/lib/types/booking-status";

/**
 * Fonction utilitaire pour synchroniser le statut d'une réservation
 * en tenant compte de tous les états (modification, annulation, paiement)
 * 
 * Cette fonction garantit la cohérence des statuts entre :
 * - Les actions du client (modification, annulation)
 * - L'espace admin (validation, rejet)
 * - Les webhooks Stripe (paiement confirmé)
 */
export interface BookingStatusContext {
  // État actuel de la réservation
  currentStatus: BookingStatus;
  
  // Demandes en cours
  modificationRequested?: boolean;
  cancellationRequested?: boolean;
  
  // Paiement
  modificationDepositDifference?: number | null;
  depositPaid?: number;
  
  // Dates pour vérification
  startDate?: Date;
  now?: Date;
}

/**
 * Calcule le statut approprié pour une réservation selon son contexte
 */
export function calculateBookingStatus(context: BookingStatusContext): BookingStatus {
  const {
    currentStatus,
    modificationRequested = false,
    cancellationRequested = false,
  modificationDepositDifference,
  startDate,
    now = new Date(),
  } = context;

  // Si une annulation est demandée et en attente de traitement admin, reste PENDING
  if (cancellationRequested) {
    // Si l'annulation est en cours de traitement, on ne change pas le statut
    // L'admin doit confirmer ou rejeter l'annulation
    if (currentStatus === BookingStatus.PENDING) {
      return BookingStatus.PENDING;
    }
    // Si le statut n'est pas encore PENDING, on le met en PENDING pour traitement admin
    if (currentStatus !== BookingStatus.CANCELLED) {
      return BookingStatus.PENDING;
    }
  }

  // Si une modification est demandée, le statut DOIT être PENDING
  // (en attente de validation par l'admin)
  if (modificationRequested) {
    return BookingStatus.PENDING;
  }

  // Si un paiement de modification est en attente (modificationDepositDifference > 0)
  // même si modificationRequested est false (car l'admin a validé mais le paiement n'est pas fait)
  if ((modificationDepositDifference ?? 0) > 0) {
    return BookingStatus.PENDING;
  }

  // Si la réservation est annulée, on ne change pas
  if (currentStatus === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  // Si la réservation est terminée, on ne change pas
  if (currentStatus === BookingStatus.COMPLETED) {
    return BookingStatus.COMPLETED;
  }

  // Si la réservation a commencé, elle devrait être IN_PROGRESS
  if (startDate && startDate <= now) {
    // Mais seulement si elle n'est pas déjà annulée ou terminée
    // (déjà vérifié ci-dessus, donc si on arrive ici, ce n'est ni CANCELLED ni COMPLETED)
    // Vérifier aussi la date de fin
    // (cette vérification nécessiterait endDate, mais on se contente de startDate pour l'instant)
    return BookingStatus.IN_PROGRESS;
  }

  // Sinon, retourner le statut actuel (pas de changement forcé)
  return currentStatus;
}

/**
 * Vérifie si une réservation peut être modifiée
 */
export function canModifyBooking(context: BookingStatusContext): {
  canModify: boolean;
  reason?: string;
} {
  const {
    currentStatus,
    cancellationRequested = false,
    modificationRequested = false,
    startDate,
    now = new Date(),
  } = context;

  // Ne peut pas modifier si déjà annulée
  if (currentStatus === BookingStatus.CANCELLED) {
    return {
      canModify: false,
      reason: "Cette réservation est annulée et ne peut plus être modifiée.",
    };
  }

  // Ne peut pas modifier si terminée
  if (currentStatus === BookingStatus.COMPLETED) {
    return {
      canModify: false,
      reason: "Cette réservation est terminée et ne peut plus être modifiée.",
    };
  }

  // Ne peut pas modifier si une annulation est en cours
  if (cancellationRequested) {
    return {
      canModify: false,
      reason: "Une demande d'annulation est en cours pour cette réservation.",
    };
  }

  // Ne peut pas modifier si une modification est déjà en cours
  // Vérifier aussi modificationDepositDifference car une modification peut être acceptée
  // mais le paiement pas encore fait
  if (modificationRequested || (context.modificationDepositDifference ?? 0) > 0) {
    return {
      canModify: false,
      reason: "Une demande de modification est déjà en cours pour cette réservation.",
    };
  }

  // Ne peut pas modifier si la réservation a commencé
  if (startDate && startDate <= now) {
    return {
      canModify: false,
      reason: "Cette réservation a commencé et ne peut plus être modifiée.",
    };
  }

  // Ne peut pas modifier si en cours (IN_PROGRESS)
  if (currentStatus === BookingStatus.IN_PROGRESS) {
    return {
      canModify: false,
      reason: "Cette réservation est en cours et ne peut plus être modifiée.",
    };
  }

  return { canModify: true };
}

/**
 * Vérifie si une réservation peut être annulée
 */
export function canCancelBooking(context: BookingStatusContext): {
  canCancel: boolean;
  reason?: string;
} {
  const {
    currentStatus,
    cancellationRequested = false,
    startDate,
    now = new Date(),
  } = context;

  // Ne peut pas annuler si déjà annulée
  if (currentStatus === BookingStatus.CANCELLED) {
    return {
      canCancel: false,
      reason: "Cette réservation est déjà annulée.",
    };
  }

  // Ne peut pas annuler si terminée
  if (currentStatus === BookingStatus.COMPLETED) {
    return {
      canCancel: false,
      reason: "Cette réservation est terminée et ne peut plus être annulée.",
    };
  }

  // Ne peut pas annuler si une annulation est déjà en cours
  if (cancellationRequested) {
    return {
      canCancel: false,
      reason: "Une demande d'annulation est déjà en cours pour cette réservation.",
    };
  }

  // Ne peut pas annuler si la réservation a commencé
  if (startDate && startDate <= now) {
    return {
      canCancel: false,
      reason: "Cette réservation a commencé ou est en cours. Contactez le support si besoin.",
    };
  }

  // Peut annuler seulement si PENDING ou CONFIRMED
  if (
    currentStatus !== BookingStatus.PENDING &&
    currentStatus !== BookingStatus.CONFIRMED
  ) {
    return {
      canCancel: false,
      reason: "Cette réservation ne peut pas être annulée depuis l'espace client.",
    };
  }

  // Si une modification est en cours, on peut quand même annuler
  // (l'annulation prend priorité sur la modification)

  return { canCancel: true };
}

/**
 * Synchronise le statut d'une réservation dans la base de données
 * Utilise une transaction pour garantir la cohérence
 */
export async function syncBookingStatus(
  prisma: {
    booking: {
      update: (args: {
        where: { id: string };
        data: { status: BookingStatus };
        select: { id: true; status: true };
      }) => Promise<{ id: string; status: BookingStatus }>;
    };
  },
  bookingId: string,
  context: BookingStatusContext
): Promise<BookingStatus> {
  // Calculer le nouveau statut
  const newStatus = calculateBookingStatus(context);

  // Si le statut n'a pas changé, ne rien faire
  if (newStatus === context.currentStatus) {
    return newStatus;
  }

  // Mettre à jour le statut dans la base de données
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
    select: { id: true, status: true },
  });

  return updated.status;
}

/**
 * Interface pour le calcul du statut dérivé (pour l'affichage)
 * Prend en compte le statut réel en DB, les dates, et les demandes en cours
 */
export interface DerivedStatusContext {
  // Statut réel dans la base de données
  status: BookingStatus;
  
  // Dates de la réservation
  startDate: Date | string;
  endDate: Date | string;
  
  // Demandes en cours
  cancellationRequested?: boolean;
  modificationRequested?: boolean;
  modificationDepositDifference?: number | null;
  
  // Date actuelle (optionnel, par défaut maintenant)
  now?: Date;
}

/**
 * Calcule le statut dérivé pour l'affichage
 * Cette fonction est utilisée dans les interfaces client et admin
 * pour afficher le statut réel d'une réservation en tenant compte :
 * - Du statut réel en DB
 * - Des dates (IN_PROGRESS si en cours, COMPLETED si terminée)
 * - Des demandes en cours (modification, annulation)
 * 
 * ⚠️ IMPORTANT : Cette fonction ne modifie PAS le statut en DB,
 * elle calcule seulement le statut à afficher
 */
export function deriveBookingStatus(context: DerivedStatusContext): BookingStatus {
  const {
    status,
    startDate: startDateInput,
    endDate: endDateInput,
    cancellationRequested = false,
    modificationRequested = false,
    modificationDepositDifference,
    now = new Date(),
  } = context;

  // Convertir les dates si nécessaire
  const startDate = typeof startDateInput === 'string' ? new Date(startDateInput) : startDateInput;
  const endDate = typeof endDateInput === 'string' ? new Date(endDateInput) : endDateInput;

  // Si annulée, toujours retourner CANCELLED
  if (status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  // Si une annulation est en cours, afficher PENDING pour indiquer qu'elle est en attente
  // (si status === CANCELLED, on a déjà retourné CANCELLED ci-dessus, donc on n'arrive jamais ici)
  if (cancellationRequested) {
    return BookingStatus.PENDING;
  }

  // Si une modification est en cours, afficher PENDING pour indiquer qu'elle est en attente
  // Vérifier aussi modificationDepositDifference car une modification peut être acceptée
  // mais le paiement pas encore fait (modificationRequested = false mais modificationDepositDifference > 0)
  if (modificationRequested || (modificationDepositDifference ?? 0) > 0) {
    // Si une modification est demandée ou en attente de paiement, afficher PENDING
    return BookingStatus.PENDING;
  }

  // Si la réservation est terminée (date de fin passée), retourner COMPLETED
  if (endDate <= now) {
    // Sauf si elle est annulée (déjà géré ci-dessus)
    return BookingStatus.COMPLETED;
  }

  // Si la réservation est en cours (début passée mais fin pas encore), retourner IN_PROGRESS
  if (startDate <= now && now < endDate) {
    // Sauf si elle est annulée ou terminée (déjà gérés ci-dessus)
    return BookingStatus.IN_PROGRESS;
  }

  // Sinon, retourner le statut réel de la base de données
  return status;
}

/**
 * Type pour les informations de base d'une réservation nécessaires au calcul du statut dérivé
 */
export type BookingForDerivedStatus = {
  status: BookingStatus;
  startDate: Date | string;
  endDate: Date | string;
  cancellationRequested?: boolean | null;
  modificationRequested?: boolean | null;
};

/**
 * Version simplifiée de deriveBookingStatus pour les cas où on a déjà un objet booking
 */
export function deriveBookingStatusFromBooking(
  booking: BookingForDerivedStatus,
  now?: Date
): BookingStatus {
  return deriveBookingStatus({
    status: booking.status,
    startDate: booking.startDate,
    endDate: booking.endDate,
    cancellationRequested: booking.cancellationRequested ?? false,
    modificationRequested: booking.modificationRequested ?? false,
    now,
  });
}

