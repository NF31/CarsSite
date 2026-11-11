# Processus de Suppression de Compte - Actions Complètes

## Vue d'Ensemble

Ce document détaille **TOUTES** les actions qui se produisent lorsqu'un utilisateur supprime son compte, étape par étape.

---

## ÉTAPE 1 : Demande de Suppression (Page Profil)

**Fichier :** `app/(client)/profile/page.tsx`

### Actions :
1. L'utilisateur remplit le formulaire :
   - Mot de passe actuel
   - Confirmation texte "SUPPRIMER"
2. Validation du formulaire (Zod)
3. Envoi de la requête `DELETE /api/profile/delete`

---

## ÉTAPE 2 : Vérification et Génération du Token (API)

**Fichier :** `app/api/profile/delete/route.ts`

### Actions :
1. **Vérification de l'authentification**
   - Vérifie que l'utilisateur est connecté (`session.user.id`)

2. **Validation des données**
   - Parse le body avec `deleteAccountSchema`
   - Vérifie : mot de passe + texte "SUPPRIMER"

3. **Récupération de l'utilisateur**
   ```typescript
   prisma.user.findUnique({
     where: { id: session.user.id },
     select: { id, password, email, name }
   })
   ```

4. **Vérification du mot de passe**
   - Compare le mot de passe fourni avec le hash stocké (bcrypt)
   - Si incorrect → erreur 400

5. **Génération du token de confirmation**
   - Crée un token cryptographiquement sécurisé (32 bytes)
   - Expiration : 24 heures
   - Stocké dans `verification_tokens` avec `identifier = userId`

6. **Envoi de l'email de confirmation**
   - Template : `lib/templates/account-deletion-email.tsx`
   - Contenu : avertissement + lien de confirmation
   - Lien : `/confirm-account-deletion?token={token}`
   - Si échec → supprime le token et retourne erreur 500

7. **Retour de succès**
   - Message : "Un email de confirmation a été envoyé..."
   - ** IMPORTANT : Le compte n'est PAS encore supprimé à ce stade**

---

## ÉTAPE 3 : Confirmation par Email (Page)

**Fichier :** `app/(public)/confirm-account-deletion/page.tsx`

### Actions :
1. L'utilisateur clique sur le lien dans l'email
2. Extraction du token depuis l'URL (`?token=xxx`)
3. Affichage de la page de confirmation avec :
   - Avertissement sur l'irréversibilité
   - Liste des données qui seront supprimées
   - Bouton "Confirmer la suppression"
4. Si l'utilisateur confirme → envoi de `POST /api/profile/delete/confirm`

---

## ÉTAPE 4 : Suppression Définitive (API de Confirmation)

**Fichier :** `app/api/profile/delete/confirm/route.ts`

### Actions détaillées :

#### 4.1. Vérification du Token
```typescript
verifyAccountDeletionToken(token)
```
- Vérifie que le token existe dans la DB
- Vérifie que le token n'a pas expiré (< 24h)
- Si invalide → erreur 400

#### 4.2. Récupération de l'Utilisateur
```typescript
prisma.user.findFirst({
  where: {
    id: userId,
    deletedAt: null  // Vérifie que pas déjà supprimé
  }
})
```
- Récupère l'ID et l'email depuis le token
- Vérifie que le compte existe et n'est pas déjà supprimé
- Si déjà supprimé → erreur 404

#### 4.3. Préparation de l'Anonymisation
```typescript
const deletedEmail = `deleted_${userId}@deleted.local`;
const originalEmailHash = crypto.createHash("sha256")
  .update(user.email.toLowerCase().trim())
  .digest("hex");
```
- Génère un email anonymisé unique
- Crée un hash SHA-256 de l'email original pour traçabilité

#### 4.4. Anonymisation des Avis (Reviews)
```typescript
prisma.review.updateMany({
  where: { userId },
  data: { comment: null }
})
```
- **SUPPRIME** : Commentaires personnels
- **GARDE** : Notes (1-5), dates, véhicule (pour statistiques)

#### 4.5. Anonymisation des Réservations (Bookings)
```typescript
prisma.booking.updateMany({
  where: { userId },
  data: {
    notes: null,
    cancellationReason: null
  }
})
```
- **SUPPRIME** : Notes personnelles, raisons d'annulation
- **GARDE** : Dates, prix, véhicule, statut (pour comptabilité)

#### 4.6. Suppression des Tokens de Vérification
```typescript
prisma.verificationToken.deleteMany({
  where: { identifier: userId }
})
```
- Supprime tous les tokens (email, reset password, etc.)
- Données de connexion supprimées

