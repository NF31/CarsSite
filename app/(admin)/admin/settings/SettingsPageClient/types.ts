/**
 * Types pour SettingsPageClient
 */

export type FieldErrors = Record<string, string[]>;

export interface MessageState {
  type: "success" | "error";
  text: string;
}

import type { AdminSettingsData } from "@/types/admin-settings";

export interface SettingsPageClientProps {
  initialData: AdminSettingsData;
}

export interface AgencyFormData {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
}

export interface ConfigurationFormData {
  currency: string;
  language: string;
  timezone: string;
  cancellationPolicy: string;
  taxRate: string;
  deposit: string;
  serviceFee: string;
}

export interface EmailFormData {
  smtpFromName: string;
  smtpFromEmail: string;
  notifications: {
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    paymentConfirmation: boolean;
    cancellationNotification: boolean;
  };
}

