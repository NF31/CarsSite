import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingReminderEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatus } from "@/lib/types/booking-status";

/**
 * API Route pour envoyer les rappels de réservation
 * 
 * Cette route doit être appelée par un cron job (ex: Vercel Cron, GitHub Actions, etc.)
 * pour vérifier les réservations à venir et envoyer les rappels 24h avant le début.
 * 
 * Pour sécuriser l'endpoint, utilisez un secret dans l'en-tête Authorization:
 * Authorization: Bearer <CRON_SECRET>
 * 
 * Exemple de configuration Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-booking-reminders",
 *     "schedule": "0 0,6,12,18 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel mais recommandé)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const now = new Date();
    // Calculer la date cible : 24h à partir de maintenant (± 6h de marge pour éviter les doublons)
    const targetDateStart = new Date(now.getTime() + (24 - 6) * 60 * 60 * 1000); // 18h avant
    const targetDateEnd = new Date(now.getTime() + (24 + 6) * 60 * 60 * 1000); // 30h avant

    console.log("[Booking Reminders Cron] 🔍 Recherche des réservations à rappeler", {
      now: now.toISOString(),
      targetDateStart: targetDateStart.toISOString(),
      targetDateEnd: targetDateEnd.toISOString(),
    });

    // Récupérer les réservations qui commencent dans ~24h et qui sont confirmées
    const bookings = await prisma.booking.findMany({
      where: {
        startDate: {
          gte: targetDateStart,
          lte: targetDateEnd,
        },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING], // Inclure PENDING car elles peuvent être confirmées
        },
        reminderSent: false, // Ne pas renvoyer si déjà envoyé
      },
      include: {
        user: {
          include: {
            preferences: true, // Vérifier si l'utilisateur a activé les rappels
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        pickupLocation: {
          select: {
            name: true,
          },
        },
        returnLocation: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`[Booking Reminders Cron] 📋 ${bookings.length} réservation(s) trouvée(s)`);

    const results = {
      total: bookings.length,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        bookingId: string;
        reference: string;
        status: "sent" | "skipped" | "error";
        reason?: string;
      }>,
    };

    for (const booking of bookings) {
      try {
        // Vérifier si l'utilisateur a activé les rappels
        const userPreferences = booking.user.preferences;
        if (!userPreferences?.bookingReminders) {
          console.log(
            `[Booking Reminders Cron] ⏭️  Rappel ignoré pour ${booking.reference} (rappels désactivés par l'utilisateur)`
          );
          results.skipped++;
          results.details.push({
            bookingId: booking.id,
            reference: booking.reference,
            status: "skipped",
            reason: "Rappels désactivés par l'utilisateur",
          });
          continue;
        }

        // Vérifier si les notifications email sont activées
        if (!userPreferences.emailNotifications) {
          console.log(
            `[Booking Reminders Cron] ⏭️  Rappel ignoré pour ${booking.reference} (notifications email désactivées)`
          );
          results.skipped++;
          results.details.push({
            bookingId: booking.id,
            reference: booking.reference,
            status: "skipped",
            reason: "Notifications email désactivées",
          });
          continue;
        }

        // Vérifier que l'utilisateur a un email
        if (!booking.user.email) {
          console.log(
            `[Booking Reminders Cron] ⏭️  Rappel ignoré pour ${booking.reference} (pas d'email utilisateur)`
          );
          results.skipped++;
          results.details.push({
            bookingId: booking.id,
            reference: booking.reference,
            status: "skipped",
            reason: "Pas d'email utilisateur",
          });
          continue;
        }

        // Préparer les données pour l'email
        const bookingPeriod = `${format(booking.startDate, "dd MMMM yyyy 'à' HH:mm", {
          locale: fr,
        })} → ${format(booking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;
        const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";

        // Envoyer l'email de rappel
        const emailResult = await sendBookingReminderEmail({
          to: booking.user.email,
          name: booking.user.name || "Client",
          greeting,
          booking: {
            reference: booking.reference,
            totalPrice: booking.totalPrice,
            depositPaid: booking.depositPaid || 0,
            remainingAmount: booking.remainingAmount || 0,
            startDate: booking.startDate,
            endDate: booking.endDate,
            period: bookingPeriod,
          },
          vehicle: {
            label: `${booking.vehicle.brand} ${booking.vehicle.model}`,
            licensePlate: booking.vehicle.licensePlate,
          },
          locations: {
            pickup: booking.pickupLocation.name,
            return: booking.returnLocation.name,
          },
        });

        if (emailResult.success) {
          // Marquer le rappel comme envoyé
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent: true },
          });

          console.log(
            `[Booking Reminders Cron] ✅ Rappel envoyé pour ${booking.reference} à ${booking.user.email}`
          );
          results.sent++;
          results.details.push({
            bookingId: booking.id,
            reference: booking.reference,
            status: "sent",
          });
        } else {
          console.error(
            `[Booking Reminders Cron] ❌ Échec d'envoi pour ${booking.reference}:`,
            emailResult.error
          );
          results.errors++;
          results.details.push({
            bookingId: booking.id,
            reference: booking.reference,
            status: "error",
            reason: emailResult.error || "Erreur inconnue",
          });
        }
      } catch (error) {
        console.error(
          `[Booking Reminders Cron] ❌ Erreur lors du traitement de ${booking.reference}:`,
          error
        );
        results.errors++;
        results.details.push({
          bookingId: booking.id,
          reference: booking.reference,
          status: "error",
          reason: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    console.log("[Booking Reminders Cron] ✅ Traitement terminé", results);

    return NextResponse.json({
      success: true,
      message: `Rappels traités: ${results.sent} envoyés, ${results.skipped} ignorés, ${results.errors} erreurs`,
      results,
    });
  } catch (error) {
    console.error("[Booking Reminders Cron] ❌ Erreur critique:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

