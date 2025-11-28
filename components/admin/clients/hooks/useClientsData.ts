import { useEffect, useState } from "react";
import {
  getClientsAction,
  type ClientListItem,
  type ClientStats,
  type GetClientsFilters,
} from "@/actions/admin/clients";

interface UseClientsDataProps {
  initialData?: {
    clients: ClientListItem[];
    stats: ClientStats;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  filters: GetClientsFilters;
}

const DEFAULT_STATS: ClientStats = {
  totalClients: 0,
  activeClients: 0,
  inactiveClients: 0,
  lockedClients: 0,
  returningClients: 0,
  newClientsLast30Days: 0,
};

export function useClientsData({ initialData, filters }: UseClientsDataProps) {
  const [clients, setClients] = useState<ClientListItem[]>(initialData?.clients ?? []);
  const [stats, setStats] = useState<ClientStats>(initialData?.stats ?? DEFAULT_STATS);
  const [pagination, setPagination] = useState(
    initialData?.pagination ?? {
      total: 0,
      page: 1,
      limit: filters.limit ?? 12,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getClientsAction(filters);
        if (!isMounted) {
          return;
        }
        if (result.success && result.data) {
          setClients(result.data.clients);
          setStats(result.data.stats);
          setPagination(result.data.pagination);
          setErrorMessage(null);
        } else {
          setErrorMessage(result.error ?? "Impossible de charger les clients.");
        }
      } catch (error) {
        console.error("Error loading clients:", error);
        if (isMounted) {
          setErrorMessage("Une erreur est survenue lors du chargement des clients.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  return {
    clients,
    stats,
    pagination,
    isLoading,
    errorMessage,
  };
}

