"use client";

import { signOut } from "next-auth/react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, LayoutDashboard, Shield } from "lucide-react";
import type { Session } from "next-auth";
import { getInitials } from "../utils/helpers";

type UserMenuProps = {
  session: Session;
};

export function UserMenu({ session }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
            <AvatarImage src={session.user.image || undefined} alt={session.user.name || "Admin"} />
            <AvatarFallback className="text-xs sm:text-sm">
              {session.user.name ? getInitials(session.user.name) : "A"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 sm:w-64 max-w-[calc(100vw-2rem)]" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard Client
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/dashboard" className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            Dashboard Admin
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

