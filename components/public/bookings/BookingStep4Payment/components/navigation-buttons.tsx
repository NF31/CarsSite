import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { PriceCalculation, BookingStep4PaymentProps } from "../types";

interface NavigationButtonsProps {
  bookingData: BookingStep4PaymentProps["bookingData"];
  priceCalculation: PriceCalculation | null;
  existingBookingId?: string;
  isCreatingBooking: boolean;
  isCalculatingPrice: boolean;
  onPrevious: () => void;
  onCreateBooking: () => void;
}

export function NavigationButtons({
  bookingData,
  priceCalculation,
  existingBookingId,
  isCreatingBooking,
  isCalculatingPrice,
  onPrevious,
  onCreateBooking,
}: NavigationButtonsProps) {
  const getButtonText = () => {
    if (isCreatingBooking) {
      return existingBookingId ? "Mise à jour en cours..." : "Création en cours...";
    }

    if (existingBookingId) {
      if (bookingData.paymentOption === "deposit") {
        return priceCalculation ? `Modifier et payer l'acompte ${priceCalculation.deposit.toFixed(2)}€` : "Modifier l'option de paiement";
      } else if (bookingData.paymentOption === "deposit_and_deposit") {
        return priceCalculation ? `Modifier et payer ${((priceCalculation.deposit || 0) + (priceCalculation.vehicleDeposit || 0)).toFixed(2)}€ maintenant` : "Modifier l'option de paiement";
      }
      return "Modifier l'option de paiement";
    }

    if (bookingData.paymentOption === "deposit") {
      return priceCalculation ? `Confirmer et payer l'acompte ${priceCalculation.deposit.toFixed(2)}€` : "Confirmer et payer l'acompte";
    } else if (bookingData.paymentOption === "deposit_and_deposit") {
      return priceCalculation ? `Confirmer et payer ${((priceCalculation.deposit || 0) + (priceCalculation.vehicleDeposit || 0)).toFixed(2)}€ maintenant` : "Confirmer et payer maintenant";
    }
    return "Confirmer la réservation";
  };

  const getButtonIcon = () => {
    if (isCreatingBooking) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (existingBookingId || bookingData.paymentOption === "deposit" || bookingData.paymentOption === "deposit_and_deposit") {
      return <CreditCard className="h-4 w-4" />;
    }
    return <CheckCircle2 className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-2 sm:pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          onPrevious();
        }}
        className="w-full sm:w-auto order-2 sm:order-1"
      >
        Précédent
      </Button>
      <Button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onCreateBooking();
        }}
        disabled={isCreatingBooking || isCalculatingPrice || !priceCalculation}
        className="flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base h-11 sm:h-12"
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
    </div>
  );
}

