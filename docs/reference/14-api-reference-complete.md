# Référence API Complète - CarRental

## Vue d'Ensemble

Ce document fournit une référence complète de toutes les API Routes avec exemples de code, schémas de validation, réponses et codes d'erreur.

---

## Authentification

### POST /api/auth/register

**Description :** Création d'un nouveau compte utilisateur

**Headers :**
```
Content-Type: application/json
```

**Request Body :**
```typescript
{
  name: string;          // 2-100 caractères
  email: string;         // Format email valide, unique
  password: string;      // Min 8 caractères, 1 maj, 1 chiffre
  phone?: string;        // Format international optionnel
}
```

**Validation Zod :**
```typescript
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  phone: z.string().optional()
});
```

**Exemple Request :**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+33612345678"
}
```

**Response 201 (Success) :**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CLIENT",
    "emailVerified": null
  },
  "message": "Compte créé avec succès. Vérifiez votre email."
}
```

**Response 400 (Validation Error) :**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Email déjà utilisé",
    "password": "Le mot de passe doit contenir au moins 8 caractères"
  }
}
```

**Response 500 (Server Error) :**
```json
{
  "success": false,
  "error": "Erreur serveur",
  "message": "Une erreur est survenue lors de la création du compte"
}
```

**Code d'implémentation :**
```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        phone: validated.phone,
        role: 'CLIENT'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });

    // TODO: Envoyer email de vérification

    return NextResponse.json(
      { success: true, user, message: "Compte créé avec succès" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.flatten() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
```

---

### POST /api/auth/login

**Description :** Connexion utilisateur

**Request Body :**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response 200 (Success) :**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CLIENT"
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-01-16T10:00:00Z"
  }
}
```

**Response 401 (Unauthorized) :**
```json
{
  "success": false,
  "error": "Email ou mot de passe incorrect"
}
```

---

## Véhicules

### GET /api/vehicles

**Description :** Liste des véhicules disponibles avec filtres

**Query Parameters :**
```typescript
{
  startDate?: string;      // ISO date string
  endDate?: string;        // ISO date string
  category?: VehicleCategory;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  transmission?: 'MANUAL' | 'AUTOMATIC';
  fuelType?: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  locationId?: string;
  page?: number;           // Default: 1
  limit?: number;          // Default: 10, Max: 50
  sortBy?: 'price' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
}
```

**Exemple Request :**
```
GET /api/vehicles?startDate=2024-01-15&endDate=2024-01-20&category=COMPACT&minPrice=30&maxPrice=100&page=1&limit=12
```

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "507f1f77bcf86cd799439012",
        "brand": "Peugeot",
        "model": "208",
        "year": 2023,
        "category": "COMPACT",
        "seats": 5,
        "transmission": "AUTOMATIC",
        "fuelType": "PETROL",
        "pricePerDay": 45.00,
        "deposit": 500.00,
        "images": [
          "https://res.cloudinary.com/.../peugeot208-1.jpg",
          "https://res.cloudinary.com/.../peugeot208-2.jpg"
        ],
        "rating": 4.5,
        "reviewCount": 24,
        "location": {
          "id": "507f1f77bcf86cd799439013",
          "name": "Paris Centre",
          "address": "123 Rue de la République"
        }
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 12,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "applied": {
        "category": "COMPACT",
        "minPrice": 30,
        "maxPrice": 100
      },
      "available": {
        "categories": ["ECONOMY", "COMPACT", "SUV", "LUXURY"],
        "priceRange": { "min": 25, "max": 200 }
      }
    }
  }
}
```

**Code d'implémentation :**
```typescript
// app/api/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.enum(['ECONOMY', 'COMPACT', 'MID_SIZE', 'FULL_SIZE', 'SUV', 'LUXURY', 'VAN']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  seats: z.coerce.number().optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']).optional(),
  locationId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sortBy: z.enum(['price', 'popularity', 'rating']).default('price'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    const validated = querySchema.parse(params);

    const skip = (validated.page - 1) * validated.limit;
    const take = validated.limit;

    // Construire les filtres
    const where: any = {
      status: 'AVAILABLE'
    };

    if (validated.category) {
      where.category = validated.category;
    }

    if (validated.minPrice || validated.maxPrice) {
      where.pricePerDay = {};
      if (validated.minPrice) where.pricePerDay.gte = validated.minPrice;
      if (validated.maxPrice) where.pricePerDay.lte = validated.maxPrice;
    }

    if (validated.seats) {
      where.seats = validated.seats;
    }

    if (validated.transmission) {
      where.transmission = validated.transmission;
    }

    if (validated.fuelType) {
      where.fuelType = validated.fuelType;
    }

    if (validated.locationId) {
      where.locationId = validated.locationId;
    }

    // Vérifier disponibilité si dates fournies
    if (validated.startDate && validated.endDate) {
      const startDate = new Date(validated.startDate);
      const endDate = new Date(validated.endDate);

      // Exclure les véhicules avec réservations en conflit
      where.NOT = {
        bookings: {
          some: {
            AND: [
              { status: { notIn: ['CANCELLED'] } },
              {
                OR: [
                  {
                    AND: [
                      { startDate: { lte: endDate } },
                      { endDate: { gte: startDate } }
                    ]
                  }
                ]
              }
            ]
          }
        },
        maintenances: {
          some: {
            AND: [
              { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
              {
                OR: [
                  {
                    AND: [
                      { startDate: { lte: endDate } },
                      { endDate: { gte: startDate } }
                    ]
                  }
                ]
              }
            ]
          }
        }
      };
    }

    // Construire le tri
    const orderBy: any = {};
    if (validated.sortBy === 'price') {
      orderBy.pricePerDay = validated.sortOrder;
    } else if (validated.sortBy === 'popularity') {
      orderBy.bookings = { _count: validated.sortOrder };
    } else if (validated.sortBy === 'rating') {
      orderBy.reviews = { _avg: { rating: validated.sortOrder } };
    }

    // Requête principale
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              bookings: true,
              reviews: true
            }
          }
        }
      }),
      prisma.vehicle.count({ where })
    ]);

    // Calculer les notes moyennes
    const vehiclesWithRating = vehicles.map(vehicle => {
      const avgRating = vehicle.reviews.length > 0
        ? vehicle.reviews.reduce((sum, r) => sum + r.rating, 0) / vehicle.reviews.length
        : 0;

      return {
        ...vehicle,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: vehicle._count.reviews,
        reviews: undefined,
        _count: undefined
      };
    });

    const totalPages = Math.ceil(total / validated.limit);

    return NextResponse.json({
      success: true,
      data: {
        vehicles: vehiclesWithRating,
        pagination: {
          total,
          page: validated.page,
          limit: validated.limit,
          totalPages,
          hasNext: validated.page < totalPages,
          hasPrev: validated.page > 1
        },
        filters: {
          applied: validated,
          available: {
            // À calculer avec des requêtes séparées
            categories: ['ECONOMY', 'COMPACT', 'SUV', 'LUXURY'],
            priceRange: { min: 25, max: 200 }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des véhicules" },
      { status: 500 }
    );
  }
}
```

---

### GET /api/vehicles/[id]

**Description :** Détails complets d'un véhicule

**Exemple Request :**
```
GET /api/vehicles/507f1f77bcf86cd799439012
```

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "brand": "Peugeot",
    "model": "208",
    "year": 2023,
    "licensePlate": "AB-123-CD",
    "mileage": 12000,
    "category": "COMPACT",
    "seats": 5,
    "transmission": "AUTOMATIC",
    "fuelType": "PETROL",
    "color": "Blanc",
    "pricePerDay": 45.00,
    "pricePerWeek": 280.00,
    "pricePerMonth": 1200.00,
    "deposit": 500.00,
    "status": "AVAILABLE",
    "features": ["GPS", "Bluetooth", "Air Conditioning", "Camera de recul"],
    "images": [
      {
        "url": "https://res.cloudinary.com/.../peugeot208-1.jpg",
        "alt": "Peugeot 208 - Vue avant",
        "order": 1
      },
      {
        "url": "https://res.cloudinary.com/.../peugeot208-2.jpg",
        "alt": "Peugeot 208 - Vue latérale",
        "order": 2
      }
    ],
    "description": "Véhicule compact idéal pour la ville...",
    "location": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Paris Centre",
      "address": "123 Rue de la République",
      "city": "Paris",
      "postalCode": "75001",
      "phone": "+33123456789"
    },
    "rating": 4.5,
    "reviewCount": 24,
    "reviews": [
      {
        "id": "507f1f77bcf86cd799439014",
        "rating": 5,
        "comment": "Excellent véhicule, très propre et confortable",
        "user": {
          "name": "Marie D.",
          "image": null
        },
        "createdAt": "2024-01-10T10:00:00Z"
      }
    ],
    "availability": {
      "nextAvailable": "2024-01-15",
      "calendar": [
        {
          "date": "2024-01-15",
          "available": true
        },
        {
          "date": "2024-01-16",
          "available": false,
          "reason": "RESERVED"
        }
      ]
    }
  }
}
```

---

### POST /api/vehicles (Admin)

**Description :** Création d'un nouveau véhicule (Admin uniquement)

**Headers :**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData) :**
```
brand: "Peugeot"
model: "208"
year: 2023
licensePlate: "AB-123-CD"
mileage: 12000
category: "COMPACT"
seats: 5
transmission: "AUTOMATIC"
fuelType: "PETROL"
color: "Blanc"
pricePerDay: 45.00
deposit: 500.00
locationId: "507f1f77bcf86cd799439013"
features: ["GPS", "Bluetooth"]
description: "Véhicule compact..."
images: [File, File, File, ...] // Minimum 5 images
```

**Response 201 :**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "brand": "Peugeot",
    "model": "208",
    // ... autres champs
  },
  "message": "Véhicule créé avec succès"
}
```

---

## Réservations

### POST /api/bookings

**Description :** Création d'une nouvelle réservation

**Headers :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body :**
```json
{
  "vehicleId": "507f1f77bcf86cd799439012",
  "startDate": "2024-01-15T10:00:00Z",
  "endDate": "2024-01-20T18:00:00Z",
  "pickupLocationId": "507f1f77bcf86cd799439013",
  "returnLocationId": "507f1f77bcf86cd799439013",
  "serviceIds": ["507f1f77bcf86cd799439015", "507f1f77bcf86cd799439016"],
  "notes": "Besoin d'une voiture propre"
}
```

**Validation :**
- Dates valides (endDate > startDate)
- Véhicule disponible pour ces dates
- Utilisateur authentifié
- Lieux valides

**Response 201 :**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439017",
    "reference": "BK-2024-001",
    "vehicle": {
      "id": "507f1f77bcf86cd799439012",
      "brand": "Peugeot",
      "model": "208"
    },
    "startDate": "2024-01-15T10:00:00Z",
    "endDate": "2024-01-20T18:00:00Z",
    "totalPrice": 450.00,
    "depositPaid": 0,
    "remainingAmount": 450.00,
    "status": "PENDING",
    "services": [
      {
        "id": "507f1f77bcf86cd799439015",
        "name": "Assurance complète",
        "price": 50.00
      }
    ],
    "createdAt": "2024-01-10T10:00:00Z"
  },
  "paymentIntent": {
    "clientSecret": "pi_xxx_secret_xxx",
    "amount": 135.00 // 30% d'acompte
  }
}
```

