import { memo } from "react";

interface SearchHeaderProps {
  searchTerm: string;
  totalResults: number;
}

export const SearchHeader = memo(function SearchHeader({
  searchTerm,
  totalResults,
}: SearchHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Recherche</h1>
      <p className="text-gray-600 mt-1">
        {searchTerm
          ? `${totalResults} résultat${totalResults > 1 ? "s" : ""} trouvé${totalResults > 1 ? "s" : ""} pour "${searchTerm}"`
          : "Recherchez des véhicules, réservations ou clients"}
      </p>
    </div>
  );
});

