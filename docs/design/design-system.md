# Design System - CarRental

## Vue d'Ensemble

Ce document définit le design system complet de CarRental avec les composants UI, les tokens de design, et les guidelines.

---

## Tokens de Design

### Couleurs

#### Palette Principale

```css
/* Primary - Bleu */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6; /* Main */
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;

/* Secondary - Vert */
--color-secondary-50: #ecfdf5;
--color-secondary-100: #d1fae5;
--color-secondary-200: #a7f3d0;
--color-secondary-300: #6ee7b7;
--color-secondary-400: #34d399;
--color-secondary-500: #10b981; /* Main */
--color-secondary-600: #059669;
--color-secondary-700: #047857;
--color-secondary-800: #065f46;
--color-secondary-900: #064e3b;

/* Neutral - Gris */
--color-neutral-50: #f9fafb;
--color-neutral-100: #f3f4f6;
--color-neutral-200: #e5e7eb;
--color-neutral-300: #d1d5db;
--color-neutral-400: #9ca3af;
--color-neutral-500: #6b7280;
--color-neutral-600: #4b5563;
--color-neutral-700: #374151;
--color-neutral-800: #1f2937;
--color-neutral-900: #111827;

/* Semantic Colors */
--color-success: #10b981;
--color-error: #ef4444;
--color-warning: #f59e0b;
--color-info: #3b82f6;
```

#### Usage

- **Primary** : Boutons principaux, liens, éléments interactifs
- **Secondary** : Succès, confirmations
- **Neutral** : Textes, bordures, arrière-plans
- **Semantic** : États (succès, erreur, avertissement)

### Typographie

#### Fonts

```css
/* Primary Font */
--font-primary: 'Geist Sans', system-ui, sans-serif;

/* Mono Font */
--font-mono: 'Geist Mono', 'Courier New', monospace;
```

#### Hiérarchie

```css
/* Headings */
--text-h1: 3rem (48px) / 1.2 / 700;
--text-h2: 2.25rem (36px) / 1.3 / 600;
--text-h3: 1.875rem (30px) / 1.4 / 600;
--text-h4: 1.5rem (24px) / 1.5 / 500;

/* Body */
--text-body-lg: 1.125rem (18px) / 1.6 / 400;
--text-body: 1rem (16px) / 1.6 / 400;
--text-body-sm: 0.875rem (14px) / 1.5 / 400;

/* Labels */
--text-label: 0.875rem (14px) / 1.4 / 500;
--text-caption: 0.75rem (12px) / 1.4 / 400;
```

### Espacements

```css
--spacing-0: 0;
--spacing-1: 0.25rem (4px);
--spacing-2: 0.5rem (8px);
--spacing-3: 0.75rem (12px);
--spacing-4: 1rem (16px);
--spacing-5: 1.25rem (20px);
--spacing-6: 1.5rem (24px);
--spacing-8: 2rem (32px);
--spacing-10: 2.5rem (40px);
--spacing-12: 3rem (48px);
--spacing-16: 4rem (64px);
--spacing-20: 5rem (80px);
```

### Bordures

```css
--radius-sm: 0.25rem (4px);
--radius-md: 0.5rem (8px);
--radius-lg: 0.75rem (12px);
--radius-xl: 1rem (16px);
--radius-full: 9999px;
```

### Ombres

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## Composants UI

### Button

```tsx
// Variantes
<Button variant="primary">Réserver</Button>
<Button variant="secondary">Annuler</Button>
<Button variant="outline">Voir plus</Button>
<Button variant="ghost">Fermer</Button>
<Button variant="danger">Supprimer</Button>

// Tailles
<Button size="sm">Petit</Button>
<Button size="md">Moyen</Button>
<Button size="lg">Grand</Button>

// États
<Button disabled>Désactivé</Button>
<Button loading>Chargement...</Button>
```

**Styles :**
- Primary : Fond bleu, texte blanc
- Secondary : Fond vert, texte blanc
- Outline : Fond transparent, bordure
- Ghost : Fond transparent, pas de bordure
- Danger : Fond rouge, texte blanc

### Input

```tsx
<Input
  label="Email"
  type="email"
  placeholder="votre@email.com"
  error="Email invalide"
  required
/>
```

