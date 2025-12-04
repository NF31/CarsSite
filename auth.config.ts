import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from '@/lib/prisma'
import bcrypt from "bcryptjs";
import type { UserRole } from "@/lib/types/user-role";

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Vérifier si l'email est vérifié
        // Ne pas révéler cette information pour éviter l'énumération d'emails
        // Retourner null comme pour des identifiants incorrects
        if (!user.emailVerified) {
          return null;
        }

        // Récupérer rememberMe depuis les credentials
        const rememberMe = (credentials as { rememberMe?: boolean | string })?.rememberMe === true || 
                          (credentials as { rememberMe?: boolean | string })?.rememberMe === "true";

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image || undefined,
          rememberMe,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
        // Gérer rememberMe depuis les credentials
        if ((user as { rememberMe?: boolean }).rememberMe) {
          token.rememberMe = true;
          // Pour rememberMe : session de 90 jours
          token.exp = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
        } else {
          // Par défaut : session de 30 jours
          token.exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

