# 🔄 WORKFLOW COMPLET D'UNE RÉSERVATION

## 📋 Vue d'ensemble

Voici le workflow complet depuis la création d'une réservation jusqu'à la réception de l'email avec les PDFs.

---

## 1️⃣ CRÉATION DE LA RÉSERVATION

### 📍 Où ça se passe ?
- **Page** : `/bookings/new`
- **Action** : `createPublicBookingAction()` dans `actions/public/bookings/create-booking.ts`

### ✅ Ce qui se passe :
1. L'utilisateur remplit le formulaire de réservation
2. Le système crée la réservation dans la base de données avec le statut `PENDING`
3. Un email de confirmation de création est envoyé (statut PENDING)
4. La réservation est visible dans les notifications admin

### 📧 Email envoyé :
- **Type** : Email de création de réservation (statut PENDING)
- **Contenu** : Détails de la réservation, pas encore confirmée
- **PDF** : ❌ Aucun PDF à ce stade

### 📊 Statut de la réservation :
```typescript
status: BookingStatus.PENDING
depositPaid: 0
securityDepositPaid: 0
remainingAmount: totalPrice
```

---

## 2️⃣ PAIEMENT (Acompte ou Paiement complet)

### 📍 Où ça se passe ?
- **Page** : `/bookings/payment`
- **Action** : `createCheckoutSessionAction()` crée une session Stripe

### ✅ Ce qui se passe :
1. L'utilisateur clique sur "Payer"
2. Une session Stripe Checkout est créée
3. L'utilisateur est redirigé vers Stripe pour payer
4. Après paiement, Stripe redirige vers `/bookings/payment/success`

### 📊 Métadonnées envoyées à Stripe :
```typescript
metadata: {
  bookingId: "...",
  userId: "...",
  paymentType: "deposit" | "full" | "authorization",
  isModificationPayment: "false"
}
```

---

## 3️⃣ PAGE DE SUCCÈS (Fallback si webhook lent)

### 📍 Où ça se passe ?
- **Page** : `/bookings/payment/success`
- **Fichier** : `app/(public)/bookings/payment/success/page.tsx`

### ✅ Ce qui se passe (SI le webhook n'a pas encore été traité) :

#### A. Vérification du webhook
```typescript
// Vérifie si un Payment existe pour cette session Stripe
const webhookProcessed = booking.payments.some(p => 
  p.metadata.stripeSessionId === session_id
);
```

#### B. Mise à jour de la réservation (si webhook pas traité)
```typescript
// Met à jour depositPaid et status
booking.status = BookingStatus.CONFIRMED  // Si paiement normal
booking.depositPaid = amountPaid
booking.remainingAmount = totalPrice - depositPaid
```

#### C. Création du paiement de secours (si webhook pas traité)
```typescript
// Crée un enregistrement Payment dans la DB
await prisma.payment.create({
  transactionId: session_id,
  amount: amountPaid,
  status: PaymentStatus.COMPLETED,
  ...
});
```

#### D. Workflows de secours (si webhook pas traité ET statut = CONFIRMED)
Si le webhook n'a pas encore été traité et que la réservation est confirmée :

1. **Création de la facture**
   ```typescript
   const invoiceResult = await createInvoiceForBooking(booking.id);
   // Statut initial: DRAFT
   ```

2. **Mise à jour du statut des factures**
   ```typescript
   await updateInvoiceStatusAfterPayment(booking.id, paymentId, amount);
   // Lie le paiement à la facture
   // Met à jour le statut (PAID si total payé >= total facture)
   ```

3. **Envoi de l'email avec PDFs** (en arrière-plan)
   ```typescript
   // Génère PDF de réservation
   const bookingPdf = await generateBookingPDF({...});
   
   // Génère PDF de facture
   const invoicePdf = await generateInvoicePDFAction(invoice.id);
   
   // Envoie l'email avec les 2 PDFs en pièces jointes
   await sendBookingConfirmationEmail({
     attachments: [bookingPdf, invoicePdf]
   });
   ```

---

## 4️⃣ WEBHOOK STRIPE (Workflow principal)

### 📍 Où ça se passe ?
- **Route API** : `/api/webhooks/stripe`
- **Fichier** : `app/api/webhooks/stripe/route.ts`

### ✅ Ce qui se passe (Événement `checkout.session.completed`) :

