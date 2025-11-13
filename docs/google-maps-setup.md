# Configuration Google Maps API

## Erreur : RefererNotAllowedMapError

Si vous voyez l'erreur `RefererNotAllowedMapError` dans la console, cela signifie que l'URL de votre site n'est pas autorisée dans les restrictions de référents de votre clé API Google Maps.

## Solution : Autoriser les URLs dans Google Cloud Console

### Étapes à suivre :

1. **Accéder à Google Cloud Console**
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Sélectionnez votre projet

2. **Accéder aux Credentials**
   - Dans le menu de gauche, allez dans **APIs & Services** > **Credentials**
   - Trouvez votre clé API (celle utilisée dans `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
   - Cliquez sur la clé pour l'éditer

3. **Configurer les restrictions HTTP referrers**
   - Dans la section **Application restrictions**, sélectionnez **HTTP referrers (web sites)**
   - Cliquez sur **+ ADD AN ITEM** pour ajouter des URLs

4. **Ajouter les URLs autorisées**
   Ajoutez les URLs suivantes (une par ligne) :
   ```
   http://localhost:3000/*
   http://localhost:3000/vehicles*
   http://localhost:3000/*
   https://votre-domaine.com/*
   https://*.votre-domaine.com/*
   ```

   **Important :**
   - Utilisez `*` comme wildcard pour autoriser toutes les pages sous un chemin
   - Pour le développement local, ajoutez `http://localhost:3000/*`
   - Pour la production, ajoutez votre domaine avec `https://`

5. **Sauvegarder**
   - Cliquez sur **SAVE**
   - Attendez quelques minutes pour que les changements prennent effet

## URLs recommandées pour le développement

```
http://localhost:3000/*
http://127.0.0.1:3000/*
```

## URLs recommandées pour la production

```
https://votre-domaine.com/*
https://*.votre-domaine.com/*
```

## Vérification

Après avoir sauvegardé les changements :
1. Attendez 2-3 minutes
2. Rechargez votre page (`http://localhost:3000/vehicles`)
3. L'erreur devrait disparaître

## Note importante

- Les restrictions de référents sont une mesure de sécurité importante
- Ne supprimez pas toutes les restrictions (cela exposerait votre clé API)
- Utilisez des wildcards (`*`) pour autoriser plusieurs pages sans les lister toutes