---

## Paiements

### POST /api/payments/create-intent

**Description :** Création d'un Payment Intent Stripe

**Request Body :**
```json
{
  "bookingId": "507f1f77bcf86cd799439017",
  "amount": 135.00,
  "paymentMethod": "card"
}
```

**Response 200 :**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

---

## Upload

### POST /api/upload

**Description :** Upload d'images vers Cloudinary

**Headers :**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData) :**
```
file: File
folder: "vehicles" // ou "documents", "profiles"
vehicleId?: string // Optionnel pour associer à un véhicule
```

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/xxx/image/upload/v1234567890/vehicles/abc123.jpg",
    "publicId": "vehicles/abc123",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 245678,
    "secureUrl": "https://res.cloudinary.com/xxx/image/upload/v1234567890/vehicles/abc123.jpg"
  }
}
```

---

## Codes d'Erreur

### Codes HTTP

- **200** : Succès
- **201** : Créé avec succès
- **400** : Erreur de validation
- **401** : Non authentifié
- **403** : Non autorisé (rôle insuffisant)
- **404** : Ressource non trouvée
- **409** : Conflit (ex: email déjà utilisé)
- **422** : Entité non traitable (ex: véhicule non disponible)
- **500** : Erreur serveur

### Format d'Erreur Standard

```json
{
  "success": false,
  "error": "Type d'erreur",
  "message": "Message détaillé",
  "details": {
    "field": "Message de validation spécifique"
  },
  "code": "ERROR_CODE"
}
```

---

## Sécurité

### Authentification

Toutes les routes protégées nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

### Rate Limiting

- **Authentification** : 5 tentatives / 15 minutes
- **API Publiques** : 100 requêtes / minute
- **API Protégées** : 1000 requêtes / minute

---

## Notes d'Implémentation

### Validation

Toutes les requêtes doivent être validées avec Zod avant traitement.

### Gestion d'Erreurs

Toujours utiliser try/catch et retourner des réponses standardisées.

### Logging

Logger toutes les erreurs et actions importantes pour le debugging.

---

## Checklist API

- [ ] Toutes les routes documentées
- [ ] Schémas de validation définis
- [ ] Exemples de code fournis
- [ ] Codes d'erreur standardisés
- [ ] Sécurité implémentée
- [ ] Rate limiting configuré
- [ ] Tests d'intégration écrits


