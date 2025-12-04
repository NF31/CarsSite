import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Conditions Générales d&apos;Utilisation - CarRental",
  description: "Consultez nos conditions générales d&apos;utilisation et de vente",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Conditions Générales d&apos;Utilisation</CardTitle>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Objet et champ d&apos;application</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation de la plateforme CarRental,
              accessible à l&apos;adresse www.carrental.fr, et les services de location de véhicules proposés par CarRental.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              En accédant et en utilisant notre plateforme, vous acceptez sans réserve les présentes CGU.
              Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description des services</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              CarRental propose une plateforme de réservation en ligne permettant aux utilisateurs de :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Rechercher et consulter des véhicules disponibles à la location</li>
              <li>Réserver un véhicule pour une période déterminée</li>
              <li>Payer en ligne via des moyens de paiement sécurisés</li>
              <li>Gérer leurs réservations et leur compte utilisateur</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Conditions de location</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">3.1. Âge et permis de conduire</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Le locataire doit être âgé d&apos;au moins 21 ans</li>
              <li>Permis de conduire valide depuis au moins 2 ans (selon catégorie de véhicule)</li>
              <li>Présentation obligatoire du permis de conduire et d&apos;une pièce d&apos;identité lors de la prise en charge</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.2. Caution et garanties</h3>
            <p className="text-muted-foreground leading-relaxed">
              Une caution sera prélevée lors de la prise en charge du véhicule. Cette caution sera restituée
              après vérification de l&apos;état du véhicule lors de la restitution, sous réserve d&apos;absence de dommages
              ou de frais supplémentaires.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.3. Utilisation du véhicule</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Le véhicule doit être utilisé uniquement dans le cadre de la location</li>
              <li>Interdiction de sous-louer ou de prêter le véhicule à un tiers</li>
              <li>Interdiction d&apos;utiliser le véhicule pour des activités illégales</li>
              <li>Respect du code de la route et des limitations de vitesse</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Tarifs et paiement</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Les tarifs affichés sur la plateforme sont exprimés en euros TTC et incluent :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Le prix de location du véhicule pour la période réservée</li>
              <li>L&apos;assurance de base (selon forfait choisi)</li>
              <li>Les kilomètres inclus dans la formule</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Les frais supplémentaires (kilomètres supplémentaires, carburant, péages, etc.) seront facturés
              lors de la restitution du véhicule.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Annulation et modification</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">5.1. Annulation par le client</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Annulation gratuite jusqu&apos;à 48h avant la date de début de location</li>
              <li>Frais d&apos;annulation de 50€ si annulation entre 48h et 24h avant</li>
              <li>Pas de remboursement en cas d&apos;annulation moins de 24h avant</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.2. Modification de réservation</h3>
            <p className="text-muted-foreground leading-relaxed">
              Les modifications de réservation sont possibles sous réserve de disponibilité.
              Un supplément peut être appliqué en cas de changement de catégorie de véhicule.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              CarRental ne saurait être tenu responsable :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Des dommages causés par le locataire au véhicule ou à des tiers</li>
              <li>Des retards ou annulations dus à des circonstances indépendantes de sa volonté</li>
              <li>Des objets personnels laissés dans le véhicule</li>
              <li>Des infractions au code de la route commises par le locataire</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Protection des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le traitement de vos données personnelles est effectué conformément à notre{" "}
              <a href="/legal/privacy" className="text-primary hover:underline">
                Politique de Confidentialité
              </a>{" "}
              et au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tous les éléments de la plateforme CarRental (textes, images, logos, etc.) sont protégés par le droit
              d&apos;auteur et sont la propriété exclusive de CarRental. Toute reproduction ou utilisation non autorisée
              est strictement interdite.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Droit applicable et juridiction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes CGU sont régies par le droit français. En cas de litige, et à défaut d&apos;accord amiable,
              les tribunaux français seront seuls compétents.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant ces CGU, vous pouvez nous contacter à :
            </p>
            <ul className="list-none space-y-1 text-muted-foreground mt-2">
              <li>Email : contact@carrental.fr</li>
              <li>Téléphone : +33 1 23 45 67 89</li>
              <li>Adresse : [Adresse de l&apos;entreprise]</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

