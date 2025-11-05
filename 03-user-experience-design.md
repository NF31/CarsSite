# User Experience Design - CarRental

## 📋 Vue d'Ensemble

Ce document détaille le design UX, les parcours utilisateurs, et les principes de design de l'application CarRental.

---

## 🎯 Principes de Design

### 1. Simplicité
**"Un client doit pouvoir réserver un véhicule en 4 étapes maximum"**

- Interface claire et intuitive
- Pas de surcharge d'informations
- Actions évidentes
- Feedback immédiat

### 2. Confiance
- Transparence sur les prix
- Avis clients authentiques
- Photos réelles des véhicules
- Sécurité des paiements visible

### 3. Rapidité
- Chargement rapide des pages
- Recherche instantanée
- Réservation fluide
- Pas de frictions inutiles

### 4. Accessibilité
- Conforme WCAG 2.1 AA
- Navigation clavier
- Contrastes suffisants
- Textes alternatifs

---

## 🗺️ Parcours Utilisateur Principal

### Parcours : Réservation d'un Véhicule

```
1. Arrivée sur la page d'accueil
   ↓
2. Recherche de véhicules (dates, lieu)
   ↓
3. Exploration des résultats
   ↓
4. Consultation des détails d'un véhicule
   ↓
5. Sélection du véhicule
   ↓
6. Choix des services additionnels
   ↓
7. Renseignement des informations personnelles
   ↓
8. Paiement
   ↓
9. Confirmation
```

### Points de Friction à Éliminer

- ❌ Formulaire trop long
- ❌ Trop d'étapes
- ❌ Prix cachés
- ❌ Navigation confuse
- ❌ Pas de sauvegarde de progression

### Solutions

- ✅ Formulaire en 4 étapes maximum
- ✅ Prix visible dès le début
- ✅ Navigation claire avec breadcrumbs
- ✅ Sauvegarde automatique de la progression
- ✅ Validation en temps réel

---

## 📱 Wireframes Principaux

### Page d'Accueil

```
┌─────────────────────────────────────────┐
│  Header (Logo, Nav, Login, Panier)     │
├─────────────────────────────────────────┤
│                                         │
│  Hero Section                           │
│  ┌─────────────────────────────────┐   │
│  │  "Trouvez votre véhicule idéal" │   │
│  │                                 │   │
│  │  [Recherche: Dates, Lieu]       │   │
│  │  [Bouton: Rechercher]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Catégories de Véhicules                │
│  [Économique] [Compact] [SUV] [Luxe]    │
│                                         │
│  Véhicules Populaires                   │
│  [Card 1] [Card 2] [Card 3] [Card 4]    │
│                                         │
│  Pourquoi Nous Choisir                  │
│  [Icône 1] [Icône 2] [Icône 3]         │
│                                         │
│  Avis Clients                           │
│  [Avis 1] [Avis 2] [Avis 3]            │
│                                         │
├─────────────────────────────────────────┤
│  Footer (Links, Contact, Social)        │
└─────────────────────────────────────────┘
```

### Page de Résultats

```
┌─────────────────────────────────────────┐
│  Header                                  │
├─────────────────────────────────────────┤
│  Filtrer  │  Résultats (25 véhicules)   │
│  ┌──────┐ │  ┌──────┐ ┌──────┐ ┌──────┐│
│  │Dates │ │  │Véh 1 │ │Véh 2 │ │Véh 3 ││
│  │Prix  │ │  │      │ │      │ │      ││
│  │Caté. │ │  │ 450€ │ │ 380€ │ │ 520€ ││
│  │Places│ │  │[Voir]│ │[Voir]│ │[Voir]││
│  │Trans.│ │  └──────┘ └──────┘ └──────┘│
│  └──────┘ │  ┌──────┐ ┌──────┐ ┌──────┐│
│           │  │Véh 4 │ │Véh 5 │ │Véh 6 ││
│           │  └──────┘ └──────┘ └──────┘│
│           │  [Charger plus...]         │
└─────────────────────────────────────────┘
```

### Page de Détails Véhicule

