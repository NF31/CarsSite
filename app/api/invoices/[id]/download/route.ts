import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { downloadInvoiceAction } from "@/actions/admin/invoices";
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

    // Vérifier que la facture appartient à l'utilisateur
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        pdfUrl: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    if (invoice.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Obtenir l'URL du PDF (génère le PDF si nécessaire)
    const result = await downloadInvoiceAction(id);

    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || "Impossible de récupérer la facture" },
        { status: 500 }
      );
    }

    // Rediriger vers l'URL du PDF
    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error("Error downloading invoice:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement" },
      { status: 500 }
    );
  }
}

