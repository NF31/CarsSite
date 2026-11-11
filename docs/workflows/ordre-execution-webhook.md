# Ordre d'exécution des workflows du webhook Stripe

## Ordre corrigé (après la correction)

### 1. Récupération et calcul du prix
```
✅ Réservation trouvée dans la DB
✅ Calcul du prix (véhicule + services)
✅ Détection du type de paiement
```

### 2. Mise à jour de la réservation
```
✅ Statut mis à jour (CONFIRMED pour paiement complet/acompte)
✅ depositPaid mis à jour
✅ securityDepositPaid mis à jour
✅ remainingAmount mis à jour
```

### 3. Correction du statut (si nécessaire)
```
✅ Pour les modifications : Vérifier que le statut est CONFIRMED
✅ Si non, forcer la mise à jour à CONFIRMED
```

### 4. Création de la facture
```
✅ Si status === CONFIRMED (maintenant garanti après étape 3)
   → Créer la facture automatiquement
   → Numéro généré : INV-YYYY-NNN
   → Statut initial : DRAFT
```

### 5. Création de l'enregistrement de paiement
```
✅ Enregistrement créé dans la table Payment
✅ Montant enregistré
✅ Méthode : STRIPE
✅ Statut : COMPLETED (ou PENDING pour empreinte)
```

### 6. Mise à jour du statut des factures
```
✅ Si paiement COMPLETED (pas empreinte)
   → Lier le paiement à la facture
   → Mettre à jour le statut (PAID si total payé >= total facture)
```

### 7. Envoi de l'email avec PDFs
```
✅ Si status === CONFIRMED (maintenant garanti)
   → Générer PDF de réservation
   → Générer PDF de facture
   → Envoyer email avec pièces jointes
```

---

## Changements effectués

### Problème identifié :
1. La facture était créée AVANT la correction du statut pour les modifications
2. Si le statut n'était pas CONFIRMED, la facture n'était pas créée
3. Même après correction du statut, la facture n'était toujours pas créée car on avait déjà passé cette étape

### Solution :
1. Correction du statut AVANT la création de la facture
2. Suppression de la condition `!isModificationPayment` pour la création de facture
3. La facture est créée pour TOUTES les réservations confirmées (y compris modifications)
4. Ajout de logs pour indiquer quand la facture n'est pas créée et pourquoi

---

## Checklist de vérification

Après un paiement, vérifier dans les logs :

- [] ` Réservation mise à jour avec succès`
- [] ` Statut forcé à CONFIRMED` (si modification)
- [] ` Facture créée automatiquement` OU `⏭ Facture non créée (statut: ...)`
- [] ` Enregistrement de paiement créé`
- [] ` Statut des factures mis à jour`
- [] ` Email de confirmation envoyé avec succès`

Si un élément manque, vérifier les logs précédents pour comprendre pourquoi.

