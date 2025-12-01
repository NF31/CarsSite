"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Edit, Trash2, XCircle } from "lucide-react";
import type { Vehicle } from "../types";

type VehicleActionsMenuProps = {
  vehicle: Vehicle;
  onDeleteClick: (vehicle: Vehicle) => void;
  size?: "sm" | "md" | "lg";
};

export function VehicleActionsMenu({ vehicle, onDeleteClick, size = "md" }: VehicleActionsMenuProps) {
  const sizeClasses = {
    sm: "h-6 w-6 lg:h-7 lg:w-7",
    md: "h-7 w-7 sm:h-8 sm:w-8",
    lg: "h-8 w-8",
  };

  const iconSizes = {
    sm: "h-3 w-3 lg:h-3.5 lg:w-3.5",
    md: "h-4 w-4",
    lg: "h-4 w-4",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`${sizeClasses[size]} flex-shrink-0`}>
          <MoreVertical className={iconSizes[size]} />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/vehicles/${vehicle.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Voir détails
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/vehicles/edit/${vehicle.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <XCircle className="mr-2 h-4 w-4" />
          Marquer indisponible
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600" onClick={() => onDeleteClick(vehicle)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

