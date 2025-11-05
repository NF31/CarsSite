# Navigation Admin et Dashboard - CarRental

## 📋 Vue d'Ensemble

Ce document détaille la navigation de l'interface admin et la structure du dashboard.

---

## 🧭 Navigation Admin

### Structure de la Navigation

```
┌─────────────────────────────────────────────────────────────┐
│  🚗 CarRental Admin                                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Dashboard   │  │ Véhicules   │  │ Réservations│  ...   │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  [Avatar] Admin Name [▼] [Notifications 🔔] [Logout]        │
└─────────────────────────────────────────────────────────────┘
```

### Menu Principal

**Sections :**

1. **📊 Dashboard**
   - Icône : Chart Bar
   - Route : `/admin/dashboard`
   - Badge : Alertes (si applicable)

2. **🚗 Véhicules**
   - Icône : Car
   - Route : `/admin/vehicles`
   - Sous-menu :
     - Tous les véhicules
     - Ajouter un véhicule
     - Disponibilités
     - Maintenance

3. **📅 Réservations**
   - Icône : Calendar
   - Route : `/admin/bookings`
   - Sous-menu :
     - Toutes les réservations
     - Nouvelle réservation
     - Calendrier
     - En attente

4. **👥 Clients**
   - Icône : Users
   - Route : `/admin/clients`
   - Badge : Nouveaux clients (si applicable)

5. **🎁 Services**
   - Icône : Gift
   - Route : `/admin/services`

6. **🔧 Maintenance**
   - Icône : Wrench
   - Route : `/admin/maintenance`
   - Badge : Maintenances à prévoir

7. **📊 Statistiques**
   - Icône : Chart Line
   - Route : `/admin/statistics`

8. **💰 Facturation**
   - Icône : Receipt
   - Route : `/admin/invoices`

9. **⭐ Avis**
   - Icône : Star
   - Route : `/admin/reviews`
   - Badge : Avis en attente

10. **⚙️ Paramètres**
    - Icône : Cog
    - Route : `/admin/settings`
    - Sous-menu :
      - Informations agence
      - Configuration
      - Emails
      - Utilisateurs

### Navigation Mobile

Menu hamburger avec :
- Icône ☰
- Overlay avec menu complet
- Fermeture par clic extérieur

---

## 📊 Dashboard Admin

### Layout Général

```
┌─────────────────────────────────────────────────────────────┐
│  Header Navigation                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Dashboard                                               │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Réserv.  │  │ Revenus  │  │ Véhicules│  │ Taux     │   │
│  │ Aujourd'hui│  │ Ce Mois │  │ Dispon. │  │ Occup.   │   │
│  │    12     │  │ 45,230€ │  │  28/35  │  │   85%    │   │
│  │ +15% ↗    │  │ +8% ↗    │  │  80%    │  │ +5% ↗    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  Revenus sur 30 jours                       │           │
│  │  [Graphique en ligne]                       │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Réservations        │  │ Taux d'occupation    │         │
│  │ par catégorie       │  │ par véhicule         │         │
│  │ [Graphique barres]  │  │ [Graphique circulaire│         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  Réservations Récentes                       │           │
│  │  [Tableau]                                   │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  ⚠️ Alertes                                  │           │
│  │  • 2 véhicules en maintenance                │           │
│  │  • 3 réservations à confirmer                │           │
│  │  • 1 paiement en attente                     │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cards de Métriques

#### Card Réservations Aujourd'hui

```tsx
<MetricCard
  title="Réservations Aujourd'hui"
  value={12}
  change={+15}
  changeType="increase"
  icon={<CalendarIcon />}
  link="/admin/bookings?filter=today"
/>
```

**Design :**
- Fond bleu clair
- Icône calendrier
- Nombre en grand
- Variation en pourcentage
- Lien vers la section

#### Card Revenus

```tsx
<MetricCard
  title="Revenus Ce Mois"
  value="45,230€"
  change={+8}
  changeType="increase"
  icon={<CurrencyEuroIcon />}
  link="/admin/statistics"
/>
```

**Design :**
- Fond vert clair
- Format monétaire
- Comparaison avec mois précédent

#### Card Véhicules Disponibles

```tsx
<MetricCard
  title="Véhicules Disponibles"
  value="28/35"
  percentage={80}
  icon={<CarIcon />}
  link="/admin/vehicles?filter=available"
