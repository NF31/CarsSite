# 📋 Workflows du Webhook Stripe - Checklist

Quand un paiement Stripe est confirmé (`checkout.session.completed`), voici tous les workflows qui DOIVENT s'exécuter :

## ✅ 1. Récupération de la réservation
- [ ] Réservation trouvée dans la DB
- [ ] Vérification que `bookingId` et `userId` correspondent

**Logs à vérifier :**
```
[Stripe Webhook] ✅ Réservation trouvée
```

## ✅ 2. Calcul du prix
- [ ] Calcul du prix de la réservation (véhicule + services)
- [ ] Calcul de l'acompte (30%)
- [ ] Calcul de la caution

**Logs à vérifier :**
```
[Stripe Webhook] ✅ Calcul du prix réussi
```

## ✅ 3. Détection du type de paiement
- [ ] Détection si c'est un paiement complet, acompte seul, empreinte, ou modification

**Logs à vérifier :**
```
[Stripe Webhook] 🔍 Détection du type de paiement
```

## ✅ 4. Mise à jour de la réservation
- [ ] Mise à jour du statut (CONFIRMED pour paiement complet/acompte)
- [ ] Mise à jour de `depositPaid`
- [ ] Mise à jour de `securityDepositPaid`
- [ ] Mise à jour de `remainingAmount`

**Logs à vérifier :**
```
[Stripe Webhook] ✅ Réservation mise à jour avec succès
```

## ✅ 5. Création automatique de la facture
**Condition :** Seulement si `status === CONFIRMED && !isModificationPayment`

- [ ] Création de la facture dans la table `Invoice`
- [ ] Numéro de facture généré (INV-YYYY-NNN)
- [ ] Statut initial : DRAFT

**Logs à vérifier :**
```
[Stripe Webhook] 📋 Création automatique de facture pour la réservation
[Stripe Webhook] ✅ Facture créée automatiquement pour la réservation
```

**Si échoue :**
```
[Stripe Webhook] ⚠️  Impossible de créer la facture automatiquement
```

## ✅ 6. Création de l'enregistrement de paiement
- [ ] Création d'un enregistrement dans la table `Payment`
- [ ] Montant enregistré
- [ ] Méthode : STRIPE
- [ ] Statut : COMPLETED (ou PENDING pour empreinte)

**Logs à vérifier :**
```
[Stripe Webhook] ✅ Enregistrement de paiement créé dans la table Payment
```

## ✅ 7. Mise à jour du statut des factures
**Condition :** Seulement si `paymentStatus === COMPLETED && !isAuthorization`

- [ ] Mise à jour du statut des factures liées à la réservation
- [ ] Lien du paiement à la facture
- [ ] Passage à PAID si le total payé >= total facture

**Logs à vérifier :**
```
[Stripe Webhook] 📋 Mise à jour du statut des factures pour la réservation
[Stripe Webhook] ✅ Statut des factures mis à jour pour la réservation
```

## ✅ 8. Envoi de l'email de confirmation
**Condition :** Seulement si `status === CONFIRMED`

### 8.1 Génération du PDF de réservation
- [ ] Récupération des données complètes (services, agence, etc.)
- [ ] Génération du PDF de réservation
- [ ] Ajout en pièce jointe

**Logs à vérifier :**
```
[Stripe Webhook] 📄 Génération du PDF de réservation pour
[Stripe Webhook] ✅ PDF de réservation généré
```

### 8.2 Génération du PDF de facture
- [ ] Récupération de la facture créée
- [ ] Génération du PDF de facture
- [ ] Ajout en pièce jointe

**Logs à vérifier :**
```
[Stripe Webhook] 📄 Génération du PDF de facture pour
[Stripe Webhook] ✅ PDF de facture généré
```

**Si facture non trouvée :**
```
[Stripe Webhook] ⚠️  Aucune facture trouvée pour la réservation
```

### 8.3 Envoi de l'email
- [ ] Ajout de l'email à la queue (si Redis disponible)
- [ ] Ou envoi direct si pas de queue

**Logs à vérifier :**
```
[Stripe Webhook] 📧 Préparation de l'envoi de l'email de confirmation
[Stripe Webhook] ✅ Email de confirmation envoyé avec succès
```

**Si échoue :**
```
[Stripe Webhook] ❌ Échec de l'envoi de l'email de confirmation
```

**Si credentials non configurés :**
```
[Stripe Webhook] ⚠️  Email de confirmation ignoré (credentials non configurés)
```

**Si statut pas CONFIRMED :**
```
[Stripe Webhook] 📧 Email de confirmation non envoyé (statut: PENDING, attendu: CONFIRMED)
```

---

## 🔍 Comment diagnostiquer un problème

### Email non reçu ?

1. **Vérifier les logs du webhook :**
   - Chercher `[Stripe Webhook] ✅ Email de confirmation envoyé avec succès`
   - Si absent, chercher les messages d'erreur

2. **Vérifier le worker email :**
   ```bash
   npm run worker:email
   ```
   - Le worker doit être en cours d'exécution
   - Vérifier qu'il n'y a pas d'erreurs

3. **Vérifier la queue email :**
   ```bash
   npx tsx scripts/check-email-queue.ts
   ```
   - Vérifier s'il y a des emails en attente
   - Vérifier s'il y a des emails échoués

4. **Vérifier les credentials email :**
   - `GMAIL_USER` doit être configuré
   - `GMAIL_PASSWORD` doit être configuré
   - Vérifier dans `.env`

5. **Vérifier Redis :**
   - `REDIS_URL` doit être configuré
   - Redis doit être accessible

### Facture non créée ?

1. **Vérifier les logs :**
   ```
   [Stripe Webhook] ✅ Facture créée automatiquement
   ```

2. **Vérifier dans la DB :**
   ```sql
   SELECT * FROM invoices WHERE "bookingId" = '...';
   ```

3. **Vérifier que le statut est CONFIRMED :**
   - La facture n'est créée que si `status === CONFIRMED`
   - Elle n'est pas créée pour les paiements de modification

### Workflows non exécutés ?

Vérifier dans l'ordre chronologique des logs :
1. ✅ Réservation trouvée
2. ✅ Calcul du prix réussi
3. ✅ Réservation mise à jour
4. ✅ Facture créée (si applicable)
5. ✅ Enregistrement de paiement créé
6. ✅ Statut des factures mis à jour
7. ✅ Email envoyé

Si un workflow manque, vérifier pourquoi en regardant les logs précédents.

