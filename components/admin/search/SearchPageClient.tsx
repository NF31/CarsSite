"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { globalSearchAction, type SearchResult, type SearchFilters } from "@/actions/admin/search";
import {
  SearchHeader,
  SearchEmptyState,
  VehiclesResults,
  BookingsResults,
  ClientsResults,
} from "@/components/admin/search";
import { SearchFilters as SearchFiltersComponent } from "@/components/admin/search/SearchFilters";
import { Loader2 } from "lucide-react";

export function SearchPageClient({ initialResult }: { initialResult: SearchResult | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(query);
  const [results, setResults] = useState<SearchResult | null>(initialResult);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minPrice: undefined,
    maxPrice: undefined,
    bookingStatus: undefined,
    vehicleStatus: undefined,
  });

  const performSearch = useCallback(
    async (term: string, currentFilters: SearchFilters) => {
      if (!term || term.length < 2) {
        setResults({
          vehicles: [],
          bookings: [],
          clients: [],
        });
        return;
      }

      setIsLoading(true);
      try {
        const result = await globalSearchAction(term, currentFilters);
        if (result.success && result.data) {
          setResults(result.data);
        } else {
          setResults({
            vehicles: [],
            bookings: [],
            clients: [],
          });
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults({
          vehicles: [],
          bookings: [],
          clients: [],
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Recherche initiale
  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      performSearch(query, filters);
    }
  }, [query, performSearch, filters]);

  const handleFiltersChange = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters);
      if (searchTerm) {
        performSearch(searchTerm, newFilters);
      }
    },
    [searchTerm, performSearch]
  );

  const handleResetFilters = useCallback(() => {
    const resetFilters: SearchFilters = {
      minPrice: undefined,
      maxPrice: undefined,
      bookingStatus: undefined,
      vehicleStatus: undefined,
    };
    setFilters(resetFilters);
    if (searchTerm) {
      performSearch(searchTerm, resetFilters);
    }
  }, [searchTerm, performSearch]);

  const totalResults = results
    ? results.vehicles.length + results.bookings.length + results.clients.length
    : 0;

  return (
    <div className="space-y-6">
      <SearchHeader searchTerm={searchTerm} totalResults={totalResults} />

      {query && <SearchFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} onReset={handleResetFilters} />}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !query && <SearchEmptyState hasQuery={false} />}

      {!isLoading && query && totalResults === 0 && <SearchEmptyState hasQuery={true} query={query} />}

      {!isLoading && results && totalResults > 0 && (
        <div className="space-y-6">
          <VehiclesResults vehicles={results.vehicles} />
          <BookingsResults bookings={results.bookings} />
          <ClientsResults clients={results.clients} />
        </div>
      )}
    </div>
  );
}

