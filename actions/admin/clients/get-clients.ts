"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { GetClientsFilters, GetClientsResult } from "./get-clients/types";
import { getClientStats } from "./get-clients/get-client-stats";
import { getReturningGroups } from "./get-clients/get-returning-groups";
import { buildWhereClause } from "./get-clients/build-where-clause";
import { buildOrderBy } from "./get-clients/build-order-by";
import { calculatePagination, buildPaginationResponse } from "./get-clients/calculate-pagination";
import { getClientsData } from "./get-clients/get-clients-data";
import { mapClients } from "./get-clients/map-clients";

// Ré-exporter les types pour compatibilité
export type {
  ClientStatus,
  ClientReservationsFilter,
  GetClientsFilters,
  ClientListItem,
  ClientStats,
  GetClientsResult,
} from "./get-clients/types";

export async function getClientsAction(filters: GetClientsFilters = {}): Promise<GetClientsResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour consulter les clients.",
        status: 403,
      };
    }

    const now = new Date();
    const { page, limit, skip } = calculatePagination(filters);

    // Récupérer les stats et les groupes de clients retournants en parallèle
    const [stats, returningGroups] = await Promise.all([
      getClientStats(now),
      getReturningGroups(),
    ]);

    // Construire la clause WHERE
    const { where, idsConstraint } = buildWhereClause({
      filters,
      now,
      returningGroups,
    });

    // Si aucun client ne correspond aux filtres de réservations, retourner vide
    if (idsConstraint !== null && idsConstraint.length === 0) {
      return {
        success: true,
        data: {
          clients: [],
          pagination: buildPaginationResponse(0, page, limit),
          stats,
        },
      };
    }

    // Construire l'ORDER BY
    const orderBy = buildOrderBy(filters);

    // Récupérer les clients et le total
    const { clients, total } = await getClientsData({
      where,
      orderBy,
      skip,
      limit,
    });

    // Mapper les clients vers le format de réponse
    const clientsMapped = mapClients(clients, now);

    return {
      success: true,
      data: {
        clients: clientsMapped,
        pagination: buildPaginationResponse(total, page, limit),
        stats,
      },
    };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération des clients.",
      status: 500,
    };
  }
}