/>
```

**Design :**
- Affichage fractionnel
- Barre de progression
- Lien vers liste

#### Card Taux d'Occupation

```tsx
<MetricCard
  title="Taux d'Occupation"
  value="85%"
  change={+5}
  changeType="increase"
  icon={<ChartBarIcon />}
  link="/admin/statistics"
/>
```

### Graphiques

#### Graphique Revenus (30 jours)

**Type :** Ligne

**Données :**
- Axe X : Dates (30 derniers jours)
- Axe Y : Montant en euros
- Ligne : Revenus quotidiens
- Comparaison : Ligne pointillée (mois précédent)

**Interactions :**
- Hover : Afficher montant exact
- Clic : Voir détails du jour

#### Graphique Réservations par Catégorie

**Type :** Barres

**Données :**
- Catégories : Économique, Compact, SUV, Luxe
- Valeurs : Nombre de réservations
- Couleurs différenciées par catégorie

#### Graphique Taux d'Occupation

**Type :** Circulaire (Donut)

**Données :**
- Disponible : 80%
- Réservé : 15%
- Maintenance : 5%

### Tableau Réservations Récentes

**Colonnes :**
- Référence
- Client
- Véhicule
- Dates
- Prix
- Statut
- Actions

**Fonctionnalités :**
- Tri par colonne
- Pagination
- Lien vers détails
- Filtres rapides

### Section Alertes

**Types d'alertes :**

1. **Maintenance**
   - Véhicules en maintenance depuis X jours
   - Entretiens à prévoir

2. **Réservations**
   - Réservations à confirmer
   - Paiements en attente

3. **Véhicules**
   - Véhicules nécessitant un entretien
   - Disponibilités critiques

**Design :**
- Icône d'alerte
- Liste avec liens
- Badge de comptage
- Action rapide

---

## 🔔 Système de Notifications

### Badges sur Navigation

**Affichage :**
- Badge rouge avec nombre
- Position : En haut à droite de l'icône
- Animation : Pulse pour nouvelles notifications

**Sections avec badges :**
- Réservations (nouvelles)
- Avis (en attente)
- Maintenance (à prévoir)
- Clients (nouveaux)

### Dropdown Notifications

```
┌─────────────────────────────────────────┐
│  🔔 Notifications (3)                    │
├─────────────────────────────────────────┤
│  • Nouvelle réservation #BK-001          │
│    Il y a 5 minutes                      │
│                                          │
│  • Avis en attente de modération          │
│    Il y a 1 heure                        │
│                                          │
│  • Maintenance à prévoir - Peugeot 208    │
│    Il y a 2 heures                       │
│                                          │
│  [Voir toutes]                           │
└─────────────────────────────────────────┘
```

---

## 👤 Menu Utilisateur

### Dropdown Utilisateur

```
┌─────────────────────────────────────────┐
│  👤 John Doe                             │
│     admin@carrental.com                  │
├─────────────────────────────────────────┤
│  📊 Mon Profil                           │
│  ⚙️ Paramètres                           │
│  📚 Documentation                         │
│  ─────────────────────────────────────  │
│  🚪 Déconnexion                          │
└─────────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Desktop (> 1024px)
- Navigation horizontale complète
- Dashboard en grille 2-3 colonnes
- Tous les graphiques visibles

### Tablet (768px - 1024px)
- Navigation avec icônes seulement
- Dashboard en grille 2 colonnes
- Graphiques adaptés

### Mobile (< 768px)
- Menu hamburger
- Navigation en overlay
- Dashboard en une colonne
- Graphiques empilés

---

## 🎨 Styles et Animations

### Transitions

- **Navigation** : Slide in/out
- **Dropdowns** : Fade + slide
- **Cards** : Hover lift
- **Graphiques** : Animate on load

### États

- **Active** : Section actuelle mise en évidence
- **Hover** : Changement de couleur
- **Badge** : Pulse animation
- **Loading** : Skeleton screens

---

## ✅ Checklist Navigation

- [ ] Navigation principale avec toutes les sections
- [ ] Sous-menus pour sections complexes
- [ ] Badges de notifications
- [ ] Menu utilisateur
- [ ] Responsive design
- [ ] Animations fluides
- [ ] Breadcrumbs sur pages internes
- [ ] Recherche globale (optionnel)


