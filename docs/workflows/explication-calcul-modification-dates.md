# Explication du Calcul de Modification de Dates

## Exemple Concret

### Situation Initiale
- **Prix actuel de la location** : 190,00 €
- **Acompte déjà payé (30%)** : 57,00 € (190 × 0.3 = 57)
- **Caution déjà payée** : 800,00 €
- **Solde restant à payer** : 133,00 € (190 - 57 = 133)

### Situation Après Modification
- **Nouveau prix de la location** : 95,00 €
- **Nouvel acompte requis (30%)** : 28,50 € (95 × 0.3 = 28.50)
- **Caution déjà payée** : 800,00 € (PRÉSERVÉE, ne change pas)
- **Nouveau solde restant à payer** : 66,50 € (95 - 28.50 = 66.50)

---

## Calculs Détaillés

### 1. Calcul du Nouvel Acompte
```
Nouveau prix = 95,00 €
Nouvel acompte (30%) = 95 × 0.3 = 28,50 €
```

### 2. Calcul de la Différence d'Acompte
```
Différence = Nouvel acompte - Ancien acompte
Différence = 28,50 € - 57,00 € = -28,50 €
```

**Signification :**
- Le signe **négatif (-)** indique qu'il y aura un **remboursement**
- Le client a payé **57,00 €** d'acompte
- Il ne devrait payer que **28,50 €** d'acompte pour le nouveau prix
- Donc il doit être **remboursé de 28,50 €**

### 3. Calcul du Nouveau Solde à Payer
```
Nouveau solde = Nouveau prix total - Nouvel acompte
Nouveau solde = 95,00 € - 28,50 € = 66,50 €
```

**Signification :**
- Le client devra payer **66,50 €** à la remise du véhicule
- C'est le montant restant après avoir payé l'acompte de 28,50 €

---

## Récapitulatif Financier

### Avant Modification
| Élément | Montant |
|---------|---------|
| Prix total de la location | 190,00 € |
| Acompte payé (30%) | 57,00 € |
| Caution payée | 800,00 € |
| **Solde à payer à la remise** | **133,00 €** |
| **Total payé jusqu'à présent** | **857,00 €** (57 + 800) |

### Après Modification
| Élément | Montant |
|---------|---------|
| Prix total de la location | 95,00 € |
| Nouvel acompte requis (30%) | 28,50 € |
| Caution payée (préservée) | 800,00 € |
| **Solde à payer à la remise** | **66,50 €** |
| **Remboursement à recevoir** | **28,50 €** |

---

## Ce qui se Passe

### 1. Remboursement de 28,50 €
- Le client a payé **57,00 €** d'acompte
- Il ne devrait payer que **28,50 €** d'acompte
- **Différence à rembourser : 28,50 €**
- Ce remboursement sera effectué **après validation admin** via Stripe
- Délai : 5-10 jours ouvrés

### 2. Caution Préservée
- La caution de **800,00 €** a déjà été payée
- Elle **ne change pas** et **n'est pas remboursée**
- Elle sera toujours remboursée après restitution du véhicule sans dégâts

### 3. Nouveau Solde à Payer
- Après modification, le client devra payer **66,50 €** à la remise
- C'est moins qu'avant (133,00 €) car le prix total a diminué

---

## Workflow Complet

1. **Client modifie les dates** → Nouveau prix calculé : 95,00 €
2. **Système calcule** :
   - Nouvel acompte : 28,50 €
   - Différence : -28,50 € (remboursement)
   - Nouveau solde : 66,50 €
3. **Client soumet la demande** → Statut passe à `PENDING`
4. **Admin reçoit la notification** → Voit la demande de modification
5. **Admin valide** → Remboursement Stripe de 28,50 € créé automatiquement
6. **Client reçoit** :
   - Email de confirmation
   - Remboursement de 28,50 € sur sa carte (5-10 jours)
   - Nouvelle réservation avec solde de 66,50 € à payer

---

## Points Importants

 **La caution (800€) n'est jamais touchée** lors d'une modification
 **Seul l'acompte est ajusté** (30% du nouveau prix)
 **On ne refait JAMAIS payer l'acompte en entier** : on demande/se rembourse uniquement la différence
 **Le remboursement se fait automatiquement** après validation admin
 **Le nouveau solde est recalculé** automatiquement

### Exemple : Paiement Supplémentaire (Nouveau prix > Ancien prix)

Si le nouveau prix est **plus élevé** que l'ancien :
- **Ancien acompte payé** : 57,00 €
- **Nouvel acompte requis** : 75,00 €
- **Différence** : +18,00 €

**Le client ne paie PAS 75€**, il paie seulement **18€** (la différence) !
Le système ajoute automatiquement 18€ à l'ancien acompte de 57€ pour obtenir 75€.

---

## Pourquoi ces Montants ?

- **Prix actuel : 190€** → Location initiale (ex: 2 jours à 95€/jour)
- **Nouveau prix : 95€** → Nouvelle location (ex: 1 jour à 95€/jour)
- **Acompte actuel : 57€** → 30% de 190€
- **Nouvel acompte : 28,50€** → 30% de 95€
- **Différence : -28,50€** → Le client a payé 28,50€ de trop
- **Nouveau solde : 66,50€** → 95€ - 28,50€ = 66,50€ (ce qui reste à payer)

