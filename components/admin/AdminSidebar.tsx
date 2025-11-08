"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Calendar,
  Users,
  Gift,
  Wrench,
  ChartLine,
  Receipt,
  Star,
  Settings,
  Menu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    badge: null,
  },
  {
    title: "Véhicules",
    icon: Car,
    href: "/admin/vehicles",
    badge: null,
    submenu: [
      { title: "Tous les véhicules", href: "/admin/vehicles" },
      { title: "Ajouter un véhicule", href: "/admin/vehicles/add" },
      { title: "Disponibilités", href: "/admin/vehicles/availability" },
      { title: "Maintenance", href: "/admin/vehicles/maintenance" },
    ],
  },
  {
    title: "Réservations",
    icon: Calendar,
    href: "/admin/bookings",
    badge: null,
    submenu: [
      { title: "Toutes les réservations", href: "/admin/bookings" },
      { title: "Nouvelle réservation", href: "/admin/bookings/new" },
      { title: "Calendrier", href: "/admin/bookings/calendar" },
      { title: "En attente", href: "/admin/bookings?status=pending" },
    ],
  },
  {
    title: "Clients",
    icon: Users,
    href: "/admin/clients",
    badge: null,
  },
  {
    title: "Services",
    icon: Gift,
    href: "/admin/services",
    badge: null,
    submenu: [
      { title: "Catalogue", href: "/admin/services" },
      { title: "Ajouter un service", href: "/admin/services/add" },
    ],
  },
  {
    title: "Maintenance",
    icon: Wrench,
    href: "/admin/maintenance",
    badge: null,
  },
  {
    title: "Statistiques",
    icon: ChartLine,
    href: "/admin/statistics",
    badge: null,
  },
  {
    title: "Facturation",
    icon: Receipt,
    href: "/admin/invoices",
    badge: null,
  },
  {
    title: "Avis",
    icon: Star,
    href: "/admin/reviews",
    badge: null,
  },
  {
    title: "Paramètres",
    icon: Settings,
    href: "/admin/settings",
    badge: null,
    submenu: [
      { title: "Vue d'ensemble", href: "/admin/settings" },
      { title: "Informations agence", href: "/admin/settings/agency" },
      { title: "Configuration", href: "/admin/settings/config" },
      { title: "Emails", href: "/admin/settings/emails" },
      { title: "Utilisateurs", href: "/admin/settings/users" },
    ],
  },
];

interface AdminSidebarProps {
  onMobileClose?: () => void;
}

export function AdminSidebar({ onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Car className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-lg">CarRental</h2>
          <p className="text-xs text-muted-foreground">Administration</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuOpen = openSubmenu === item.title;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={(e) => {
                  if (hasSubmenu) {
                    e.preventDefault();
                    setOpenSubmenu(isSubmenuOpen ? null : item.title);
                  } else {
                    onMobileClose?.();
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
                {hasSubmenu && (
                  <span className={cn(
                    "transition-transform",
                    isSubmenuOpen ? "rotate-90" : ""
                  )}>
                    ›
                  </span>
                )}
              </Link>

              {/* Sous-menu */}
              {hasSubmenu && isSubmenuOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.submenu.map((subItem) => {
                    const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/");
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={onMobileClose}
                        className={cn(
                          "block px-3 py-2 rounded-lg text-sm transition-colors",
                          isSubActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {subItem.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:border-r lg:bg-background">
        <SidebarContent />
      </aside>
    </>
  );
}

export function AdminSidebarMobile() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Car className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-lg">CarRental</h2>
          <p className="text-xs text-muted-foreground">Administration</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuOpen = openSubmenu === item.title;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={(e) => {
                  if (hasSubmenu) {
                    e.preventDefault();
                    setOpenSubmenu(isSubmenuOpen ? null : item.title);
                  } else {
                    setOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
                {hasSubmenu && (
                  <span className={cn(
                    "transition-transform",
                    isSubmenuOpen ? "rotate-90" : ""
                  )}>
                    ›
                  </span>
                )}
              </Link>

              {/* Sous-menu */}
              {hasSubmenu && isSubmenuOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.submenu.map((subItem) => {
                    const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/");
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block px-3 py-2 rounded-lg text-sm transition-colors",
                          isSubActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {subItem.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 sm:w-80">
        <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}

