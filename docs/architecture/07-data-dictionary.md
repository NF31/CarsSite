# Dictionnaire de Données - CarRental

## Vue d'Ensemble

Ce document liste tous les champs de données avec leurs descriptions, types, contraintes et règles de validation.

---

## User (Utilisateur)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440000"` |
| `email` | String | Adresse email | Requis, unique, format email | `"john@example.com"` |
| `name` | String | Nom complet | Requis, 2-100 caractères | `"John Doe"` |
| `phone` | String | Numéro de téléphone | Optionnel, format international | `"+33612345678"` |
| `role` | Enum | Rôle utilisateur | Requis, valeurs: CLIENT, ADMIN, EMPLOYEE | `"CLIENT"` |
| `password` | String | Mot de passe hashé | Requis, min 8 caractères, hashé bcrypt | `"$2a$10$..."` |
| `emailVerified` | Date | Date de vérification email | Optionnel | `2024-01-15T10:00:00Z` |
| `image` | String (URL) | Photo de profil | Optionnel, URL Cloudinary | `"https://res.cloudinary.com/..."` |
| `driverLicense` | String (URL) | Scan permis de conduire | Optionnel, URL Cloudinary | `"https://res.cloudinary.com/..."` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-01T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-15T10:00:00Z` |

---

## Vehicle (Véhicule)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440001"` |
| `brand` | String | Marque du véhicule | Requis, 1-50 caractères | `"Peugeot"` |
| `model` | String | Modèle du véhicule | Requis, 1-50 caractères | `"208"` |
| `year` | Number | Année de fabrication | Requis, 1900-année actuelle+1 | `2023` |
| `licensePlate` | String | Plaque d'immatriculation | Requis, unique, format pays | `"AB-123-CD"` |
| `mileage` | Number | Kilométrage | Requis, `>= 0` | `12000` |
| `category` | Enum | Catégorie véhicule | Requis, valeurs: ECONOMY, COMPACT, MID_SIZE, FULL_SIZE, SUV, LUXURY, VAN | `"COMPACT"` |
| `seats` | Number | Nombre de places | Requis, 2-9 | `5` |
| `transmission` | Enum | Type de transmission | Requis, valeurs: MANUAL, AUTOMATIC | `"AUTOMATIC"` |
| `fuelType` | Enum | Type de carburant | Requis, valeurs: PETROL, DIESEL, ELECTRIC, HYBRID | `"PETROL"` |
| `color` | String | Couleur du véhicule | Requis, 1-30 caractères | `"Blanc"` |
| `pricePerDay` | Number | Prix par jour | Requis, > 0, 2 décimales | `45.00` |
| `pricePerWeek` | Number | Prix par semaine | Optionnel, > 0, 2 décimales | `280.00` |
| `pricePerMonth` | Number | Prix par mois | Optionnel, > 0, 2 décimales | `1200.00` |
| `deposit` | Number | Dépôt de garantie | Requis, `>= 0`, 2 décimales | `500.00` |
| `status` | Enum | Statut du véhicule | Requis, valeurs: AVAILABLE, RESERVED, MAINTENANCE, UNAVAILABLE | `"AVAILABLE"` |
| `locationId` | String (UUID) | ID de l'agence | Requis, référence Location | `"550e8400-e29b-41d4-a716-446655440002"` |
| `features` | Array[String] | Équipements | Optionnel, tableau de strings | `["GPS", "Bluetooth", "Air Conditioning"]` |
| `images` | Array[String] | URLs des photos | Requis, min 5 images, URLs Cloudinary | `["https://res.cloudinary.com/..."]` |
| `description` | String | Description | Optionnel, max 1000 caractères | `"Véhicule confortable..."` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-01T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-15T10:00:00Z` |

---

## Booking (Réservation)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440003"` |
| `reference` | String | Référence unique | Requis, unique, format: BK-YYYY-NNN | `"BK-2024-001"` |
| `userId` | String (UUID) | ID du client | Requis, référence User | `"550e8400-e29b-41d4-a716-446655440000"` |
| `vehicleId` | String (UUID) | ID du véhicule | Requis, référence Vehicle | `"550e8400-e29b-41d4-a716-446655440001"` |
| `startDate` | Date | Date de début | Requis, `>= aujourd'hui` | `2024-01-15T10:00:00Z` |
| `endDate` | Date | Date de fin | Requis, > startDate | `2024-01-20T18:00:00Z` |
| `pickupLocationId` | String (UUID) | ID lieu de prise en charge | Requis, référence Location | `"550e8400-e29b-41d4-a716-446655440002"` |
| `returnLocationId` | String (UUID) | ID lieu de restitution | Requis, référence Location | `"550e8400-e29b-41d4-a716-446655440002"` |
| `totalPrice` | Number | Prix total | Requis, > 0, 2 décimales | `450.00` |
| `depositPaid` | Number | Acompte payé | Requis, `>= 0`, `<= totalPrice`, 2 décimales | `150.00` |
| `remainingAmount` | Number | Montant restant | Requis, `= totalPrice - depositPaid`, 2 décimales | `300.00` |
| `status` | Enum | Statut réservation | Requis, valeurs: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED | `"CONFIRMED"` |
| `services` | Array[String] | IDs des services | Optionnel, tableau de Service IDs | `["service-1", "service-2"]` |
| `notes` | String | Notes internes | Optionnel, max 1000 caractères | `"Client demande voiture propre"` |
| `cancellationReason` | String | Raison d'annulation | Optionnel, si `status = CANCELLED` | `"Changement de plans"` |
| `cancelledAt` | Date | Date d'annulation | Optionnel, si `status = CANCELLED` | `2024-01-14T10:00:00Z` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-10T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-15T10:00:00Z` |

