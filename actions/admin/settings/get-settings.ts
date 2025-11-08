"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ALL_ADMIN_SETTING_KEYS,
  buildAdminSettingsData,
} from "./shared";
import type { AdminSettingsData } from "@/types/admin-settings";

export interface GetAdminSettingsResult {
  success: boolean;
  data?: AdminSettingsData;
  error?: string;
  status?: number;
}

export async function getAdminSettingsAction(): Promise<GetAdminSettingsResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Non autorisé",
        status: 401,
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé",
        status: 403,
      };
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [...ALL_ADMIN_SETTING_KEYS],
        },
      },
    });

    const data = buildAdminSettingsData(settings);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Admin settings - get error:", error);

    return {
      success: false,
      error: "Une erreur est survenue lors du chargement des paramètres.",
      status: 500,
    };
  }
}


