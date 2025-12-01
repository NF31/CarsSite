import { InvoiceStatus } from "@prisma/client";

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus; // Gardé pour compatibilité, mais non affiché sur le PDF
  issuedAt: Date;
  dueDate: Date;
  booking: {
    reference: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    depositPaid?: number; // Acompte déjà payé
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
      pricePerDay: number;
    };
    pickupLocation: {
      name: string;
      city: string;
      address: string | null;
    };
    returnLocation: {
      name: string;
      city: string;
      address: string | null;
    };
    services?: Array<{
      name: string;
      price: number;
    }>;
  };
  user: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  agency?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

