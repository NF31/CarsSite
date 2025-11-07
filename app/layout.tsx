import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { ConditionalHeaderFooter } from "@/components/layout/conditional-header-footer";
import { FullCalendarStyles } from "@/components/providers/fullcalendar-styles";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FullCalendarStyles />
        <AuthProvider>
          <ConditionalHeaderFooter>{children}</ConditionalHeaderFooter>
        </AuthProvider>
      </body>
    </html>
  );
}
