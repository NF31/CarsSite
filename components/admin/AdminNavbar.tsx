"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, User, Settings, LogOut, LayoutDashboard, Shield, Search } from "lucide-react";
import { AdminSidebarMobile } from "./AdminSidebar";
import type { Session } from "next-auth";

interface AdminNavbarProps {
  session: Session;
}

export function AdminNavbar({ session }: AdminNavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Rediriger vers une page de recherche ou passer le paramètre
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  // TODO: Récupérer le nombre de notifications depuis l'API
  const notificationCount = 0; // À remplacer par un appel API

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 lg:ml-64">
        {/* Bouton menu mobile */}
        <div className="lg:hidden -ml-1">
          <AdminSidebarMobile />
        </div>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher véhicules, réservations, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full"
            />
          </div>
        </form>

        {/* Espace flexible pour mobile */}
        <div className="flex-1 md:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Bouton recherche mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Search className="h-4 w-4" />
                <span className="sr-only">Rechercher</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
              <DropdownMenuLabel>Recherche</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form onSubmit={handleSearch} className="p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 max-w-[calc(100vw-2rem)]">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu utilisateur */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || "Admin"}
                    />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {session.user.name ? getInitials(session.user.name) : "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 sm:w-64 max-w-[calc(100vw-2rem)]" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
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
                {/* Lien Avis clients désactivé pour le moment */}
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
          )}
        </div>
      </div>
    </header>
  );
}

