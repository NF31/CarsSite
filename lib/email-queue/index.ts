/**
 * Module email-queue - Export centralisé de toutes les fonctions de queue d'emails
 */

// Emails d'authentification
export {
  queueVerificationEmail,
  queuePasswordResetEmail,
  queueAccountDeletionEmail,
} from "./queue-auth-emails";

// Emails de réservation
export {
  queueBookingConfirmationEmail,
  queueBookingUpdateEmail,
  queueBookingReminderEmail,
  queueBookingCancellationRejectedEmail,
  queueBookingCancellationRequestEmail,
  queueBookingCancellationEmail,
} from "./queue-booking-emails";

// Emails de contact
export {
  queueContactConfirmationEmail,
  queueContactNotificationEmail,
} from "./queue-contact-emails";

// Types
export * from "./types";

