import type { Prisma } from "@prisma/client";
import { SettingCategory } from "@prisma/client";
import type {
  AdminSettingsData,
  AdminEmailNotificationsSettings,
} from "@/types/admin-settings";

const DEFAULT_ADMIN_SETTINGS: AdminSettingsData = {
  agency: {
    name: "CarRental",
    logoUrl: "",
    address: "123 Avenue de la Liberté, 75000 Paris",
    phone: "+33 1 23 45 67 89",
    email: "contact@carrental.com",
    openingHours: "Lun - Sam : 08h00 - 19h00",
  },
  configuration: {
    currency: "EUR",
    language: "fr",
    timezone: "Europe/Paris",
    cancellationPolicy:
      "Annulation gratuite jusqu'à 48h avant le début de la location. Au-delà, facturation d'une journée.",
    taxRate: 20,
    deposit: 500,
    serviceFee: 0,
  },
  emails: {
    smtpFromName: "CarRental",
    smtpFromEmail: "no-reply@carrental.com",
    notifications: {
      bookingConfirmation: true,
      bookingReminder: true,
      paymentConfirmation: true,
      cancellationNotification: true,
    },
  },
};

export const AGENCY_SETTING_KEYS = [
  "agency.name",
  "agency.logoUrl",
  "agency.address",
  "agency.phone",
  "agency.email",
  "agency.openingHours",
] as const;

export const CONFIGURATION_SETTING_KEYS = [
  "config.currency",
  "config.language",
  "config.timezone",
  "config.cancellationPolicy",
  "config.taxRate",
  "config.deposit",
  "config.serviceFee",
] as const;

export const EMAIL_SETTING_KEYS = [
  "email.smtp.fromName",
  "email.smtp.fromEmail",
  "email.notifications",
] as const;

export const ALL_ADMIN_SETTING_KEYS = [
  ...AGENCY_SETTING_KEYS,
  ...CONFIGURATION_SETTING_KEYS,
  ...EMAIL_SETTING_KEYS,
] as const;

export type AdminSettingKey = (typeof ALL_ADMIN_SETTING_KEYS)[number];

export const ADMIN_SETTINGS_META: Record<
  AdminSettingKey,
  {
    category: SettingCategory;
    description?: string;
  }
> = {
  "agency.name": {
    category: SettingCategory.GENERAL,
    description: "Nom commercial principal de l'agence",
  },
  "agency.logoUrl": {
    category: SettingCategory.GENERAL,
    description: "URL du logo principal utilisé dans l'interface",
  },
  "agency.address": {
    category: SettingCategory.GENERAL,
    description: "Adresse postale principale de l'agence",
  },
  "agency.phone": {
    category: SettingCategory.GENERAL,
    description: "Numéro de téléphone du service client",
  },
  "agency.email": {
    category: SettingCategory.GENERAL,
    description: "Email de contact principal",
  },
  "agency.openingHours": {
    category: SettingCategory.GENERAL,
    description: "Horaires d'ouverture de l'agence",
  },
  "config.currency": {
    category: SettingCategory.PAYMENT,
    description: "Devise par défaut utilisée pour la facturation",
  },
  "config.language": {
    category: SettingCategory.GENERAL,
    description: "Langue principale de l'interface administration",
  },
  "config.timezone": {
    category: SettingCategory.GENERAL,
    description: "Fuseau horaire utilisé pour les réservations et rapports",
  },
  "config.cancellationPolicy": {
    category: SettingCategory.BOOKING,
    description: "Politique d'annulation présentée aux clients",
  },
  "config.taxRate": {
    category: SettingCategory.PAYMENT,
    description: "Taux de TVA appliqué aux réservations",
  },
  "config.deposit": {
    category: SettingCategory.PAYMENT,
    description: "Montant du dépôt de garantie standard",
  },
  "config.serviceFee": {
    category: SettingCategory.PAYMENT,
    description: "Frais de service applicables aux réservations",
  },
  "email.smtp.fromName": {
    category: SettingCategory.EMAIL,
    description: "Nom affiché comme expéditeur des emails",
  },
  "email.smtp.fromEmail": {
    category: SettingCategory.EMAIL,
    description: "Adresse email d'expédition des notifications",
  },
  "email.notifications": {
    category: SettingCategory.EMAIL,
    description: "Activation des notifications automatiques",
  },
};