```
┌─────────────────────────────────────────┐
│  Header                                  │
├─────────────────────────────────────────┤
│  [← Retour]  [Partager] [Favoris]       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Galerie Photos - 8 images]    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Peugeot 208 - 2023                     │
│  ★★★★★ (4.5) - 24 avis                 │
│                                         │
│  Caractéristiques                       │
│  • 5 places                             │
│  • Transmission automatique              │
│  • Essence                              │
│  • 12000 km                             │
│                                         │
│  Équipements                            │
│  ✓ Climatisation                        │
│  ✓ GPS                                  │
│  ✓ Bluetooth                            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Réservation                     │   │
│  │  Dates: [15/01] - [20/01]       │   │
│  │  Lieu: [Paris Centre]            │   │
│  │  Prix: 450€                      │   │
│  │  [Réserver maintenant]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Avis Clients                            │
│  [Avis détaillés avec notes]            │
└─────────────────────────────────────────┘
```

### Processus de Réservation (4 Étapes)

#### Étape 1 : Résumé
```
┌─────────────────────────────────────────┐
│  [1. Résumé] 2. Services  3. Infos  4. Paiement│
├─────────────────────────────────────────┤
│                                         │
│  Vérifiez votre réservation             │
│                                         │
│  Véhicule: Peugeot 208                  │
│  Dates: 15/01/2024 - 20/01/2024        │
│  Durée: 5 jours                         │
│  Lieu: Paris Centre                     │
│                                         │
│  Prix véhicule: 450€                    │
│  Services: 0€                           │
│  Total: 450€                            │
│                                         │
│  [Continuer]                             │
└─────────────────────────────────────────┘
```

#### Étape 2 : Services
```
┌─────────────────────────────────────────┐
│  1. Résumé  [2. Services]  3. Infos  4. Paiement│
├─────────────────────────────────────────┤
│                                         │
│  Services Additionnels                  │
│                                         │
│  ☐ Assurance complète      +50€        │
│  ☐ GPS                    +10€/jour    │
│  ☐ Siège enfant           +5€/jour      │
│  ☐ Chauffeur              +100€/jour   │
│                                         │
│  Total: 450€ + 50€ = 500€              │
│                                         │
│  [Continuer]                             │
└─────────────────────────────────────────┘
```

#### Étape 3 : Informations
```
┌─────────────────────────────────────────┐
│  1. Résumé  2. Services  [3. Infos]  4. Paiement│
├─────────────────────────────────────────┤
│                                         │
│  Vos Informations                        │
│                                         │
│  Nom: [_________________]               │
│  Prénom: [_________________]            │
│  Email: [_________________]             │
│  Téléphone: [_________________]         │
│                                         │
│  Permis de Conduire                     │
│  [Upload fichier]                       │
│                                         │
│  ☑ J'accepte les CGV                    │
│                                         │
│  [Continuer]                             │
└─────────────────────────────────────────┘
```

#### Étape 4 : Paiement
```
┌─────────────────────────────────────────┐
│  1. Résumé  2. Services  3. Infos  [4. Paiement]│
├─────────────────────────────────────────┤
│                                         │
│  Paiement                                │
│                                         │
│  Total: 500€                            │
│                                         │
│  Acompte (30%): 150€                    │
│  Solde à la remise: 350€                │
│                                         │
│  Méthode de paiement:                   │
│  ○ Carte bancaire                       │
│  ○ PayPal                               │
│                                         │
│  [Stripe Payment Form]                  │
│                                         │
│  [Confirmer et Payer]                   │
└─────────────────────────────────────────┘
```

---

## 🎨 Design System

### Couleurs

#### Palette Principale
```css
Primary: #3B82F6 (Blue)
  - Usage: Boutons principaux, liens
  - Variantes: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

Secondary: #10B981 (Green)
  - Usage: Succès, confirmations
  - Variantes: 50-900

Danger: #EF4444 (Red)
  - Usage: Erreurs, suppressions
  - Variantes: 50-900

Warning: #F59E0B (Orange)
  - Usage: Avertissements
  - Variantes: 50-900

Neutral: #6B7280 (Gray)
  - Usage: Textes, bordures
  - Variantes: 50-900
```

### Typographie

#### Hiérarchie
```css
H1: 3rem (48px) - Bold
H2: 2.25rem (36px) - Semibold
H3: 1.875rem (30px) - Semibold
H4: 1.5rem (24px) - Medium
Body: 1rem (16px) - Regular
Small: 0.875rem (14px) - Regular
```

