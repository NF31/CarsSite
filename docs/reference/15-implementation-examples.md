# Exemples d'Implémentation - CarRental

## Vue d'Ensemble

Ce document fournit des exemples concrets et complets d'implémentation pour les fonctionnalités clés du projet.

---

## Authentification Complète

### Configuration NextAuth

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error('Email ou mot de passe incorrect');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Email ou mot de passe incorrect');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### Middleware de Protection

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    const isClientRoute = req.nextUrl.pathname.startsWith('/dashboard');

    // Vérifier les routes admin
    if (isAdminRoute && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Vérifier les routes client
    if (isClientRoute && token?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Routes publiques
        const publicRoutes = ['/', '/vehicles', '/about', '/contact'];
        const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

        if (isPublicRoute) return true;

        // Routes protégées nécessitent un token
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/booking/:path*'
  ]
};
```

---

## Recherche de Véhicules avec Disponibilité

### Hook Personnalisé

```typescript
// hooks/useVehicles.ts
import { useState, useEffect } from 'react';
import { Vehicle, VehicleSearchFilters } from '@/types';

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  search: (filters: VehicleSearchFilters) => void;
}

export function useVehicles(initialFilters?: VehicleSearchFilters): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<VehicleSearchFilters>(initialFilters || {});
  const [hasMore, setHasMore] = useState(true);

  const fetchVehicles = async (pageNum: number, searchFilters: VehicleSearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (searchFilters.startDate) {
        params.append('startDate', searchFilters.startDate.toISOString());
      }
      if (searchFilters.endDate) {
        params.append('endDate', searchFilters.endDate.toISOString());
      }
      if (searchFilters.category) {
        params.append('category', searchFilters.category);
      }
      if (searchFilters.minPrice) {
        params.append('minPrice', searchFilters.minPrice.toString());
      }
      if (searchFilters.maxPrice) {
        params.append('maxPrice', searchFilters.maxPrice.toString());
      }
      if (searchFilters.seats) {
        params.append('seats', searchFilters.seats.toString());
      }
      if (searchFilters.transmission) {
        params.append('transmission', searchFilters.transmission);
      }
      if (searchFilters.locationId) {
        params.append('locationId', searchFilters.locationId);
      }

      params.append('page', pageNum.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/vehicles?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération');
      }

      if (pageNum === 1) {
        setVehicles(data.data.vehicles);
      } else {
        setVehicles(prev => [...prev, ...data.data.vehicles]);
      }

      setTotal(data.data.pagination.total);
      setHasMore(data.data.pagination.hasNext);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(1, filters);
    setPage(1);
  }, [filters]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVehicles(nextPage, filters);
    }
  };

  const search = (newFilters: VehicleSearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return {
    vehicles,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    search
  };
}
```

### Composant de Recherche

```typescript
// components/vehicles/VehicleSearch.tsx
'use client';

import { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { VehicleSearchFilters } from '@/types';
import { VehicleCard } from './VehicleCard';
import { VehicleFilters } from './VehicleFilters';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function VehicleSearch() {
  const [filters, setFilters] = useState<VehicleSearchFilters>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 jours
  });

  const { vehicles, loading, error, total, hasMore, loadMore, search } = useVehicles(filters);

  const handleSearch = (newFilters: VehicleSearchFilters) => {
    setFilters(newFilters);
    search(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1">
          <VehicleFilters
            filters={filters}
            onFiltersChange={handleSearch}
          />
        </aside>

        {/* Results */}
        <main className="lg:col-span-3">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {total} véhicule{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading && vehicles.length === 0 ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Chargement...' : 'Charger plus'}
                </button>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## Processus de Réservation Multi-Étapes

### Gestion d'État avec Context

```typescript
// contexts/BookingContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Vehicle, Service, Booking } from '@/types';

interface BookingContextType {
  // Étape 1: Véhicule et dates
  selectedVehicle: Vehicle | null;
  startDate: Date | null;
  endDate: Date | null;
  pickupLocation: string | null;
  returnLocation: string | null;
  
  // Étape 2: Services
  selectedServices: Service[];
  
  // Étape 3: Informations
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    driverLicense?: File;
  } | null;
  
  // Calculs
  totalPrice: number;
  deposit: number;
  remainingAmount: number;
  
  // Actions
  setVehicle: (vehicle: Vehicle) => void;
  setDates: (start: Date, end: Date) => void;
  setLocations: (pickup: string, returnLoc: string) => void;
  toggleService: (service: Service) => void;
  setCustomerInfo: (info: any) => void;
  calculateTotal: () => void;
  createBooking: () => Promise<Booking>;
  reset: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickupLocation, setPickupLocation] = useState<string | null>(null);
  const [returnLocation, setReturnLocation] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!selectedVehicle || !startDate || !endDate) return 0;
    
    const days = calculateDays();
    const vehiclePrice = selectedVehicle.pricePerDay * days;
    
    const servicesPrice = selectedServices.reduce((sum, service) => {
      if (service.pricingType === 'PER_DAY') {
        return sum + (service.price * days);
      } else if (service.pricingType === 'FIXED') {
        return sum + service.price;
      }
      return sum;
    }, 0);
    
    return vehiclePrice + servicesPrice;
  };

  const totalPrice = calculateTotal();
  const deposit = totalPrice * 0.3; // 30% d'acompte
  const remainingAmount = totalPrice - deposit;

  const setVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const setDates = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const setLocations = (pickup: string, returnLoc: string) => {
    setPickupLocation(pickup);
    setReturnLocation(returnLoc);
  };

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  const createBooking = async (): Promise<Booking> => {
    if (!selectedVehicle || !startDate || !endDate || !customerInfo) {
      throw new Error('Informations manquantes');
    }

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vehicleId: selectedVehicle.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pickupLocationId: pickupLocation,
        returnLocationId: returnLocation,
        serviceIds: selectedServices.map(s => s.id),
        totalPrice: totalPrice
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la création de la réservation');
    }

    return data.data;
  };

  const reset = () => {
    setSelectedVehicle(null);
    setStartDate(null);
    setEndDate(null);
    setPickupLocation(null);
    setReturnLocation(null);
    setSelectedServices([]);
    setCustomerInfo(null);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedVehicle,
        startDate,
        endDate,
        pickupLocation,
        returnLocation,
        selectedServices,
        customerInfo,
        totalPrice,
        deposit,
        remainingAmount,
        setVehicle,
        setDates,
        setLocations,
        toggleService,
        setCustomerInfo,
        calculateTotal,
        createBooking,
        reset
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
```

### Composant Multi-Étapes

```typescript
// components/booking/BookingSteps.tsx
'use client';

import { useState } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { BookingStep1 } from './BookingStep1';
import { BookingStep2 } from './BookingStep2';
import { BookingStep3 } from './BookingStep3';
import { BookingStep4 } from './BookingStep4';

const STEPS = [
  { id: 1, title: 'Résumé', component: BookingStep1 },
  { id: 2, title: 'Services', component: BookingStep2 },
  { id: 3, title: 'Informations', component: BookingStep3 },
  { id: 4, title: 'Paiement', component: BookingStep4 }
];

export function BookingSteps() {
  const [currentStep, setCurrentStep] = useState(1);
  const CurrentComponent = STEPS[currentStep - 1].component;

  const canGoNext = () => {
    // Validation selon l'étape
    switch (currentStep) {
      case 1:
        return true; // Toujours possible
      case 2:
        return true; // Services optionnels
      case 3:
        // Vérifier les informations client
        return true; // À implémenter
      case 4:
        return false; // Dernière étape
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                <span className="mt-2 text-sm text-gray-600">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <CurrentComponent />

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-green-600 text-white rounded-lg"
            >
              Confirmer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Intégration Stripe

### Configuration Stripe

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-01-01.acacia',
  typescript: true,
});

export async function createPaymentIntent(
  amount: number,
  bookingId: string,
  metadata?: Record<string, string>
) {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convertir en centimes
    currency: 'eur',
    metadata: {
      bookingId,
      ...metadata
    },
    automatic_payment_methods: {
      enabled: true
    }
  });
}

export async function confirmPayment(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}
```

### Composant de Paiement

```typescript
// components/payment/StripePayment.tsx
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentProps {
  amount: number;
  bookingId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ amount, bookingId, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Créer le Payment Intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount,
          paymentMethod: 'card'
        })
      });

      const { clientSecret } = await response.json();

      // Confirmer le paiement
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            // À remplir avec les infos client
          }
        }
      });

      if (error) {
        onError(error.message || 'Erreur de paiement');
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Traitement...' : `Payer ${amount.toFixed(2)}€`}
      </button>
    </form>
  );
}

export function StripePayment(props: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
```

---

## Templates Email

### Configuration Email

```typescript
// lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  await transporter.sendMail({
    from: `"CarRental" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '')
  });
}

export async function sendBookingConfirmation(
  email: string,
  booking: Booking,
  vehicle: Vehicle
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Réservation Confirmée !</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre réservation a été confirmée avec succès.</p>
          
          <div class="booking-details">
            <h2>Détails de la réservation</h2>
            <p><strong>Référence :</strong> ${booking.reference}</p>
            <p><strong>Véhicule :</strong> ${vehicle.brand} ${vehicle.model}</p>
            <p><strong>Dates :</strong> ${new Date(booking.startDate).toLocaleDateString('fr-FR')} - ${new Date(booking.endDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Prix total :</strong> ${booking.totalPrice.toFixed(2)}€</p>
          </div>
          
          <p>Nous avons hâte de vous accueillir !</p>
        </div>
        <div class="footer">
          <p>CarRental - Location de voitures</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, 'Réservation confirmée', html);
}
```

---

## Checklist Implémentation

- [x] Authentification NextAuth complète
- [x] Middleware de protection
- [x] Hook de recherche véhicules
- [x] Context de réservation
- [x] Composant multi-étapes
- [x] Intégration Stripe
- [x] Templates email
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Gestion d'erreurs complète


