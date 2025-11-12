"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { m as motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Car,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Shield,
  Menu,
  X,
  Calendar,
} from "lucide-react";

interface HeaderProps {
  onReservationClick?: () => void;
}

export function Header({ onReservationClick }: HeaderProps = {}) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Vérifier si l'utilisateur est authentifié
  // On vérifie directement session?.user car le statut peut être en retard
  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigationItems = [
    { label: "Accueil", href: "/" },
    { label: "Véhicules", href: "/vehicles" },
    { label: "À propos", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CarRental</span>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-bold transition-all duration-300 relative group ${
                    isActive
                      ? "text-primary pl-4"
                      : "text-muted-foreground hover:text-primary pl-2 hover:pl-4"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
              );
            })}
          </nav>

          {/* Actions utilisateur */}
          <div className="hidden md:flex items-center space-x-6">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full p-0"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={session.user.image || undefined}
                          alt={session.user.name || "User"}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {session.user.name
                            ? getInitials(session.user.name)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name || "Utilisateur"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard Client
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center cursor-pointer"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Dashboard Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Connexion</Link>
                </Button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {onReservationClick ? (
                    <Button
                      onClick={onReservationClick}
                      className="bg-primary text-primary-foreground px-6 py-3 font-bold tracking-wider hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl rounded-full"
                    >
                      <Calendar className="mr-2 h-4 w-4 inline" />
                      RÉSERVER
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href="/register">S&apos;inscrire</Link>
                    </Button>
                  )}
                </motion.div>
              </>
            )}
          </div>

          {/* Menu mobile button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors duration-300"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <motion.div
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMenuOpen ? (
                <X className="w-8 h-8" />
              ) : (
                <Menu className="w-8 h-8" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Menu mobile avec animations avancées */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-md border-t border-border"
            role="navigation"
            aria-label="Menu de navigation mobile"
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.1,
                  },
                },
                closed: {
                  transition: {
                    staggerChildren: 0.05,
                    staggerDirection: -1,
                  },
                },
              }}
              className="px-4 py-6 space-y-4"
            >
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <motion.div
                    key={item.href}
                    variants={{
                      open: { x: 0, opacity: 1 },
                      closed: { x: -50, opacity: 0 },
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block font-bold text-lg transition-all duration-300 pl-2 hover:pl-4 ${
                        isActive
                          ? "text-primary pl-4"
                          : "text-foreground hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Actions utilisateur mobile */}
              {!isLoading && !isAuthenticated && (
                <motion.div
                  variants={{
                    open: { y: 0, opacity: 1, scale: 1 },
                    closed: { y: 20, opacity: 0, scale: 0.9 },
                  }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="pt-4"
                >
                  <Button variant="ghost" asChild className="w-full mb-2">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      Connexion
                    </Link>
                  </Button>
                  {onReservationClick ? (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onReservationClick?.();
                      }}
                      className="block bg-primary text-primary-foreground px-6 py-3 font-black tracking-wider text-center rounded-full w-full hover:bg-primary/90 transition-all duration-300"
                    >
                      <Calendar className="mr-2 h-4 w-4 inline" />
                      RÉSERVER MAINTENANT
                    </button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link
                        href="/register"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        S&apos;inscrire
                      </Link>
                    </Button>
                  )}
                </motion.div>
              )}

              {!isLoading && isAuthenticated && session ? (
                <motion.div
                  variants={{
                    open: { y: 0, opacity: 1, scale: 1 },
                    closed: { y: 20, opacity: 0, scale: 0.9 },
                  }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="pt-4 space-y-4 border-t border-border"
                >
                  {/* Avatar et infos utilisateur mobile */}
                  <div className="flex items-center space-x-3 pb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                        {session.user.name
                          ? getInitials(session.user.name)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-foreground leading-none">
                        {session.user.name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none mt-1">
                        {session.user.email}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-foreground hover:text-primary font-bold py-2 transition-all duration-300 pl-2 hover:pl-4"
                  >
                    Dashboard
                  </Link>
                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block text-foreground hover:text-primary font-bold py-2 transition-all duration-300 pl-2 hover:pl-4"
                    >
                      Dashboard Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-foreground hover:text-primary font-bold py-2 transition-all duration-300 pl-2 hover:pl-4"
                  >
                    Mon profil
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block text-destructive hover:text-destructive/90 font-bold py-2 w-full text-left transition-all duration-300 pl-2 hover:pl-4"
                  >
                    Se déconnecter
                  </button>
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