export function createDefaultAdminSettings(): AdminSettingsData {
  return {
    agency: { ...DEFAULT_ADMIN_SETTINGS.agency },
    configuration: { ...DEFAULT_ADMIN_SETTINGS.configuration },
    emails: {
      ...DEFAULT_ADMIN_SETTINGS.emails,
      notifications: { ...DEFAULT_ADMIN_SETTINGS.emails.notifications },
    },
  };
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return false;
  }

  return true;
};

const sanitizeString = (value: unknown, fallback: string): string => {
  if (typeof value === "string") {
    return value;
  }

  return fallback;
};

const sanitizeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const sanitizeNotifications = (
  value: unknown,
  fallback: AdminEmailNotificationsSettings,
): AdminEmailNotificationsSettings => {
  if (isPlainObject(value)) {
    return {
      bookingConfirmation:
        typeof value.bookingConfirmation === "boolean"
          ? value.bookingConfirmation
          : fallback.bookingConfirmation,
      bookingReminder:
        typeof value.bookingReminder === "boolean"
          ? value.bookingReminder
          : fallback.bookingReminder,
      paymentConfirmation:
        typeof value.paymentConfirmation === "boolean"
          ? value.paymentConfirmation
          : fallback.paymentConfirmation,
      cancellationNotification:
        typeof value.cancellationNotification === "boolean"
          ? value.cancellationNotification
          : fallback.cancellationNotification,
    };
  }

  return { ...fallback };
};

export function buildAdminSettingsData(
  records: Array<{ key: string; value: Prisma.JsonValue }>,
): AdminSettingsData {
  const data = createDefaultAdminSettings();

  for (const record of records) {
    switch (record.key as AdminSettingKey) {
      case "agency.name":
        data.agency.name = sanitizeString(record.value, data.agency.name);
        break;
      case "agency.logoUrl":
        data.agency.logoUrl = sanitizeString(record.value, data.agency.logoUrl);
        break;
      case "agency.address":
        data.agency.address = sanitizeString(record.value, data.agency.address);
        break;
      case "agency.phone":
        data.agency.phone = sanitizeString(record.value, data.agency.phone);
        break;
      case "agency.email":
        data.agency.email = sanitizeString(record.value, data.agency.email);
        break;
      case "agency.openingHours":
        data.agency.openingHours = sanitizeString(
          record.value,
          data.agency.openingHours,
        );
        break;
      case "config.currency":
        data.configuration.currency = sanitizeString(
          record.value,
          data.configuration.currency,
        );
        break;
      case "config.language":
        data.configuration.language = sanitizeString(
          record.value,
          data.configuration.language,
        );
        break;
      case "config.timezone":
        data.configuration.timezone = sanitizeString(
          record.value,
          data.configuration.timezone,
        );
        break;
      case "config.cancellationPolicy":
        data.configuration.cancellationPolicy = sanitizeString(
          record.value,
          data.configuration.cancellationPolicy,
        );
        break;
      case "config.taxRate":
        data.configuration.taxRate = sanitizeNumber(
          record.value,
          data.configuration.taxRate,
        );
        break;
      case "config.deposit":
        data.configuration.deposit = sanitizeNumber(
          record.value,
          data.configuration.deposit,
        );
        break;
      case "config.serviceFee":
        data.configuration.serviceFee = sanitizeNumber(
          record.value,
          data.configuration.serviceFee,
        );
        break;
      case "email.smtp.fromName":
        data.emails.smtpFromName = sanitizeString(
          record.value,
          data.emails.smtpFromName,
        );
        break;
      case "email.smtp.fromEmail":
        data.emails.smtpFromEmail = sanitizeString(
          record.value,
          data.emails.smtpFromEmail,
        );
        break;
      case "email.notifications":
        data.emails.notifications = sanitizeNotifications(
          record.value,
          data.emails.notifications,
        );
        break;
      default:
        break;
    }
  }

  return data;
}

export const getSettingMeta = (key: AdminSettingKey) => {
  const meta = ADMIN_SETTINGS_META[key];

  if (meta) {
    return meta;
  }

  return {
    category: SettingCategory.OTHER,
    description: undefined,
  };
};


