import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

/**
 * Crée ou trouve un utilisateur par email
 */
export async function findOrCreateUser(
  email: string,
  name: string,
  phone: string,
  driverLicenseUrl?: string
): Promise<UserInfo> {
  // Chercher un utilisateur existant
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      driverLicense: true,
    },
  });

  if (existingUser) {
    // Utilisateur existant : mettre à jour le permis si fourni
    if (driverLicenseUrl && driverLicenseUrl !== existingUser.driverLicense) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          driverLicense: driverLicenseUrl,
          name: name || existingUser.name,
          phone: phone || undefined,
        },
      });
    }
    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
    };
  }

  // Créer un nouvel utilisateur
  const rawPassword = crypto.randomBytes(16).toString("hex");
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: UserRole.CLIENT,
      emailVerified: null,
      driverLicense: driverLicenseUrl || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  // TODO: Envoyer un email d'invitation au client pour créer un mot de passe

  return newUser;
}

