export interface AdminAgencySettings {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
}

export interface AdminConfigurationSettings {
  currency: string;
  language: string;
  timezone: string;
  cancellationPolicy: string;
  taxRate: number;
  deposit: number;
  serviceFee: number;
}

export interface AdminEmailNotificationsSettings {
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  paymentConfirmation: boolean;
  cancellationNotification: boolean;
}

export interface AdminEmailSettings {
  smtpFromName: string;
  smtpFromEmail: string;
  notifications: AdminEmailNotificationsSettings;
}

export interface AdminSettingsData {
  agency: AdminAgencySettings;
  configuration: AdminConfigurationSettings;
  emails: AdminEmailSettings;
}


