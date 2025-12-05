"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Car,
  Shield,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  MapPin,
  Clock,
  CreditCard,
  HeadphonesIcon,
  TrendingUp,
  Zap,
  ArrowRight,
  Building2,
  Target,
  Heart,
  Star,
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/components/ui/motion";

export function AboutPageClient() {
  const features = [
    {
      icon: Zap,
      title: "Réservation en 4 étapes",
      description: "Processus simple et rapide. De la recherche au paiement, tout est fluide et intuitif.",
    },
    {
      icon: CreditCard,
      title: "Prix transparents",
      description: "Pas de coûts cachés. Vous voyez le prix total dès le début avec détail de tous les frais.",
    },
    {
      icon: Shield,
      title: "Assurances détaillées",
      description: "Plusieurs niveaux d'assurance disponibles avec franchises claires et comparatives.",
    },
    {
      icon: MapPin,
      title: "Plusieurs agences",
      description: "Retirez votre véhicule à une agence et retournez-le à une autre selon vos besoins.",
    },
    {
      icon: Clock,
      title: "Disponibilité 24/7",
      description: "Service client réactif et assistance en ligne disponible à tout moment.",
    },
    {
      icon: CheckCircle2,
      title: "Flotte diverse",
      description: "Large choix de véhicules, du compact économique au SUV confortable.",
    },
  ];

  const values = [
    {
      icon: Target,
      title: "Excellence",
      description: "Nous visons l'excellence dans chaque détail pour vous offrir la meilleure expérience possible.",
    },
    {
      icon: Users,
      title: "Proximité",
      description: "Une équipe à votre écoute, disponible pour répondre à toutes vos questions et besoins.",
    },
    {
      icon: Heart,
      title: "Confiance",
      description: "La confiance de nos clients est notre priorité. Transparence et honnêteté à chaque étape.",
    },
    {
      icon: TrendingUp,
      title: "Innovation",
      description: "Nous adoptons les dernières technologies pour simplifier et améliorer vos réservations.",
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />
        
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto w-full"
          >
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Notre histoire</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 text-foreground px-2">
              Bienvenue chez CarRental
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 font-medium px-4 leading-relaxed">
              Votre spécialiste de la location de véhicules. Nous simplifions la location pour que vous puissiez voyager en toute tranquillité.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Story Section */}
      <section className="bg-muted/30 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto w-full"
          >
            <Card className="border-2 shadow-xl h-full w-full">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl mb-1 break-words">Notre mission</CardTitle>
                    <CardDescription className="text-sm sm:text-base break-words">
                      Simplifier la location de véhicules pour tous
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground space-y-4">
                  <p className="text-base sm:text-lg leading-relaxed">
                    Chez <strong className="text-foreground">CarRental</strong>, nous croyons que la location de véhicules devrait être simple, 
                    transparente et accessible à tous. Notre mission est de révolutionner le secteur en mettant la technologie 
                    au service de vos besoins, tout en conservant l&apos;humain au cœur de notre service.
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed">
                    Nous avons créé une plateforme moderne, sécurisée et intuitive qui vous permet de réserver votre véhicule 
                    en quelques clics seulement. Pas de complications, pas de coûts cachés, juste une expérience fluide du début à la fin.
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed">
                    Que vous ayez besoin d&apos;une voiture pour un week-end entre amis, une semaine de vacances en famille 
                    ou un mois de déplacement professionnel, notre équipe est là pour vous accompagner et vous garantir 
                    une expérience exceptionnelle.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 text-foreground">
            Nos valeurs
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Les principes qui guident notre quotidien et façonnent votre expérience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="w-full"
            >
              <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl h-full w-full text-center">
                <CardContent className="p-4 sm:p-6">
                  <div className="rounded-xl bg-primary/10 p-3 sm:p-4 w-fit mx-auto mb-3 sm:mb-4">
                    <value.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl mb-2 break-words">{value.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm break-words leading-relaxed">{value.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="bg-muted/30 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 text-foreground">
              Pourquoi choisir CarRental ?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Toutes les fonctionnalités dont vous avez besoin pour une location réussie
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="w-full"
              >
                <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl h-full w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-3 sm:p-4 shadow-sm flex-shrink-0">
                        <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl mb-1 break-words">{feature.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm break-words leading-relaxed">{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology & Innovation Section */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto w-full"
        >
          <Card className="border-2 shadow-xl w-full">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl mb-1 break-words">Technologie et innovation</CardTitle>
                  <CardDescription className="text-sm sm:text-base break-words">
                    Une plateforme moderne au service de la location de véhicules
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground space-y-4">
                <p className="text-base sm:text-lg leading-relaxed">
                  Chez <strong className="text-foreground">CarRental</strong>, nous utilisons les dernières technologies pour révolutionner 
                  l&apos;expérience de location de véhicules. Notre plateforme combine simplicité d&apos;utilisation et puissance 
                  technique pour offrir un service exceptionnel.
                </p>
                <ul className="list-none space-y-3 pl-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="flex-1"><strong className="text-foreground">Interface moderne</strong> : Une plateforme intuitive et responsive, accessible sur tous les appareils pour une réservation fluide.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="flex-1"><strong className="text-foreground">Processus automatisé</strong> : Calcul automatique des prix en temps réel, vérification de disponibilité instantanée et paiement sécurisé.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="flex-1"><strong className="text-foreground">Gestion intelligente</strong> : Système de réservation optimisé avec suivi en temps réel et notifications automatiques pour chaque étape.</span>
                  </li>
                </ul>
                <p className="text-base sm:text-lg leading-relaxed">
                  Nous continuons d&apos;évoluer et d&apos;améliorer notre plateforme pour rester à la pointe de l&apos;innovation 
                  dans le secteur de la location de véhicules, en adoptant les meilleures pratiques et technologies émergentes.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/30 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto w-full"
          >
            <Card className="border-2 shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 w-full">
              <CardContent className="p-6 sm:p-8 lg:p-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6 text-foreground">
                  Prêt à commencer ?
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                  Découvrez notre large sélection de véhicules et réservez en ligne en quelques clics. 
                  Simple, rapide et sécurisé.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild size="lg" className="w-full sm:w-auto group">
                    <Link href="/vehicles">
                      <Car className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      Découvrir nos véhicules
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    <Link href="/contact">
                      <HeadphonesIcon className="mr-2 h-5 w-5" />
                      Nous contacter
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