---

## Service (Service Additionnel)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440004"` |
| `name` | String | Nom du service | Requis, 1-100 caractères | `"GPS"` |
| `description` | String | Description | Optionnel, max 500 caractères | `"GPS intégré avec trafic en temps réel"` |
| `price` | Number | Prix du service | Requis, > 0, 2 décimales | `10.00` |
| `pricingType` | Enum | Type de tarification | Requis, valeurs: PER_DAY, FIXED, PERCENTAGE | `"PER_DAY"` |
| `availableForCategories` | Array[Enum] | Catégories disponibles | Optionnel, tableau de VehicleCategory | `["COMPACT", "SUV"]` |
| `icon` | String | Icône | Optionnel, nom d'icône Heroicons | `"MapPinIcon"` |
| `active` | Boolean | Service actif | Requis, défaut: true | `true` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-01T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-15T10:00:00Z` |

---

## Review (Avis)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440005"` |
| `bookingId` | String (UUID) | ID de la réservation | Requis, référence Booking | `"550e8400-e29b-41d4-a716-446655440003"` |
| `userId` | String (UUID) | ID du client | Requis, référence User | `"550e8400-e29b-41d4-a716-446655440000"` |
| `vehicleId` | String (UUID) | ID du véhicule | Requis, référence Vehicle | `"550e8400-e29b-41d4-a716-446655440001"` |
| `rating` | Number | Note | Requis, 1-5, entier | `5` |
| `comment` | String | Commentaire | Optionnel, max 1000 caractères | `"Excellent véhicule, très propre"` |
| `status` | Enum | Statut modération | Requis, valeurs: PENDING, APPROVED, REJECTED | `"APPROVED"` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-21T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-22T10:00:00Z` |

---

## Maintenance (Maintenance)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440006"` |
| `vehicleId` | String (UUID) | ID du véhicule | Requis, référence Vehicle | `"550e8400-e29b-41d4-a716-446655440001"` |
| `type` | Enum | Type de maintenance | Requis, valeurs: SERVICE, REPAIR, INSPECTION | `"SERVICE"` |
| `status` | Enum | Statut | Requis, valeurs: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED | `"SCHEDULED"` |
| `startDate` | Date | Date de début | Requis | `2024-01-25T08:00:00Z` |
| `endDate` | Date | Date de fin | Requis, > startDate | `2024-01-26T18:00:00Z` |
| `description` | String | Description | Optionnel, max 500 caractères | `"Vidange et contrôle technique"` |
| `cost` | Number | Coût | Requis, `>= 0`, 2 décimales | `150.00` |
| `notes` | String | Notes | Optionnel, max 1000 caractères | `"Révision complète effectuée"` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-20T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-26T18:00:00Z` |

---

## Invoice (Facture)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440007"` |
| `invoiceNumber` | String | Numéro de facture | Requis, unique, format: INV-YYYY-NNN | `"INV-2024-001"` |
| `bookingId` | String (UUID) | ID de la réservation | Requis, référence Booking | `"550e8400-e29b-41d4-a716-446655440003"` |
| `userId` | String (UUID) | ID du client | Requis, référence User | `"550e8400-e29b-41d4-a716-446655440000"` |
| `subtotal` | Number | Sous-total | Requis, > 0, 2 décimales | `450.00` |
| `tax` | Number | Taxes | Requis, `>= 0`, 2 décimales | `90.00` |
| `total` | Number | Total | Requis, `= subtotal + tax`, 2 décimales | `540.00` |
| `status` | Enum | Statut | Requis, valeurs: DRAFT, SENT, PAID, OVERDUE, CANCELLED | `"PAID"` |
| `issuedAt` | Date | Date d'émission | Requis | `2024-01-15T10:00:00Z` |
| `dueDate` | Date | Date d'échéance | Requis, `>= issuedAt` | `2024-01-30T10:00:00Z` |
| `paidAt` | Date | Date de paiement | Optionnel, si `status = PAID` | `2024-01-16T10:00:00Z` |
| `pdfUrl` | String (URL) | URL du PDF | Optionnel, URL Cloudinary ou S3 | `"https://res.cloudinary.com/..."` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-15T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-16T10:00:00Z` |

---

## Payment (Paiement)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440008"` |
| `bookingId` | String (UUID) | ID de la réservation | Requis, référence Booking | `"550e8400-e29b-41d4-a716-446655440003"` |
| `invoiceId` | String (UUID) | ID de la facture | Optionnel, référence Invoice | `"550e8400-e29b-41d4-a716-446655440007"` |
| `amount` | Number | Montant | Requis, > 0, 2 décimales | `150.00` |
| `method` | Enum | Méthode de paiement | Requis, valeurs: STRIPE, PAYPAL, CASH, BANK_TRANSFER | `"STRIPE"` |
| `status` | Enum | Statut | Requis, valeurs: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED | `"COMPLETED"` |
| `transactionId` | String | ID transaction externe | Optionnel, ID Stripe/PayPal | `"pi_1234567890"` |
| `metadata` | Object | Métadonnées | Optionnel, JSON | `{"cardLast4": "4242"}` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-15T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-15T10:05:00Z` |

---

## Location (Agence)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440002"` |
| `name` | String | Nom de l'agence | Requis, 1-100 caractères | `"Paris Centre"` |
| `address` | String | Adresse | Requis, 1-200 caractères | `"123 Rue de la République"` |
| `city` | String | Ville | Requis, 1-100 caractères | `"Paris"` |
| `postalCode` | String | Code postal | Requis, format pays | `"75001"` |
| `country` | String | Pays | Requis, ISO code | `"FR"` |
| `phone` | String | Téléphone | Optionnel, format international | `"+33123456789"` |
| `email` | String | Email | Optionnel, format email | `"paris@carrental.com"` |
| `latitude` | Number | Latitude | Optionnel, -90 à 90 | `48.8566` |
| `longitude` | Number | Longitude | Optionnel, -180 à 180 | `2.3522` |
| `openingHours` | Object | Horaires d'ouverture | Requis, objet avec jours | Voir structure ci-dessous |
| `active` | Boolean | Agence active | Requis, défaut: true | `true` |
| `createdAt` | Date | Date de création | Requis, auto-généré | `2024-01-01T10:00:00Z` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-15T10:00:00Z` |

### Structure openingHours

```typescript
{
  monday: { open: "09:00", close: "18:00", closed?: false },
  tuesday: { open: "09:00", close: "18:00", closed?: false },
  // ... autres jours
  sunday: { open: "10:00", close: "16:00", closed?: false }
}
```

---

## Setting (Paramètre)

| Champ | Type | Description | Contraintes | Exemple |
|-------|------|-------------|-------------|---------|
| `id` | String (UUID) | Identifiant unique | Requis, unique | `"550e8400-e29b-41d4-a716-446655440009"` |
| `key` | String | Clé du paramètre | Requis, unique | `"cancellation_policy_days"` |
| `value` | String/Number/Boolean/Object | Valeur | Requis, type variable | `7` ou `"true"` ou `{"days": 7}` |
| `description` | String | Description | Optionnel, max 500 caractères | `"Nombre de jours pour annulation gratuite"` |
| `category` | Enum | Catégorie | Requis, valeurs: GENERAL, PAYMENT, EMAIL, BOOKING, OTHER | `"BOOKING"` |
| `updatedAt` | Date | Date de mise à jour | Requis, auto-généré | `2024-01-15T10:00:00Z` |

---

## Règles de Validation

### Dates
- `startDate` doit être `>= aujourd'hui`
- `endDate` doit être > `startDate`
- `dueDate` doit être `>= issuedAt`

### Prix
- Tous les prix doivent être > 0
- 2 décimales maximum
- Format: `XX.XX`

### Références
- Tous les IDs doivent exister dans leur collection respective
- Pas de suppression en cascade sans vérification

### Unicité
- `email` (User) : unique
- `licensePlate` (Vehicle) : unique
- `reference` (Booking) : unique
- `invoiceNumber` (Invoice) : unique

---

## Checklist Dictionnaire

- [ ] Tous les champs documentés
- [ ] Types et contraintes définis
- [ ] Exemples fournis
- [ ] Règles de validation documentées
- [ ] Relations entre collections
- [ ] Formats spéciaux (dates, prix, etc.)


