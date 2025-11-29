import { BookingStatus } from "@prisma/client";

export interface BookingConfirmationEmailParams {
  to: string;
  name: string;
  greeting?: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    securityDepositPaid?: number;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
    period: string;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export interface BookingUpdateEmailParams {
  to: string;
  name: string;
  greeting?: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
    period: string;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  modificationInfo?: {
    originalTotalPrice?: number;
    originalDepositPaid?: number;
    originalRemainingAmount?: number;
    depositDifference?: number;
    refundAmount?: number;
    additionalPaymentAmount?: number;
    paymentUrl?: string;
    securityDepositPaid?: number;
    paymentConfirmed?: boolean;
  };
  rejectionReason?: string | null;
}

export interface BookingReminderEmailParams {
  to: string;
  name: string;
  greeting?: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    period: string;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
}

export interface BookingCancellationRejectedEmailParams {
  to: string;
  name: string;
  greeting?: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    period: string;
    reason?: string | null;
    rejectionReason?: string | null;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
}

export interface BookingCancellationEmailParams {
  to: string;
  name: string;
  greeting?: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    refundAmount: number;
    refundRate: number;
    refundLabel: string;
    retentionAmount: number;
    period: string;
    reason?: string | null;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  policy: string;
}

export interface BookingCancellationRequestEmailParams {
  to: string;
  name: string;
  greeting?: string;
  booking: {
    reference: string;
    period: string;
    reason?: string | null;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  pricing: {
    total: number;
    deposit: number;
    refund: number;
    retained: number;
  };
  policy: string;
}

export interface ContactEmailParams {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface InvoiceEmailParams {
  to: string;
  name: string;
  invoiceNumber: string;
  bookingReference: string;
  pdfBuffer?: Buffer;
}

