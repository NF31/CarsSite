/**
 * Module email-queue-sender - Point d'entrée principal
 * 
 * Ce fichier exporte toutes les fonctions de queue d'emails depuis les modules organisés.
 * La logique a été refactorisée et organisée dans lib/email-queue/
 */

// Emails d'authentification
export {
  queueVerificationEmail,
  queuePasswordResetEmail,
  queueAccountDeletionEmail,
} from "./email-queue/queue-auth-emails";

// Emails de réservation
export {
  queueBookingConfirmationEmail,
  queueBookingUpdateEmail,
  queueBookingReminderEmail,
  queueBookingCancellationRejectedEmail,
  queueBookingCancellationRequestEmail,
  queueBookingCancellationEmail,
} from "./email-queue/queue-booking-emails";

// Emails de contact
export {
  queueContactConfirmationEmail,
  queueContactNotificationEmail,
} from "./email-queue/queue-contact-emails";

// Types
export * from "./email-queue/types";
