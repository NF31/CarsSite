"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Car, Calendar, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { globalSearchAction, type SearchResult } from "@/actions/admin/search";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DynamicSearchBarProps {
  className?: string;
  placeholder?: string;
}

export function DynamicSearchBar({
  className,
  placeholder = "Rechercher véhicules, réservations, clients...",
}: DynamicSearchBarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Recherche automatique lorsque le terme est debounced
  useEffect(() => {
    let cancelled = false;

    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      // Ouvrir le popover et lancer la recherche
      console.log("[DynamicSearchBar] Recherche pour:", debouncedQuery);
      setIsLoading(true);
      setOpen(true);

      try {
        const result = await globalSearchAction(debouncedQuery);
        console.log("[DynamicSearchBar] Résultat:", result);
        if (cancelled) return;
        if (result.success && result.data) {
          console.log("[DynamicSearchBar] Données reçues:", result.data);
          setResults(result.data);
        } else {
          console.log("[DynamicSearchBar] Erreur:", result.error);
          setResults(null);
        }
      } catch (error) {
        console.error("[DynamicSearchBar] Erreur catch:", error);
        if (cancelled) return;
        setResults(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const totalResults = useMemo(() => {
    if (!results) return 0;
    return results.vehicles.length + results.bookings.length + results.clients.length;
  }, [results]);

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      setSearchQuery("");
      setResults(null);
      router.push(url);
    },
    [router]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        setOpen(false);
        router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
        setResults(null);
      }
    },
    [searchQuery, router]
  );

  return (
    <div className={cn("flex-1 max-w-lg", className)}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <form onSubmit={handleSubmit}>
          <PopoverAnchor asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="search"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("[DynamicSearchBar] Changement de valeur:", value, "open:", open);
                  setSearchQuery(value);
                  // Ouvrir le popover dès qu'on tape quelque chose
                  if (value.length > 0) {
                    console.log("[DynamicSearchBar] Ouverture du popover");
                    setOpen(true);
                  } else {
                    setOpen(false);
                    setResults(null);
                  }
                }}
                onFocus={() => {
                  console.log("[DynamicSearchBar] Focus, searchQuery:", searchQuery);
                  if (searchQuery.length > 0) {
                    setOpen(true);
                  }
                }}
                className="pl-9 h-9 w-full"
              />
            </div>
          </PopoverAnchor>
        </form>
        <PopoverContent 
          className="w-[400px] p-0 z-[100]" 
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoading && debouncedQuery.length < 2 && searchQuery.length > 0 && (
                <CommandEmpty>
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Tapez au moins 2 caractères pour rechercher
                  </div>
                </CommandEmpty>
              )}

              {!isLoading && debouncedQuery.length >= 2 && totalResults === 0 && (
                <CommandEmpty>
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Aucun résultat pour &quot;{debouncedQuery}&quot;
                  </div>
                </CommandEmpty>
              )}

              {!isLoading && results && totalResults > 0 && (
                <>
                  {results.vehicles.length > 0 && (
                    <CommandGroup heading="Véhicules">
                      {results.vehicles.map((vehicle) => (
                        <CommandItem
                          key={vehicle.id}
                          value={vehicle.id}
                          onSelect={() => handleSelect(`/admin/vehicles/${vehicle.id}`)}
                          className="cursor-pointer"
                        >
                          <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {vehicle.brand} {vehicle.model} ({vehicle.year})
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {vehicle.licensePlate}
                              {vehicle.location && ` • ${vehicle.location.city}`}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.bookings.length > 0 && (
                    <CommandGroup heading="Réservations">
                      {results.bookings.map((booking) => (
                        <CommandItem
                          key={booking.id}
                          value={booking.id}
                          onSelect={() => handleSelect(`/admin/bookings/${booking.id}`)}
                          className="cursor-pointer"
                        >
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              #{booking.reference} - {booking.user.name || booking.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {booking.vehicle.brand} {booking.vehicle.model} •{" "}
                              {new Date(booking.startDate).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.clients.length > 0 && (
                    <CommandGroup heading="Clients">
                      {results.clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.id}
                          onSelect={() => handleSelect(`/admin/clients/${client.id}`)}
                          className="cursor-pointer"
                        >
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name || client.email}</span>
                            <span className="text-xs text-muted-foreground">
                              {client.email}
                              {client.phone && ` • ${client.phone}`}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {totalResults > 0 && (
                    <div className="border-t bg-muted/50">
                      <Link
                        href={`/admin/search?q=${encodeURIComponent(debouncedQuery)}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-accent transition-colors"
                        onClick={() => {
                          setOpen(false);
                          setSearchQuery("");
                          setResults(null);
                        }}
                      >
                        <span>Voir tous les résultats</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {totalResults}
                        </span>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