#### A. Vérification de la signature
```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

#### B. Récupération de la réservation
```typescript
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: { vehicle: true, ... }
});
```

#### C. Calcul du prix
```typescript
const priceResult = await calculateBookingPriceAction({
  vehicleId, startDate, endDate, serviceIds
});
// Calcule: vehiclePrice, servicesPrice, deposit (30%), securityDeposit, remainingAmount
```

#### D. Détection du type de paiement
```typescript
const paymentType = session.metadata?.paymentType; // "deposit" | "full" | "authorization"
const isModificationPayment = session.metadata?.isModificationPayment === "true";
```

#### E. Mise à jour de la réservation
```typescript
// Pour un paiement d'acompte (deposit)
await prisma.booking.update({
  status: BookingStatus.CONFIRMED,
  depositPaid: downPayment,
  remainingAmount: totalPrice - downPayment
});

// Pour un paiement complet (full)
await prisma.booking.update({
  status: BookingStatus.CONFIRMED,
  depositPaid: downPayment,
  securityDepositPaid: securityDeposit,
  remainingAmount: totalPrice - downPayment
});
```

#### F. Vérification/Correction du statut (pour modifications)
```typescript
// Si c'est une modification et le statut n'est pas CONFIRMED
if (isModificationPayment && booking.status !== BookingStatus.CONFIRMED) {
  await prisma.booking.update({
    status: BookingStatus.CONFIRMED
  });
}
```

#### G. Création automatique de la facture
```typescript
// Seulement si status === CONFIRMED
if (booking.status === BookingStatus.CONFIRMED) {
  const invoiceResult = await createInvoiceForBooking(booking.id);
  // Crée une facture avec statut DRAFT
  // Numéro: INV-YYYY-NNN
}
```

#### H. Création de l'enregistrement de paiement
```typescript
await prisma.payment.create({
  bookingId,
  userId,
  amount: amountPaid,
  method: "STRIPE",
  status: PaymentStatus.COMPLETED,
  transactionId: session.id, // Stripe session ID
  metadata: {
    stripeSessionId: session.id,
    paymentType: paymentType,
    downPayment: ...,
    securityDeposit: ...
  }
});
```

#### I. Mise à jour du statut des factures
```typescript
// Seulement si paymentStatus === COMPLETED
if (paymentStatus === PaymentStatus.COMPLETED && !isAuthorization) {
  await updateInvoiceStatusAfterPayment(
    bookingId,
    paymentId,
    paymentAmount
  );
  // Lie le paiement à la facture
  // Met à jour le statut (PAID si total payé >= total facture)
}
```

#### J. Envoi de l'email de confirmation avec PDFs
```typescript
// Seulement si status === CONFIRMED
if (booking.status === BookingStatus.CONFIRMED) {
  
  // 1. Génère PDF de réservation
  const bookingPdfBuffer = await generateBookingPDF({
    reference, status, dates, vehicle, locations, services, ...
  });
  
  // 2. Génère PDF de facture
  const invoice = await prisma.invoice.findFirst({ where: { bookingId } });
  const invoicePdfResult = await generateInvoicePDFAction(invoice.id);
  
  // 3. Envoie l'email avec les 2 PDFs
  await sendBookingConfirmationEmail({
    to: user.email,
    booking: {...},
    vehicle: {...},
    locations: {...},
    attachments: [
      { filename: "Reservation_XXX.pdf", content: bookingPdfBuffer },
      { filename: "Facture_XXX.pdf", content: invoicePdfResult.data.pdfBuffer }
    ]
  });
}
```

---

## 📊 ORDRE D'EXÉCUTION COMPLET

### Workflow normal (webhook fonctionne) :

```
1. Création réservation (PENDING)
   ↓
2. Paiement Stripe
   ↓
3. Webhook Stripe reçu
   ↓
4. Mise à jour réservation (CONFIRMED)
   ↓
5. Création facture (DRAFT)
   ↓
6. Création Payment dans DB
   ↓
7. Mise à jour statut facture (PAID si total payé)
   ↓
8. Génération PDF réservation
   ↓
9. Génération PDF facture
   ↓
10. Envoi email avec 2 PDFs en pièces jointes ✅
```

### Workflow de secours (webhook lent) :

```
1. Création réservation (PENDING)
   ↓
2. Paiement Stripe
   ↓
3. Page de succès chargée
   ↓
4. Vérification: webhook pas encore traité?
   ↓
5. Mise à jour réservation (CONFIRMED) [FALLBACK]
   ↓
6. Création Payment [FALLBACK]
   ↓
7. Création facture [FALLBACK]
   ↓
8. Mise à jour statut facture [FALLBACK]
   ↓
9. Génération PDFs [FALLBACK]
   ↓
