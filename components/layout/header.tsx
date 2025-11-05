import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">CarRental</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/vehicles"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Véhicules
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            À propos
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild>
            <Link href="/register">S'inscrire</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

