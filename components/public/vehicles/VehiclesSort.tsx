"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowUpDown } from "lucide-react";

export function VehiclesSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sortBy") || "price_asc";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "price_asc") {
      params.set("sortBy", value);
    } else {
      params.delete("sortBy");
    }
    params.delete("page");
    router.push(`/vehicles?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
      <Label htmlFor="sort" className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 whitespace-nowrap">
        <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Trier par:</span>
        <span className="sm:hidden">Tri:</span>
      </Label>
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger id="sort" className="w-full sm:w-[180px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price_asc">Prix croissant</SelectItem>
          <SelectItem value="price_desc">Prix décroissant</SelectItem>
          <SelectItem value="newest">Plus récents</SelectItem>
          <SelectItem value="oldest">Plus anciens</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

