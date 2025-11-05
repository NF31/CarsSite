# Structure NextAuth v5 - Explication

## Pourquoi `auth.ts` et `auth.config.ts` à la racine ?

NextAuth v5 (beta) utilise une structure spécifique recommandée par la documentation officielle :

### 1. **Convention NextAuth v5**
- NextAuth v5 recommande de mettre `auth.ts` et `auth.config.ts` à la **racine du projet**
- C'est la structure standard pour faciliter les imports et la configuration

### 2. **Middleware Next.js**
- Le `middleware.ts` (qui doit être à la racine) importe directement `auth` depuis la racine
- Cela simplifie les imports : `import { auth } from "@/auth"` au lieu de `import { auth } from "@/lib/auth"`
- Le middleware Next.js s'exécute avant le routing, donc il a besoin d'un chemin simple

### 3. **Séparation des responsabilités**
- `auth.config.ts` : Configuration (providers, callbacks, pages) - peut être importé partout
- `auth.ts` : Instance NextAuth avec handlers exportés - utilisé par le middleware et les routes API

### 4. **Alternative : Déplacer dans `lib/`**
Si vous préférez avoir tout dans `lib/`, c'est possible mais il faut :
- Mettre à jour tous les imports
- Mettre à jour le middleware
- Mettre à jour les routes API

**Recommandation** : Garder à la racine (convention NextAuth v5)

