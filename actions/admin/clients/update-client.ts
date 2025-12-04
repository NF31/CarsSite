"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/types/user-role";
import { updateClientSchema, type UpdateClientInput } from "@/lib/validations/client";

export interface UpdateClientResult {
  success: boolean;
  data?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    lockedUntil: string | null;
    deletedAt: string | null;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;
}

export async function updateClientAction(
  id: string,
  input: UpdateClientInput
): Promise<UpdateClientResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour modifier ce client.",
        status: 403,
      };
    }

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Identifiant de client invalide.",
        status: 400,
      };
    }

    const parsed = updateClientSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        status: 400,
      };
    }

    const data = parsed.data;

    const client = await prisma.user.findFirst({
      where: {
        id,
        role: UserRole.CLIENT,
      },
      select: {
        id: true,
        deletedAt: true,
        lockedUntil: true,
      },
    });

    if (!client) {
      return {
        success: false,
        error: "Client introuvable.",
        status: 404,
      };
    }

    const conflictingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: data.email,
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
      select: { id: true },
    });

    if (conflictingEmail) {
      return {
        success: false,
        error: "Cette adresse email est déjà utilisée par un autre compte.",
        fieldErrors: {
          email: ["Cette adresse email est déjà utilisée par un autre compte."],
        },
        status: 409,
      };
    }

    let lockedUntil: Date | null = null;
    let deletedAt: Date | null = client.deletedAt;

    if (data.status === "active") {
      lockedUntil = null;
      deletedAt = null;
    } else if (data.status === "inactive") {
      lockedUntil = null;
      deletedAt = client.deletedAt ?? new Date();
    } else if (data.status === "locked") {
      lockedUntil = data.lockedUntil!;
      deletedAt = null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        lockedUntil,
        deletedAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        lockedUntil: true,
        deletedAt: true,
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        lockedUntil: updated.lockedUntil ? updated.lockedUntil.toISOString() : null,
        deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
      },
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002" &&
      "meta" in error &&
      typeof error.meta === "object" &&
      error.meta !== null &&
      "target" in error.meta &&
      Array.isArray(error.meta.target)
    ) {
      if (error.meta?.target.includes("email")) {
        return {
          success: false,
          error: "Cette adresse email est déjà utilisée par un autre compte.",
          fieldErrors: {
            email: ["Cette adresse email est déjà utilisée par un autre compte."],
          },
          status: 409,
        };
      }
    }

    console.error("Error updating client:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour du client.",
      status: 500,
    };
  }
}



