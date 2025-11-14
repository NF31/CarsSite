# Configuration du Branding Stripe Checkout

## 🎨 Personnalisation aux couleurs du site

**⚠️ IMPORTANT** : La personnalisation des couleurs de Stripe Checkout doit être configurée dans le Dashboard Stripe. L'API Stripe ne supporte pas le paramètre `appearance` pour les sessions Checkout.

Pour personnaliser la page de paiement Stripe Checkout aux couleurs de votre site, suivez ces étapes :

### 1. Accéder aux paramètres de branding

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com)
2. Allez dans **Settings** > **Branding** (ou directement : https://dashboard.stripe.com/settings/branding)

### 2. Configurer les couleurs

Utilisez les couleurs suivantes pour correspondre à votre site :

#### Couleurs principales

- **Primary Color (Couleur principale)** : `#3B82F6`
  - Utilisée pour : Boutons, liens, éléments interactifs
  - Code hexadécimal : `3B82F6`
  
- **Accent Color (Couleur d'accentuation)** : `#10B981`
  - Utilisée pour : Succès, confirmations, éléments secondaires
  - Code hexadécimal : `10B981`

#### Couleurs de fond et texte

- **Background Color (Couleur de fond)** : `#FFFFFF` (Blanc)
- **Text Color (Couleur du texte)** : `#111827` (Gris foncé)

### 3. Ajouter votre logo

1. **Logo** : Téléchargez votre logo (recommandé : format PNG, fond transparent, 200x200px minimum)
2. **Icon** : Téléchargez une icône pour les onglets de navigateur (format PNG, 32x32px ou 64x64px)

### 4. Prévisualiser

Stripe vous permet de prévisualiser les modifications en temps réel avant de les enregistrer.

### 5. Enregistrer

Cliquez sur **"Save changes"** pour appliquer les modifications.

## 📋 Checklist de configuration

- [ ] Primary Color défini à `#3B82F6`
- [ ] Accent Color défini à `#10B981`
- [ ] Background Color défini à `#FFFFFF`
- [ ] Text Color défini à `#111827`
- [ ] Logo téléchargé
- [ ] Icon téléchargée
- [ ] Prévisualisation vérifiée
- [ ] Modifications enregistrées

## 🎯 Résultat attendu

Après configuration, la page de paiement Stripe Checkout aura :
- Les boutons en bleu (`#3B82F6`) correspondant à votre site
- Les éléments de succès en vert (`#10B981`)
- Votre logo visible en haut de la page
- Une apparence cohérente avec votre site

## 📝 Notes importantes

- Les modifications s'appliquent à **toutes** les sessions Checkout de votre compte
- Les couleurs sont appliquées automatiquement à toutes les nouvelles sessions
- Vous pouvez tester avec une session de test pour vérifier l'apparence
- Pour des personnalisations plus avancées (polices, layout), contactez le support Stripe

## 🔗 Liens utiles

- [Documentation Stripe Branding](https://stripe.com/docs/payments/checkout/branding)
- [Dashboard Stripe Branding](https://dashboard.stripe.com/settings/branding)
- [Guide de personnalisation Stripe](https://stripe.com/docs/payments/checkout/customization)

