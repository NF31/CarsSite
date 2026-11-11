# Configuration Stripe

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` :

```env
# Stripe
STRIPE_KEY=pk_test_... # Clé publique Stripe (optionnelle, pour le frontend si nécessaire)
STRIPE_SECRET=sk_test_... # Clé secrète Stripe (test ou production)
STRIPE_WEBHOOK_SECRET=whsec_... # Secret du webhook Stripe
NEXTAUTH_URL=http://localhost:3000 # URL de votre application
```

## Configuration Stripe

1. **Créer un compte Stripe** : https://stripe.com/fr
2. **Récupérer les clés API** :
   - Allez dans le Dashboard Stripe > Developers > API keys
   - Copiez la "Publishable key" (commence par `pk_test_` en mode test) → `STRIPE_KEY` dans `.env`
   - Copiez la "Secret key" (commence par `sk_test_` en mode test) → `STRIPE_SECRET` dans `.env`

3. **Configurer les webhooks** :
   - Allez dans Dashboard Stripe > Developers > Webhooks
   - Cliquez sur "Add endpoint"
   - URL : `https://votre-domaine.com/api/webhooks/stripe` (ou `http://localhost:3000/api/webhooks/stripe` en local avec Stripe CLI)
   - Événements à écouter : `checkout.session.completed`
   - Copiez le "Signing secret" (commence par `whsec_`)
   - Ajoutez-le à `STRIPE_WEBHOOK_SECRET` dans `.env`

## Test en local avec Stripe CLI

**IMPORTANT**: En local, les webhooks Stripe ne fonctionnent pas automatiquement. Vous DEVEZ utiliser Stripe CLI pour les forwarder.

Pour tester les webhooks en local :

1. **Installer Stripe CLI** : https://stripe.com/docs/stripe-cli
2. **Se connecter** : `stripe login`
3. **Forwarder les webhooks** (dans un terminal séparé) :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. **Copier le webhook secret** affiché (commence par `whsec_`) et l'ajouter à `STRIPE_WEBHOOK_SECRET` dans `.env`
5. **Redémarrer votre application** pour charger la nouvelle variable d'environnement

**Note** : Si vous avez déjà payé mais que le paiement n'apparaît pas dans la base de données, utilisez le bouton "Vérifier le paiement" sur la page de détails de réservation. Cela vérifiera manuellement le statut dans Stripe et mettra à jour la base de données.

## Personnalisation de la page de paiement

Stripe Checkout peut être personnalisé via le Dashboard Stripe :
- Dashboard > Settings > Branding
- Modifiez les couleurs, le logo, etc.

**Guide complet**: Consultez `docs/stripe-branding-setup.md` pour les instructions détaillées.

### Couleurs du site à configurer dans Stripe :

- **Primary Color** : `#3B82F6` (Bleu) - Pour les boutons et éléments principaux
- **Accent Color** : `#10B981` (Vert) - Pour les éléments de succès
- **Background** : `#FFFFFF` (Blanc)
- **Text** : `#111827` (Gris foncé)

## Flux de paiement

1. Client choisit "Payer maintenant" dans l'étape 4 de réservation
2. Réservation créée avec statut `PENDING`
3. Redirection vers `/bookings/payment?bookingId=...`
4. Page de paiement personnalisée affiche les détails
5. Clic sur "Payer maintenant" → Redirection vers Stripe Checkout
6. Après paiement réussi → Webhook Stripe met à jour la réservation
7. Redirection vers `/bookings/payment/success`

## Notes importantes

- En mode test, utilisez les cartes de test Stripe : https://stripe.com/docs/testing
- La carte de test `4242 4242 4242 4242` fonctionne avec n'importe quelle date d'expiration future et CVC
- Le montant payé = Acompte (30%) + Caution de garantie
- Le solde restant sera à payer à la remise du véhicule