#### Fonts
- **Primary**: Geist Sans (UI)
- **Mono**: Geist Mono (Code)

### Espacements

```css
0: 0px
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
5: 1.25rem (20px)
6: 1.5rem (24px)
8: 2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)
```

### Composants UI

#### Boutons
```tsx
<Button variant="primary">Réserver</Button>
<Button variant="secondary">Annuler</Button>
<Button variant="outline">Voir plus</Button>
<Button variant="ghost">Fermer</Button>
```

#### Cards
```tsx
<Card>
  <CardImage src="..." />
  <CardTitle>Peugeot 208</CardTitle>
  <CardDescription>5 places, Automatique</CardDescription>
  <CardPrice>450€</CardPrice>
  <CardAction>Réserver</CardAction>
</Card>
```

#### Inputs
```tsx
<Input 
  label="Email"
  type="email"
  placeholder="votre@email.com"
  error="Email invalide"
/>
```

---

## 📱 Responsive Design

### Breakpoints

| Device | Width | Usage |
|--------|-------|-------|
| Mobile | < 640px | Navigation hamburger, cards empilées |
| Tablet | 640px - 1024px | Navigation adaptée, grid 2 colonnes |
| Desktop | > 1024px | Navigation complète, grid 3-4 colonnes |

### Mobile-First Approach

1. **Design mobile d'abord**
2. **Amélioration progressive** pour desktop
3. **Touch-friendly** (minimum 44x44px)
4. **Performance optimisée**

---

## ♿ Accessibilité

### WCAG 2.1 AA Compliance

- **Contraste** : Minimum 4.5:1 pour texte
- **Navigation clavier** : Tous les éléments accessibles
- **Screen readers** : Labels et ARIA
- **Focus visible** : Indicateurs clairs
- **Alt text** : Toutes les images

### Bonnes Pratiques

- ✅ Labels explicites
- ✅ Messages d'erreur clairs
- ✅ Validation en temps réel
- ✅ Feedback visuel
- ✅ Pas de dépendance à la couleur seule

---

## 🎭 États des Composants

### Boutons

- **Default** : État normal
- **Hover** : Survol
- **Active** : Clic
- **Disabled** : Désactivé
- **Loading** : En cours de chargement

### Formulaires

- **Default** : Champ vide
- **Focus** : Champ actif
- **Filled** : Champ rempli
- **Error** : Erreur de validation
- **Success** : Validation réussie

### Cards

- **Default** : État normal
- **Hover** : Survol (élévation)
- **Selected** : Sélectionné
- **Loading** : Chargement

---

## 📊 Métriques UX

### Objectifs

- **Taux de conversion** : > 5%
- **Temps de réservation** : < 5 minutes
- **Taux d'abandon** : < 30%
- **Satisfaction** : > 4/5 étoiles

### Tracking

- **Heatmaps** : Zones cliquées
- **Scroll depth** : Profondeur de scroll
- **Time on page** : Temps passé
- **Click tracking** : Actions utilisateurs

---

## 🚀 Animations et Transitions

### Principes

- **Durée** : 200-300ms pour interactions
- **Easing** : ease-in-out
- **Purpose** : Feedback, pas de distraction

### Animations Clés

- **Page transitions** : Fade in/out
- **Modal** : Slide up + fade
- **Cards** : Hover lift
- **Loading** : Skeleton screens
- **Success** : Checkmark animation

---

## 📝 Copywriting

### Ton de Voix

- **Professionnel** mais accessible
- **Clair** et direct
- **Rassurant** pour la confiance
- **Actionnable** avec CTAs clairs

### Exemples

- ❌ "Vous êtes invité à procéder à la sélection"
- ✅ "Choisissez votre véhicule"

- ❌ "Veuillez compléter les champs ci-dessous"
- ✅ "Remplissez vos informations"

---

## ✅ Checklist UX

- [ ] Parcours utilisateur défini
- [ ] Wireframes créés
- [ ] Design system établi
- [ ] Responsive design validé
- [ ] Accessibilité vérifiée
- [ ] Animations définies
- [ ] Copywriting rédigé
- [ ] Tests utilisateurs planifiés


