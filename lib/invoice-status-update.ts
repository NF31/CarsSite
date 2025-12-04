import prisma from "@/lib/prisma";
import { InvoiceStatus } from "@/lib/types/invoice-status";
import { PaymentStatus } from "@/lib/types/payment-status";

/**
 * Met à jour le statut des factures liées à une réservation après un paiement
 * 
 * Logique :
 * 1. Trouve toutes les factures liées à la réservation
 * 2. Pour chaque facture, calcule le montant total payé (somme de tous les paiements COMPLETED)
 * 3. Si le montant payé >= total de la facture, met le statut à PAID
 * 4. Si la date d'échéance est dépassée et la facture n'est pas payée, met le statut à OVERDUE
 * 5. Lie le paiement à la facture si possible
 * 
 * @param bookingId - ID de la réservation
 * @param paymentId - ID du paiement créé (optionnel)
 * @param paymentAmount - Montant du paiement (optionnel)
 */
export async function updateInvoiceStatusAfterPayment(
  bookingId: string,
  paymentId?: string,
  paymentAmount?: number
): Promise<void> {
  try {
    // Récupérer toutes les factures liées à cette réservation
    const invoices = await prisma.invoice.findMany({
      where: {
        bookingId: bookingId,
        status: {
          not: InvoiceStatus.CANCELLED, // Ignorer les factures annulées
        },
      },
      include: {
        payments: {
          where: {
            status: PaymentStatus.COMPLETED, // Seulement les paiements complétés
          },
        },
      },
    });

    if (invoices.length === 0) {
      console.log(`[Invoice Status Update] Aucune facture trouvée pour la réservation ${bookingId}`);
      return;
    }

    console.log(`[Invoice Status Update] 📋 Mise à jour du statut de ${invoices.length} facture(s) pour la réservation ${bookingId}`, {
      bookingId,
      invoiceCount: invoices.length,
      paymentId,
      paymentAmount,
      timestamp: new Date().toISOString(),
    });

    const now = new Date();

    // Traiter chaque facture
    for (const invoice of invoices) {
      // Calculer le montant total payé pour cette facture
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);

      // Si un nouveau paiement a été créé et qu'il n'est pas encore lié à une facture, essayer de le lier
      if (paymentId && paymentAmount && paymentAmount > 0) {
        // Vérifier si le paiement est déjà lié à cette facture
        const isPaymentLinked = invoice.payments.some((p) => p.id === paymentId);

        if (!isPaymentLinked) {
          // Essayer de lier le paiement à cette facture si :
          // 1. Le montant total payé (avant ce paiement) < total de la facture
          // 2. Le paiement complète ou contribue au paiement de la facture
          const totalPaidBeforeThisPayment = totalPaid - (invoice.payments.some((p) => p.id === paymentId) ? paymentAmount : 0);
          
          if (totalPaidBeforeThisPayment < invoice.total) {
            // Lier le paiement à cette facture
            try {
              await prisma.payment.update({
                where: { id: paymentId },
                data: {
                  invoiceId: invoice.id,
                },
              });

              console.log(`[Invoice Status Update] 🔗 Paiement ${paymentId} lié à la facture ${invoice.invoiceNumber}`, {
                paymentId,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                totalPaidBefore: totalPaidBeforeThisPayment,
                paymentAmount,
                invoiceTotal: invoice.total,
                timestamp: new Date().toISOString(),
              });

              // Recharger la facture avec le nouveau paiement
              const updatedInvoice = await prisma.invoice.findUnique({
                where: { id: invoice.id },
                include: {
                  payments: {
                    where: {
                      status: PaymentStatus.COMPLETED,
                    },
                  },
                },
              });

              if (updatedInvoice) {
                // Recalculer le total payé avec le nouveau paiement
                const newTotalPaid = updatedInvoice.payments.reduce((sum, payment) => sum + payment.amount, 0);

                // Mettre à jour le statut si nécessaire
                if (newTotalPaid >= invoice.total && invoice.status !== InvoiceStatus.PAID) {
                  await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                      status: InvoiceStatus.PAID,
                      paidAt: now,
                    },
                  });

                  console.log(`[Invoice Status Update] ✅ Facture ${invoice.invoiceNumber} marquée comme PAYÉE`, {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    previousStatus: invoice.status,
                    newStatus: InvoiceStatus.PAID,
                    totalPaid: newTotalPaid,
                    invoiceTotal: invoice.total,
                    timestamp: new Date().toISOString(),
                  });
                }
              }
            } catch (error) {
              console.error(`[Invoice Status Update] ❌ Erreur lors de la liaison du paiement ${paymentId} à la facture ${invoice.invoiceNumber}`, {
                paymentId,
                invoiceId: invoice.id,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }

      // Recalculer le montant total payé (au cas où le paiement vient d'être lié)
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
          },
        },
      });

      if (!updatedInvoice) {
        continue;
      }

      const currentTotalPaid = updatedInvoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const previousStatus = updatedInvoice.status;

      // Mettre à jour le statut selon les conditions
      let newStatus: InvoiceStatus | null = null;
      let updateData: { status: InvoiceStatus; paidAt?: Date } | null = null;

      // Vérifier si la facture est payée
      if (currentTotalPaid >= invoice.total && invoice.status !== InvoiceStatus.PAID) {
        newStatus = InvoiceStatus.PAID;
        updateData = {
          status: InvoiceStatus.PAID,
          paidAt: now,
        };
      }
      // Vérifier si la facture est en retard (date d'échéance dépassée et non payée)
      else if (
        invoice.dueDate < now &&
        currentTotalPaid < invoice.total &&
        invoice.status !== InvoiceStatus.OVERDUE &&
        invoice.status !== InvoiceStatus.PAID &&
        invoice.status !== InvoiceStatus.CANCELLED
      ) {
        newStatus = InvoiceStatus.OVERDUE;
        updateData = {
          status: InvoiceStatus.OVERDUE,
        };
      }
      // Si la facture était en SENT mais n'est plus en retard (paiement partiel), garder SENT
      else if (
        invoice.status === InvoiceStatus.OVERDUE &&
        currentTotalPaid < invoice.total &&
        invoice.dueDate >= now
      ) {
        // La date d'échéance a été prolongée ou la date d'échéance n'est plus dépassée
        // Remettre le statut à SENT
        newStatus = InvoiceStatus.SENT;
        updateData = {
          status: InvoiceStatus.SENT,
        };
      }

      // Mettre à jour si nécessaire
      if (updateData) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: updateData,
        });

        console.log(`[Invoice Status Update] ✅ Statut de la facture ${invoice.invoiceNumber} mis à jour`, {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          previousStatus,
          newStatus,
          totalPaid: currentTotalPaid,
          invoiceTotal: invoice.total,
          dueDate: invoice.dueDate.toISOString(),
          isOverdue: invoice.dueDate < now,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`[Invoice Status Update] ℹ️ Aucune mise à jour nécessaire pour la facture ${invoice.invoiceNumber}`, {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          currentStatus: invoice.status,
          totalPaid: currentTotalPaid,
          invoiceTotal: invoice.total,
          dueDate: invoice.dueDate.toISOString(),
          isOverdue: invoice.dueDate < now,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error(`[Invoice Status Update] ❌ Erreur lors de la mise à jour du statut des factures`, {
      bookingId,
      paymentId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    // Ne pas lancer l'erreur pour ne pas bloquer le webhook
  }
}

/**
 * Met à jour le statut OVERDUE pour toutes les factures dont la date d'échéance est dépassée
 * Cette fonction peut être appelée périodiquement (cron job) pour maintenir les statuts à jour
 */
export async function updateOverdueInvoices(): Promise<number> {
  try {
    const now = new Date();

    // Trouver toutes les factures non payées dont la date d'échéance est dépassée
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT],
        },
        dueDate: {
          lt: now,
        },
      },
      include: {
        payments: {
          where: {
            status: PaymentStatus.COMPLETED,
          },
        },
      },
    });

    let updatedCount = 0;

    for (const invoice of overdueInvoices) {
      // Vérifier si la facture est réellement impayée
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);

      if (totalPaid < invoice.total) {
        // La facture est impayée et la date d'échéance est dépassée
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: InvoiceStatus.OVERDUE,
          },
        });

        updatedCount++;

        console.log(`[Invoice Status Update] ⚠️ Facture ${invoice.invoiceNumber} marquée comme EN RETARD`, {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          dueDate: invoice.dueDate.toISOString(),
          totalPaid,
          invoiceTotal: invoice.total,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (updatedCount > 0) {
      console.log(`[Invoice Status Update] ✅ ${updatedCount} facture(s) marquée(s) comme EN RETARD`, {
        updatedCount,
        timestamp: new Date().toISOString(),
      });
    }

    return updatedCount;
  } catch (error) {
    console.error(`[Invoice Status Update] ❌ Erreur lors de la mise à jour des factures en retard`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return 0;
  }
}

