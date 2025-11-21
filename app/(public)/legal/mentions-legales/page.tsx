import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Mentions Légales - CarRental",
  description: "Mentions légales et informations sur l'entreprise CarRental",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalNoticesPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Mentions Légales</CardTitle>
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
            <h2 className="text-2xl font-semibold mb-4">1. Éditeur du site</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le site web <strong>www.carrental.fr</strong> est édité par :
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-4 space-y-2">
              <p className="text-muted-foreground">
                <strong>CarRental</strong>
              </p>
              <p className="text-muted-foreground">
                123 Avenue de la République<br />
                75011 Paris, France
              </p>
              <p className="text-muted-foreground">
                Téléphone : <a href="tel:+33123456789" className="text-primary hover:underline">+33 1 23 45 67 89</a>
              </p>
              <p className="text-muted-foreground">
                Email : <a href="mailto:contact@carrental.fr" className="text-primary hover:underline">contact@carrental.fr</a>
              </p>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Directeur de la publication</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le directeur de la publication est le représentant légal de CarRental.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Hébergement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le site est hébergé par :
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-4">
              <p className="text-muted-foreground">
                <strong>Vercel Inc.</strong><br />
                340 S Lemon Ave #4133<br />
                Walnut, CA 91789<br />
                États-Unis
              </p>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              L&apos;ensemble de ce site relève de la législation française et internationale sur le droit d&apos;auteur et la propriété intellectuelle. 
              Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              La reproduction de tout ou partie de ce site sur un support électronique ou autre est formellement interdite 
              sauf autorisation expresse du directeur de la publication.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les informations contenues sur ce site sont aussi précises que possible et le site est mis à jour à différentes périodes de l&apos;année, 
              mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              CarRental ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l&apos;utilisateur, 
              lors de l&apos;accès au site www.carrental.fr.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Liens hypertextes</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le site www.carrental.fr peut contenir des liens hypertextes vers d&apos;autres sites présents sur le réseau Internet. 
              Les liens vers ces autres ressources vous font quitter le site www.carrental.fr.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Il est possible de créer un lien vers la page de présentation de ce site sans autorisation expresse de l&apos;éditeur. 
              Aucune autorisation ni demande d&apos;information préalable ne peut être exigée par l&apos;éditeur à l&apos;égard d&apos;un site qui souhaite établir un lien 
              vers le site de l&apos;éditeur. Il convient toutefois d&apos;afficher ce site dans une nouvelle fenêtre du navigateur.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Données personnelles</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le traitement de vos données personnelles est effectué conformément à notre{" "}
              <a href="/legal/privacy" className="text-primary hover:underline">
                Politique de Confidentialité
              </a>
              {" "}et au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Droit applicable</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le présent site et les modalités de son utilisation sont régis par le droit français. 
              En cas de litige et à défaut d&apos;accord amiable, le litige sera porté devant les tribunaux français conformément aux règles de compétence en vigueur.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant ces mentions légales, vous pouvez nous contacter :
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-4 space-y-2">
              <p className="text-muted-foreground">
                <strong>Email :</strong> <a href="mailto:contact@carrental.fr" className="text-primary hover:underline">contact@carrental.fr</a>
              </p>
              <p className="text-muted-foreground">
                <strong>Téléphone :</strong> <a href="tel:+33123456789" className="text-primary hover:underline">+33 1 23 45 67 89</a>
              </p>
              <p className="text-muted-foreground">
                <strong>Adresse :</strong> 123 Avenue de la République, 75011 Paris, France
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

