"use client";

import { useState, useEffect, useRef } from "react";
import { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";
import { uploadPublicDriverLicenseAction } from "@/actions/public/bookings/upload-driver-license";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileCheck, AlertCircle, Loader2, X } from "lucide-react";
import Link from "next/link";

interface BookingStep3InformationProps {
  vehicle: GetPublicVehicleByIdResult["data"];
  bookingData: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    pickup: string;
    returnLocation: string;
    pickupPlaceId: string;
    returnPlaceId: string;
    selectedServiceIds: string[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    driverLicenseUrl?: string;
    acceptedTerms: boolean;
  };
  updateBookingData: (updates: Partial<BookingStep3InformationProps["bookingData"]>) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  isTermsAlreadyAccepted?: boolean; // Si l'utilisateur a déjà accepté les CGV
}

export function BookingStep3Information({
  vehicle,
  bookingData,
  updateBookingData,
  onNext,
  onPrevious,
  canGoNext,
  isTermsAlreadyAccepted = false,
}: BookingStep3InformationProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour uploadedFileName si driverLicenseUrl existe déjà (utilisateur connecté)
  useEffect(() => {
    if (bookingData.driverLicenseUrl && !uploadedFileName) {
      // Si le permis existe déjà mais qu'on n'a pas encore de nom de fichier, 
      // on peut afficher un message générique
      setUploadedFileName("Permis de conduire enregistré");
    }
  }, [bookingData.driverLicenseUrl, uploadedFileName]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Le document doit être un fichier PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Le document dépasse la taille maximale autorisée (10 MB).");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", `booking-${Date.now()}`);

      const result = await uploadPublicDriverLicenseAction(formData);

      if (result.success && result.data) {
        updateBookingData({
          driverLicenseUrl: result.data.url,
        });
        setUploadError(null);
      } else {
        setUploadError(result.error || "Erreur lors de l'upload du permis de conduire.");
        setUploadedFileName(null);
      }
    } catch (error) {
      console.error("Erreur lors de l'upload du permis", error);
      setUploadError("Erreur lors de l'upload du permis de conduire.");
      setUploadedFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    updateBookingData({
      driverLicenseUrl: undefined,
    });
    setUploadedFileName(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h4 className="font-semibold mb-4">Informations personnelles</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="customerName">Nom complet *</Label>
                <Input
                  id="customerName"
                  type="text"
                  value={bookingData.customerName}
                  onChange={(e) => updateBookingData({ customerName: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={bookingData.customerEmail}
                  onChange={(e) => updateBookingData({ customerEmail: e.target.value })}
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Téléphone *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={bookingData.customerPhone}
                  onChange={(e) => updateBookingData({ customerPhone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload du permis de conduire */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h4 className="font-semibold mb-4">Permis de conduire *</h4>
            {bookingData.driverLicenseUrl ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <FileCheck className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">
                    Permis de conduire téléchargé
                  </p>
                  {uploadedFileName && (
                    <p className="text-sm text-green-700">{uploadedFileName}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-green-700 hover:text-green-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Upload en cours...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="font-medium">Cliquez pour télécharger votre permis</p>
                      <p className="text-sm text-muted-foreground">
                        Format PDF uniquement (max. 10 MB)
                      </p>
                    </div>
                  )}
                </div>
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acceptation des CGV */}
      {isTermsAlreadyAccepted ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-5 h-5 rounded border-2 border-green-500 bg-green-50 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Vous avez déjà accepté les{" "}
                  <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    conditions générales de location
                  </Link>{" "}
                  et la{" "}
                  <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    politique de confidentialité
                  </Link>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="acceptedTerms"
                checked={bookingData.acceptedTerms}
                onCheckedChange={(checked) =>
                  updateBookingData({ acceptedTerms: checked === true })
                }
              />
              <Label
                htmlFor="acceptedTerms"
                className="text-sm cursor-pointer flex-1"
              >
                J&apos;accepte les{" "}
                <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  conditions générales de location
                </Link>{" "}
                et la{" "}
                <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
                . *
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boutons de navigation */}
      <div className="flex justify-between gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault();
            onPrevious();
          }}
        >
          Précédent
        </Button>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onNext();
          }}
          disabled={!canGoNext}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

