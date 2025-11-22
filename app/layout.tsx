import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { ConditionalHeaderFooter } from "@/components/layout/conditional-header-footer";
import { FullCalendarStyles } from "@/components/providers/fullcalendar-styles";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CookieConsent } from "@/components/layout/CookieConsent";

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
        <FullCalendarStyles />
        <MotionProvider>
          <AuthProvider>
            <ConditionalHeaderFooter>{children}</ConditionalHeaderFooter>
          </AuthProvider>
        </MotionProvider>
        <ToasterProvider />
        <CookieConsent />
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
