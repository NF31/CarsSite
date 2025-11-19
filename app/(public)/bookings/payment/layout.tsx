import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement sécurisé - CarRental",
  description: "Finalisez votre réservation en toute sécurité",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

