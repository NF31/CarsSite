"use client";

import Link from "next/link";
import { 
  Car, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  ArrowRight
} from "lucide-react";
import { motion } from "@/components/ui/motion";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { href: "/", label: "Accueil" },
    { href: "/vehicles", label: "Véhicules" },
    { href: "/contact", label: "Contact" },
  ];

  const legalLinks = [
    { href: "/legal/terms", label: "CGU" },
    { href: "/legal/privacy", label: "Confidentialité" },
    { href: "/legal/mentions-legales", label: "Mentions légales" },
  ];

  const socialLinks = [
    { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
    { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
    { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
    { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
  ];

  return (
    <footer className="border-t bg-muted/30 w-full overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Main Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 py-8 sm:py-10 lg:py-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="space-y-4 sm:space-y-5"
          >
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="rounded-lg bg-primary/10 p-2 sm:p-2.5 group-hover:bg-primary/20 transition-colors">
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-foreground">CarRental</span>
            </Link>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
              Location de véhicules simple, rapide et sécurisée.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full bg-muted p-2.5 hover:bg-primary/10 hover:text-primary transition-all touch-target"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Navigation Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-6 sm:mt-0"
          >
            <h2 className="font-semibold text-sm sm:text-base mb-4 sm:mb-5 text-foreground uppercase tracking-wider">
              Navigation
            </h2>
            <ul className="space-y-3 sm:space-y-3.5">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group py-1 touch-target"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 sm:mt-0"
          >
            <h2 className="font-semibold text-sm sm:text-base mb-4 sm:mb-5 text-foreground uppercase tracking-wider">
              Légal
            </h2>
            <ul className="space-y-3 sm:space-y-3.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group py-1 touch-target"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 sm:mt-0"
          >
            <h2 className="font-semibold text-sm sm:text-base mb-4 sm:mb-5 text-foreground uppercase tracking-wider">
              Contact
            </h2>
            <ul className="space-y-3.5 sm:space-y-4">
              <li>
                <a
                  href="tel:+33123456789"
                  className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors flex items-center gap-3 group touch-target"
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary/60 group-hover:text-primary transition-colors flex-shrink-0" />
                  <span className="break-words">+33 1 23 45 67 89</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@carrental.fr"
                  className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors flex items-start gap-3 group touch-target"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary/60 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                  <span className="break-all leading-relaxed">contact@carrental.fr</span>
                </a>
              </li>
              <li>
                <div className="text-sm sm:text-base text-muted-foreground flex items-start gap-3">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary/60 flex-shrink-0 mt-1" />
                  <address className="not-italic leading-relaxed">
                    123 Avenue de la République<br />
                    75011 Paris, France
                  </address>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="border-t pt-6 sm:pt-8 pb-6 sm:pb-8 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground"
        >
          <p className="text-center sm:text-left order-2 sm:order-1 w-full sm:w-auto">
            &copy; {currentYear} CarRental. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-2 text-xs order-1 sm:order-2 w-full sm:w-auto">
            <span>Paiement sécurisé</span>
            <span className="hidden sm:inline text-muted-foreground/50">•</span>
            <span className="hidden sm:inline">Véhicules assurés</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
