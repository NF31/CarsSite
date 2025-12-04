"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { quickClientSchema, type QuickClientInput } from "@/lib/validations/client";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserRole } from "@/lib/types/user-role";
import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";

type CreateQuickClientResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: UserRole;
        totalBookings: number;
        hasDriverLicense: boolean;
        driverLicenseUrl: string | null;
        driverLicensePublicId: string | null;
        driverLicenseUploadCount: number;
        driverLicenseLastUploadedAt: string | null;
      };
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function createQuickClientAction(
  input: QuickClientInput
): Promise<CreateQuickClientResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour créer un client.",
      };
    }

    const parsed = quickClientSchema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
      return {
        success: false,
        error: "Données invalides",
        fieldErrors,
      };
    }

    const data = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Un client avec cet email existe déjà.",
        fieldErrors: {
          email: ["Cet email est déjà associé à un client."],
        },
      };
    }

    const rawPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        role: UserRole.CLIENT,
        password: hashedPassword,
        emailVerified: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        driverLicense: true,
      },
    });

    if (data.sendInvitation) {
      console.log(
        "📨 (TODO) Envoi de l'email d'invitation au client nouvellement créé:",
        created.email
      );
    }

    return {
      success: true,
      data: {
        ...created,
        totalBookings: 0,
        hasDriverLicense: Boolean(created.driverLicense),
        driverLicenseUrl: created.driverLicense ?? null,
        driverLicensePublicId: (() => {
          const info = extractCloudinaryAssetInfo(created.driverLicense ?? undefined);
          return info ? `${info.publicId}.${info.format}` : null;
        })(),
        driverLicenseUploadCount: 0,
        driverLicenseLastUploadedAt: null,
      },
    };
  } catch (error) {
    console.error("Create quick client error:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création du client.",
    };
  }
}



