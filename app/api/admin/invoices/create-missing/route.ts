import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { createMissingInvoicesAction } from "@/actions/admin/invoices/create-missing-invoices";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const result = await createMissingInvoicesAction();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erreur lors de la création des factures" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      created: result.created,
      errors: result.errors,
      details: result.details,
    });
  } catch (error) {
    console.error("Error creating missing invoices:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création des factures" },
      { status: 500 }
    );
  }
}

