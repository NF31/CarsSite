import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";
import { generateInvoicePDFAction } from "@/actions/admin/invoices/generate-pdf";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Vérifier que la facture existe et appartient à l'utilisateur
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        pdfUrl: true,
        invoiceNumber: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur peut accéder à cette facture
    if (invoice.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    if (!invoice.pdfUrl) {
      return NextResponse.json(
        { error: "PDF non disponible" },
        { status: 404 }
      );
    }

    // Extraire le public_id de l'URL Cloudinary
    const assetInfo = extractCloudinaryAssetInfo(invoice.pdfUrl);
    if (!assetInfo) {
      console.error("Failed to extract asset info from URL:", invoice.pdfUrl);
      return NextResponse.json(
        { error: "Impossible de déterminer l'emplacement du PDF" },
        { status: 500 }
      );
    }

    console.log("Extracted asset info:", {
      publicId: assetInfo.publicId,
      format: assetInfo.format,
      originalUrl: invoice.pdfUrl,
    });

    // Essayer d'abord d'utiliser l'URL originale stockée (si elle est encore valide)
    // Sinon, télécharger depuis Cloudinary en utilisant l'API
    try {
      // D'abord, essayer l'URL originale directement
      if (invoice.pdfUrl && !invoice.pdfUrl.includes("/private/")) {
        // Fichier public, utiliser directement
        return NextResponse.redirect(invoice.pdfUrl);
      }
      
      // Pour les fichiers privés, essayer plusieurs approches
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      let downloadUrl: string | null = null;
      const errorDetails: string[] = [];
      
      // Méthode 1: Essayer l'URL originale (si elle est encore valide)
      if (invoice.pdfUrl.includes("/private/")) {
        try {
          console.log("Attempting to use original URL:", invoice.pdfUrl);
          const originalResponse = await fetch(invoice.pdfUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
          });
          
          if (originalResponse.ok) {
            const pdfBuffer = await originalResponse.arrayBuffer();
            return new NextResponse(pdfBuffer, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="facture_${invoice.invoiceNumber}.pdf"`,
                "Cache-Control": "private, max-age=3600",
              },
            });
          } else {
            errorDetails.push(`Original URL failed: ${originalResponse.status}`);
          }
        } catch (originalError) {
          errorDetails.push(`Original URL error: ${originalError instanceof Error ? originalError.message : String(originalError)}`);
        }
      }
      
      // Méthode 2: Essayer avec le public_id sans le dossier
      const publicIdWithoutFolder = assetInfo.publicId.split("/").pop() || assetInfo.publicId;
      console.log("Trying public_id without folder:", publicIdWithoutFolder);
      
      try {
        downloadUrl = cloudinary.utils.private_download_url(
          publicIdWithoutFolder,
          assetInfo.format,
          {
            resource_type: "raw",
            type: "private",
            expires_at: expiresAt,
          }
        );
        
        const response = await fetch(downloadUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });
        
        if (response.ok) {
          const pdfBuffer = await response.arrayBuffer();
          return new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `inline; filename="facture_${invoice.invoiceNumber}.pdf"`,
              "Cache-Control": "private, max-age=3600",
            },
          });
        } else {
          errorDetails.push(`Public ID without folder failed: ${response.status}`);
        }
      } catch (error1) {
        errorDetails.push(`Public ID without folder error: ${error1 instanceof Error ? error1.message : String(error1)}`);
      }
      
      // Méthode 3: Essayer avec le public_id complet
      console.log("Trying full public_id:", assetInfo.publicId);
      try {
        downloadUrl = cloudinary.utils.private_download_url(
          assetInfo.publicId,
          assetInfo.format,
          {
            resource_type: "raw",
            type: "private",
            expires_at: expiresAt,
          }
        );
        
        const response = await fetch(downloadUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });
        
        if (response.ok) {
          const pdfBuffer = await response.arrayBuffer();
          return new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `inline; filename="facture_${invoice.invoiceNumber}.pdf"`,
              "Cache-Control": "private, max-age=3600",
            },
          });
        } else {
          const errorText = await response.text();
          errorDetails.push(`Full public_id failed: ${response.status} - ${errorText}`);
        }
      } catch (error2) {
        errorDetails.push(`Full public_id error: ${error2 instanceof Error ? error2.message : String(error2)}`);
      }
      
      // Si toutes les méthodes ont échoué, le fichier n'existe probablement pas
      // Essayer de régénérer le PDF automatiquement
      console.error("All download methods failed, attempting to regenerate PDF:", errorDetails);
      
      try {
        console.log("Regenerating PDF for invoice:", invoice.id);
        const generateResult = await generateInvoicePDFAction(invoice.id);
        
        if (generateResult.success && generateResult.data) {
          // Le PDF a été régénéré, utiliser directement le buffer PDF si disponible
          console.log("PDF regenerated successfully, serving new PDF");
          
          // Si on a le buffer PDF directement, l'utiliser (plus rapide et plus fiable)
          if (generateResult.data.pdfBuffer) {
            // Convertir le Buffer en Uint8Array pour NextResponse
            const pdfArray = new Uint8Array(generateResult.data.pdfBuffer);
            return new NextResponse(pdfArray, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="facture_${invoice.invoiceNumber}.pdf"`,
                "Cache-Control": "private, max-age=3600",
              },
            });
          }
          
          // Sinon, essayer de télécharger depuis l'URL signée
          if (generateResult.data.pdfUrl) {
            try {
              const response = await fetch(generateResult.data.pdfUrl, {
                headers: {
                  "User-Agent": "Mozilla/5.0",
                },
              });
              
              if (response.ok) {
                const pdfBuffer = await response.arrayBuffer();
                return new NextResponse(pdfBuffer, {
                  headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `inline; filename="facture_${invoice.invoiceNumber}.pdf"`,
                    "Cache-Control": "private, max-age=3600",
                  },
                });
              } else {
                console.error("Failed to download regenerated PDF:", response.status, response.statusText);
              }
            } catch (fetchError) {
              console.error("Error fetching regenerated PDF:", fetchError);
            }
          }
        }
        
        // Si la régénération a échoué ou si on ne peut pas servir le nouveau PDF
        console.error("PDF regeneration failed:", {
          invoiceId: id,
          error: generateResult.error,
          success: generateResult.success,
        });
        
        return NextResponse.json(
          { 
            error: "Le PDF n'a pas pu être récupéré et la régénération a échoué.",
            details: generateResult.error || "Erreur inconnue lors de la régénération du PDF",
            invoiceId: id,
            suggestion: "Vérifiez les logs du serveur pour plus de détails sur l'erreur de génération du PDF.",
          },
          { status: 500 }
        );
      } catch (regenerateError) {
        console.error("Error regenerating PDF:", regenerateError);
        return NextResponse.json(
          { 
            error: "Le PDF n'a pas pu être récupéré depuis Cloudinary. Tentative de régénération échouée.",
            suggestion: "Veuillez régénérer manuellement le PDF de la facture.",
            details: errorDetails,
            regenerateError: regenerateError instanceof Error ? regenerateError.message : String(regenerateError),
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Error downloading and serving PDF:", error);
      return NextResponse.json(
        { 
          error: "Erreur lors de la récupération du PDF",
          details: error instanceof Error ? error.message : String(error),
          publicId: assetInfo.publicId,
          format: assetInfo.format,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error serving invoice PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du PDF" },
      { status: 500 }
    );
  }
}

