import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Politique de Confidentialité - CarRental",
  description: "Consultez notre politique de confidentialité et de protection des données personnelles (RGPD)",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Politique de Confidentialité</CardTitle>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Conforme au Règlement Général sur la Protection des Données (RGPD - UE 2016/679)
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              CarRental s&apos;engage à protéger la confidentialité et la sécurité de vos données personnelles.
              Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons
              vos informations personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Données collectées</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1. Données personnelles</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nous collectons les données suivantes lors de votre inscription et utilisation de nos services :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Identité :</strong> Nom, prénom, date de naissance</li>
              <li><strong>Coordonnées :</strong> Adresse email, numéro de téléphone, adresse postale</li>
              <li><strong>Documents :</strong> Permis de conduire, pièce d&apos;identité</li>
              <li><strong>Paiement :</strong> Informations de carte bancaire (via processeur de paiement sécurisé)</li>
              <li><strong>Usage :</strong> Historique des réservations, préférences</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2. Données techniques</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nous collectons automatiquement certaines données techniques lors de votre visite :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Adresse IP</li>
              <li>Type de navigateur et système d&apos;exploitation</li>
              <li>Pages visitées et durée de visite</li>
              <li>Cookies et technologies similaires</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Finalités du traitement</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Vos données personnelles sont traitées pour les finalités suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Gestion des réservations :</strong> Création et suivi de vos réservations</li>
              <li><strong>Communication :</strong> Envoi de confirmations, rappels et notifications</li>
              <li><strong>Paiement :</strong> Traitement des transactions et facturation</li>
              <li><strong>Amélioration des services :</strong> Analyse de l&apos;utilisation pour améliorer notre plateforme</li>
              <li><strong>Obligations légales :</strong> Respect des obligations légales et réglementaires</li>
              <li><strong>Marketing :</strong> Envoi d&apos;offres promotionnelles (avec votre consentement)</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Base légale du traitement</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Conformément au RGPD, le traitement de vos données repose sur :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Consentement :</strong> Pour les communications marketing et l&apos;utilisation de cookies non essentiels</li>
              <li><strong>Exécution d&apos;un contrat :</strong> Pour la gestion de vos réservations et paiements</li>
              <li><strong>Obligation légale :</strong> Pour la conservation de documents comptables et fiscaux</li>
              <li><strong>Intérêt légitime :</strong> Pour l&apos;amélioration de nos services et la sécurité de la plateforme</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Partage des données</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Vos données personnelles peuvent être partagées avec :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Prestataires de services :</strong> Processeurs de paiement (Stripe, PayPal), hébergeurs, services d&apos;email</li>
              <li><strong>Autorités légales :</strong> En cas d&apos;obligation légale ou de demande judiciaire</li>
              <li><strong>Partenaires de confiance :</strong> Uniquement avec votre consentement explicite</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Nous ne vendons jamais vos données personnelles à des tiers à des fins commerciales.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Durée de conservation</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nous conservons vos données personnelles :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Données de compte :</strong> Pendant la durée de votre compte et 3 ans après sa fermeture</li>
              <li><strong>Données de réservation :</strong> 10 ans pour les obligations comptables et fiscales</li>
              <li><strong>Données de paiement :</strong> Conformément aux obligations légales (généralement 5 ans)</li>
              <li><strong>Cookies :</strong> Maximum 13 mois</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Vos droits (RGPD)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Droit d&apos;accès :</strong> Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> Corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit à l&apos;effacement :</strong> Demander la suppression de vos données (sous certaines conditions)</li>
              <li><strong>Droit à la portabilité :</strong> Récupérer vos données dans un format structuré</li>
              <li><strong>Droit d&apos;opposition :</strong> Vous opposer au traitement de vos données pour certains motifs</li>
              <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement :</strong> À tout moment pour les traitements basés sur le consentement</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Pour exercer ces droits, contactez-nous à :{" "}
              <a href="mailto:privacy@carrental.fr" className="text-primary hover:underline">
                privacy@carrental.fr
              </a>
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Sécurité des données</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Chiffrement des données sensibles (SSL/TLS)</li>
              <li>Authentification sécurisée et gestion des accès</li>
              <li>Sauvegardes régulières</li>
              <li>Formation du personnel à la protection des données</li>
              <li>Audits de sécurité réguliers</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nous utilisons des cookies pour améliorer votre expérience sur notre site :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site (pas de consentement requis)</li>
              <li><strong>Cookies analytiques :</strong> Pour analyser l&apos;utilisation du site (avec votre consentement)</li>
              <li><strong>Cookies marketing :</strong> Pour personnaliser les publicités (avec votre consentement)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Transferts internationaux</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données peuvent être transférées vers des pays situés en dehors de l&apos;Union Européenne.
              Dans ce cas, nous nous assurons que des garanties appropriées sont en place conformément au RGPD
              (clauses contractuelles types, Privacy Shield, etc.).
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Réclamations</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Nous contacter à :{" "}
                <a href="mailto:privacy@carrental.fr" className="text-primary hover:underline">
                  privacy@carrental.fr
                </a>
              </li>
              <li>Introduire une réclamation auprès de la CNIL (Commission Nationale de l&apos;Informatique et des Libertés) :
                <br />
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  www.cnil.fr
                </a>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
              Les modifications seront publiées sur cette page avec une nouvelle date de mise à jour.
              Nous vous encourageons à consulter régulièrement cette page.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
            </p>
            <ul className="list-none space-y-1 text-muted-foreground">
              <li><strong>Email :</strong>{" "}
                <a href="mailto:privacy@carrental.fr" className="text-primary hover:underline">
                  privacy@carrental.fr
                </a>
              </li>
              <li><strong>Téléphone :</strong> +33 1 23 45 67 89</li>
              <li><strong>Adresse :</strong> [Adresse de l&apos;entreprise]</li>
              <li><strong>Délégué à la Protection des Données (DPO) :</strong> dpo@carrental.fr</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

