import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { ConditionalHeaderFooter } from "@/components/layout/conditional-header-footer";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ClientMotionProvider } from "@/components/providers/client-motion-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarRental - Location de Voitures",
  description: "Réservez votre véhicule en ligne facilement",
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientMotionProvider>
          <AuthProvider>
            <ConditionalHeaderFooter>{children}</ConditionalHeaderFooter>
          </AuthProvider>
        </ClientMotionProvider>
        <ToasterProvider />
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