#### 4.7. Suppression des Tentatives de Rate Limiting
```typescript
prisma.rateLimitAttempt.deleteMany({
  where: {
    identifier: user.email,
    type: "email"
  }
})
```
- Supprime l'historique de rate limiting par email
- Données de connexion supprimées

#### 4.8. Anonymisation du Compte Utilisateur
```typescript
prisma.user.update({
  where: { id: userId },
  data: {
    email: deletedEmail,              // "deleted_xxx@deleted.local"
    name: "Utilisateur supprimé",     // Nom standardisé
    phone: null,                       // SUPPRIMÉ
    image: null,                       // SUPPRIMÉ
    driverLicense: null,              // SUPPRIMÉ
    password: "DELETED",               // Hash invalide
    emailVerified: null,              // SUPPRIMÉ
    lockedUntil: null,                 // SUPPRIMÉ
    failedLoginAttempts: 0            // Réinitialisé
  }
})
```

#### 4.9. Marquage Soft Delete + Hash Email
```sql
UPDATE users 
SET "deletedAt" = NOW(),
    "originalEmailHash" = {hash}
WHERE id = {userId}
```
- Marque la date de suppression (`deletedAt`)
- Stocke le hash de l'email original pour traçabilité

#### 4.10. Conservation des Données Comptables
**IMPORTANT : Ces données sont CONSERVÉES (obligations légales)**

- **Factures (Invoices)** : **GARDÉES** 10 ans
  - Contiennent : montants, dates, numéros de facture
  - Restent liées au `userId` (anonymisé)
  
- **Paiements (Payments)** : **GARDÉS** 10 ans
  - Contiennent : montants, méthodes, statuts, transaction IDs
  - Restent liés au `userId` (anonymisé)

- **Réservations (Bookings)** : **GARDÉES** (anonymisées)
  - Dates, prix, véhicule conservés
  - Notes personnelles supprimées

#### 4.11. Nettoyage du Token
```typescript
deleteAccountDeletionToken(token)
```
- Supprime le token de confirmation après utilisation

#### 4.12. Déconnexion de l'Utilisateur
```typescript
signOut({ redirect: false })
```
- Déconnecte la session NextAuth
- Supprime le cookie de session

#### 4.13. Retour de Succès
```typescript
return NextResponse.json({
  success: true,
  message: "Votre compte a été supprimé avec succès"
})
```

---

## RÉSUMÉ DES DONNÉES

### **SUPPRIMÉES/ANONYMISÉES :**
- Email → `deleted_xxx@deleted.local`
- Nom → "Utilisateur supprimé"
- Téléphone → `NULL`
- Photo de profil → `NULL`
- Permis de conduire → `NULL`
- Mot de passe → "DELETED" (invalide)
- Tokens de vérification → Supprimés
- Rate limiting → Supprimé
- Commentaires d'avis → Supprimés
- Notes personnelles de réservations → Supprimées

### **CONSERVÉES (Anonymisées) :**
- ID utilisateur → **GARDÉ** (référence unique)
- Hash email original → **GARDÉ** (traçabilité)
- Date de suppression → **GARDÉE** (`deletedAt`)
- Notes d'avis (1-5) → **GARDÉES** (statistiques)
- Réservations (dates, prix, véhicule) → **GARDÉES** (comptabilité)
- Factures → **GARDÉES** 10 ans (obligation légale)
- Paiements → **GARDÉS** 10 ans (obligation légale)

---

## SÉCURITÉ ET CONFORMITÉ

### **Protection :**
- Double confirmation (mot de passe + email)
- Token sécurisé avec expiration (24h)
- Vérification que le compte n'est pas déjà supprimé
- Impossible de se reconnecter après suppression

### **Conformité RGPD :**
- Données personnelles anonymisées
- Hash pour traçabilité (non directement lisible)
- Conservation des données légales (factures, paiements)
- Soft delete (pas de suppression physique)

### **Traçabilité :**
- Hash de l'email original permet de retrouver l'identité si nécessaire
- ID utilisateur reste constant (référence pour factures/paiements)
- Date de suppression enregistrée

---

## RÉSULTAT FINAL

Après toutes ces actions :
- Le compte est **anonymisé** et **marqué comme supprimé**
- L'utilisateur ne peut **plus se connecter**
- Les données personnelles sont **anonymisées**
- Les données comptables sont **conservées** (obligations légales)
- La traçabilité est **préservée** (hash email + ID)
- Conformité **RGPD** respectée