**États :**
- Default : Bordure grise
- Focus : Bordure bleue
- Error : Bordure rouge + message
- Disabled : Fond gris clair

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Peugeot 208</CardTitle>
    <CardDescription>5 places, Automatique</CardDescription>
  </CardHeader>
  <CardContent>
    <p>45€/jour</p>
  </CardContent>
  <CardFooter>
    <Button>Réserver</Button>
  </CardFooter>
</Card>
```

**Variantes :**
- Default : Bordure, ombre légère
- Elevated : Ombre plus prononcée
- Outlined : Bordure uniquement

### Badge

```tsx
<Badge variant="success">Disponible</Badge>
<Badge variant="warning">En maintenance</Badge>
<Badge variant="error">Réservé</Badge>
<Badge variant="info">Nouveau</Badge>
```

### Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirmer la réservation"
>
  <p>Êtes-vous sûr de vouloir réserver ce véhicule ?</p>
  <ModalFooter>
    <Button variant="outline" onClick={onClose}>Annuler</Button>
    <Button variant="primary" onClick={onConfirm}>Confirmer</Button>
  </ModalFooter>
</Modal>
```

### Table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Client</TableHead>
      <TableHead>Véhicule</TableHead>
      <TableHead>Dates</TableHead>
      <TableHead>Prix</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Peugeot 208</TableCell>
      <TableCell>15/01 - 20/01</TableCell>
      <TableCell>450€</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Select

```tsx
<Select
  label="Catégorie"
  options={[
    { value: 'economy', label: 'Économique' },
    { value: 'compact', label: 'Compact' },
    { value: 'suv', label: 'SUV' }
  ]}
/>
```

### DatePicker

```tsx
<DatePicker
  label="Date de début"
  value={startDate}
  onChange={setStartDate}
  minDate={new Date()}
/>
```

### Toast

```tsx
<Toast
  type="success"
  message="Réservation confirmée !"
  duration={3000}
/>
```

**Types :**
- Success : Vert
- Error : Rouge
- Warning : Orange
- Info : Bleu

---

## Layout

### Grid System

```css
/* Container */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Grid */
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

### Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## Animations

### Transitions

```css
/* Durée */
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;

/* Easing */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Animations Communes

```css
/* Fade */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide */
@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Scale */
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

## Responsive Design

### Mobile First

- **Approche** : Design mobile d'abord
- **Breakpoints** : 640px, 768px, 1024px, 1280px
- **Touch** : Minimum 44x44px pour les éléments interactifs

### Adaptations

- **Navigation** : Hamburger menu sur mobile
- **Grid** : 1 colonne mobile → 2-3 desktop
- **Typography** : Tailles réduites sur mobile
- **Spacing** : Réduit sur mobile

---

## Accessibilité

### Contrastes

- **Texte normal** : Minimum 4.5:1
- **Texte large** : Minimum 3:1
- **Éléments interactifs** : Minimum 3:1

### Navigation Clavier

- **Tab** : Navigation entre éléments
- **Enter/Space** : Activation
- **Escape** : Fermeture modals

### Screen Readers

- **Labels** : Tous les inputs ont des labels
- **ARIA** : Attributs ARIA appropriés
- **Alt text** : Toutes les images

---

## Guidelines

### Utilisation des Couleurs

- Utiliser les tokens de design
- Maintenir les contrastes
- Cohérence dans l'application
- Ne pas créer de nouvelles couleurs

### Utilisation des Composants

- Utiliser les composants du design system
- Respecter les variantes
- Maintenir la cohérence
- Ne pas modifier les composants directement

### Typographie

- Utiliser la hiérarchie définie
- Maintenir les espacements
- Cohérence dans les tailles
- Ne pas mélanger les fonts

---

## Documentation Composants

Chaque composant doit avoir :
- Description
- Props/PropsTypes
- Exemples d'utilisation
- Variantes
- États
- Accessibilité

---

## Checklist Design System

- [x] Tokens de design définis
- [x] Composants UI de base
- [x] Guidelines d'utilisation
- [x] Responsive design
- [x] Accessibilité
- [x] Animations
- [ ] Documentation complète de chaque composant
- [ ] Storybook (optionnel)


