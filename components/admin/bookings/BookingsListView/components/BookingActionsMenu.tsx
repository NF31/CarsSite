import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, XCircle, Archive, Trash2, MoreVertical } from "lucide-react";
import type { BookingListItem } from "../types";

interface BookingActionsMenuProps {
  booking: BookingListItem;
  canEdit: boolean;
  variant?: "mobile" | "desktop";
}

export function BookingActionsMenu({ booking, canEdit, variant = "mobile" }: BookingActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <MoreVertical className="h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/bookings/${booking.id}`} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            {variant === "desktop" ? "Voir détails" : "Voir"}
          </Link>
        </DropdownMenuItem>
        {canEdit ? (
          <DropdownMenuItem asChild>
            <Link href={`/admin/bookings/edit/${booking.id}`} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={(event) => event.preventDefault()}
            className="cursor-not-allowed text-muted-foreground"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier indisponible
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-amber-600"
          onSelect={(event) => event.preventDefault()}
          disabled
        >
          <XCircle className="mr-2 h-4 w-4" />
          Annuler (bientôt)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-slate-600"
          onSelect={(event) => event.preventDefault()}
          disabled
        >
          <Archive className="mr-2 h-4 w-4" />
          Archiver (bientôt)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600"
          onSelect={(event) => event.preventDefault()}
          disabled
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer (bientôt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