10. Envoi email avec PDFs [FALLBACK] ✅
```

---

## ⚠️ IMPORTANT : Protection contre les doublons

### Vérification du webhook traité :
```typescript
// La page de succès vérifie toujours si le webhook a été traité
const webhookProcessed = booking.payments.some(p => 
  p.metadata.stripeSessionId === session_id
);

// Si le webhook a été traité, les workflows de secours ne s'exécutent PAS
if (!webhookProcessed && booking.status === CONFIRMED) {
  // Exécuter les workflows de secours
}
```

### Vérification des doublons de paiement :
```typescript
// Le webhook vérifie si un Payment existe déjà
const existingPayment = await prisma.payment.findFirst({
  where: { transactionId: session.id }
});

if (existingPayment) {
  // Ignore, ne crée pas de doublon
}
```

---

## 📧 EMAILS ENVOYÉS

### 1. Email de création (statut PENDING)
- **Quand** : Immédiatement après création
- **Contenu** : Détails de la réservation
- **PDF** : ❌ Aucun
- **Queue** : Oui (BullMQ/Redis)

### 2. Email de confirmation (statut CONFIRMED)
- **Quand** : Après paiement réussi (via webhook ou fallback)
- **Contenu** : Détails de la réservation confirmée
- **PDF** : ✅ 2 PDFs en pièces jointes (réservation + facture)
- **Queue** : Oui (BullMQ/Redis)

### 3. Email de mise à jour (modifications)
- **Quand** : Après paiement supplémentaire de modification
- **Contenu** : Détails de la modification
- **PDF** : ❌ Aucun (la facture est envoyée séparément)
- **Queue** : Oui (BullMQ/Redis)

---

## 🔍 LOGS À SUIVRE

### Création de réservation :
```
[Public Booking] Réservation créée
[Public Booking] ✅ Email de confirmation envoyé
```

### Webhook Stripe :
```
[Stripe Webhook] 🔔 Event checkout.session.completed reçu
[Stripe Webhook] ✅ Réservation trouvée
[Stripe Webhook] ✅ Calcul du prix réussi
[Stripe Webhook] ✅ Réservation mise à jour avec succès
[Stripe Webhook] 📋 Création automatique de facture
[Stripe Webhook] ✅ Facture créée automatiquement
[Stripe Webhook] ✅ Enregistrement de paiement créé
[Stripe Webhook] ✅ Statut des factures mis à jour
[Stripe Webhook] ✅ Email de confirmation envoyé avec succès
```

### Page de succès (fallback) :
```
[Payment Success] ⚠️ Webhook non traité, déclenchement de tous les workflows manquants
[Payment Success] ✅ Facture créée
[Payment Success] ✅ Statut des factures mis à jour
[Payment Success] ✅ Email de confirmation envoyé avec PDFs (workflow de secours)
```

---

## ✅ CHECKLIST POUR VÉRIFIER QUE TOUT FONCTIONNE

- [ ] Réservation créée avec statut PENDING
- [ ] Email de création envoyé (PENDING)
- [ ] Paiement effectué sur Stripe
- [ ] Webhook Stripe reçu (logs `[Stripe Webhook]`)
- [ ] Réservation mise à jour (CONFIRMED)
- [ ] Facture créée automatiquement
- [ ] Payment créé dans la DB
- [ ] Statut de la facture mis à jour
- [ ] PDF de réservation généré
- [ ] PDF de facture généré
- [ ] Email de confirmation envoyé avec 2 PDFs
- [ ] Email reçu dans la boîte mail du client

---

## 🚨 PROBLÈMES COURANTS

### Le webhook ne se lance pas ?
→ **Solution** : Lancer `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
→ Ajouter le webhook secret dans `.env` comme `STRIPE_WEBHOOK_SECRET`
→ Redémarrer le serveur Next.js

### L'email n'est pas reçu ?
→ Vérifier que le worker email est lancé : `npm run worker:email`
→ Vérifier les credentials Gmail dans `.env` (GMAIL_USER, GMAIL_PASSWORD)
→ Vérifier les logs du worker email

### La facture n'est pas créée ?
→ Vérifier que le statut est bien CONFIRMED
→ Vérifier les logs `[Stripe Webhook] 📋 Création automatique de facture`
→ Vérifier qu'il n'y a pas déjà une facture pour cette réservation

### Les PDFs ne sont pas générés ?
→ Vérifier que `pdf-lib` est installé (pas PDFKit)
→ Vérifier que Cloudinary est configuré
→ Vérifier les logs de génération de PDF
