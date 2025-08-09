# Script de téléchargement de cartes de distribution

## Description

Le script `downloadMaps.ts` télécharge automatiquement les cartes de distribution de toutes les espèces de chauves-souris françaises depuis le site du Plan National d'Actions Chiroptères.

## Workflow recommandé

### 1. Découvrir les vraies URLs d'images

```bash
pnpm discover-urls
```

Ce script analyse chaque page d'espèce pour extraire les vraies URLs des cartes de distribution et sauvegarde les résultats dans `data/discovered-image-urls.json`.

### 2. Télécharger les cartes

```bash
# Toutes les espèces (36)
pnpm download

# Espèces prioritaires uniquement (17)
pnpm download:priority
```

Le script de téléchargement utilise automatiquement les URLs découvertes si elles existent, sinon il utilise un pattern par défaut.

## Fonctionnalités

- ✅ **Téléchargement automatique** depuis les URLs construites à partir des données d'espèces
- ✅ **Gestion d'erreurs** avec rapports détaillés des échecs
- ✅ **Délai entre téléchargements** (1 seconde) pour éviter de surcharger le serveur
- ✅ **Création automatique** du dossier `/images`
- ✅ **Noms de fichiers standardisés** basés sur les slugs d'espèces
- ✅ **Rapport final** avec statistiques de succès/erreurs

## Format des noms de fichiers

Les images téléchargées suivent le pattern :

```
plan-actions-chiropteres.fr-{slug}-carte-{slug}-2048x1271.png
```

Exemples :

- `plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png`
- `plan-actions-chiropteres.fr-grand-murin-carte-grand-murin-2048x1271.png`

## Gestion des erreurs

Le script continue l'exécution même si certaines images échouent au téléchargement et produit un rapport final avec :

- Nombre de succès
- Nombre d'erreurs
- Liste détaillée des erreurs avec le nom de l'espèce et la raison

## Notes techniques

- Utilise `fetch` natif de Node.js (≥18)
- Sauvegarde dans le dossier `/images` (ignoré par git)
- Compatible avec l'extracteur existant qui analyse ces images
- Les images manquantes ou en erreur n'empêchent pas le traitement des autres

## Exemple de sortie

```
🦇 Téléchargement des 17 espèces prioritaires seulement

📁 Dossier créé: /Users/project/images

[1/17] Barbastelle d'Europe
✅ Sauvegardé: /Users/project/images/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png

[2/17] Grand Murin
❌ Erreur: HTTP 404: Not Found

🎯 RAPPORT FINAL
================
✅ Succès: 16
❌ Erreurs: 1
📊 Total: 17

📋 DÉTAILS DES ERREURS:
• Grand Murin: HTTP 404: Not Found
```
