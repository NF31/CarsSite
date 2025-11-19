import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement confirmé - CarRental",
  description: "Votre réservation a été confirmée avec succès",
};

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

