# 🚀 Comment lancer le webhook Stripe en local

## Problème
Le webhook Stripe ne se lance pas automatiquement en local. Stripe ne peut pas accéder à votre `localhost:3000` directement.

## Solution : Utiliser Stripe CLI

### 1. Installer Stripe CLI

**Windows (avec Chocolatey) :**
```bash
choco install stripe
```

**Windows (téléchargement manuel) :**
- Télécharger depuis : https://github.com/stripe/stripe-cli/releases
- Extraire l'archive et ajouter au PATH

**Ou avec npm :**
```bash
npm install -g stripe-cli
```

### 2. Se connecter à Stripe

```bash
stripe login
```

Cela va ouvrir votre navigateur pour vous authentifier.

### 3. Lancer le webhook listener

**Commande principale :**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Cette commande va :
- Écouter tous les événements Stripe (payments, checkout, etc.)
- Les forwarder vers votre serveur local `localhost:3000/api/webhooks/stripe`
- Afficher un **webhook secret** qu'il faut copier

### 4. Récupérer le webhook secret

Quand vous lancez `stripe listen`, vous verrez quelque chose comme :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copiez ce secret** et ajoutez-le dans votre fichier `.env` :
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**IMPORTANT :** Il faut redémarrer votre serveur Next.js après avoir ajouté le secret !

### 5. Tester le webhook

1. Gardez le terminal avec `stripe listen` ouvert
2. Gardez votre serveur Next.js lancé (`npm run dev`)
3. Effectuez un paiement test sur votre site
4. Vous devriez voir dans le terminal `stripe listen` :
   ```
   --> checkout.session.completed [evt_xxxxx]
   <-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
   ```

## Alternative : Script npm

Vous pouvez ajouter un script dans `package.json` :

```json
{
  "scripts": {
    "webhook:stripe": "stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  }
}
```

Puis lancer :
```bash
npm run webhook:stripe
```

## Vérification

Une fois le webhook lancé, vous devriez voir dans les logs Next.js :
```
[Stripe Webhook] 🔔 Event checkout.session.completed reçu
[Stripe Webhook] 📋 Début du traitement du paiement
[Stripe Webhook] ✅ Réservation trouvée
...
```

## Troubleshooting

### Le webhook ne reçoit rien ?
1. Vérifiez que `stripe listen` est bien lancé
2. Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien défini dans `.env`
3. Vérifiez que le serveur Next.js écoute sur `localhost:3000`
4. Redémarrez le serveur Next.js après avoir ajouté le secret

### Erreur de signature ?
- Le `STRIPE_WEBHOOK_SECRET` doit correspondre à celui affiché par `stripe listen`
- Il change à chaque fois que vous relancez `stripe listen`
- Mettez à jour `.env` et redémarrez Next.js

### Le webhook se lance mais les workflows ne s'exécutent pas ?
- Vérifiez les logs du serveur Next.js
- Vérifiez que tous les imports sont corrects
- Vérifiez que la base de données est accessible
