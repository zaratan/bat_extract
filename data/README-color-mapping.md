# Correspondance des Couleurs de Légende

Ce fichier explique la correspondance entre les couleurs officielles du Plan National d'Actions Chiroptères et les statuts utilisés dans l'extraction.

## Structure du fichier `color-legend-mapping.ts`

### Interface `ColorLegendEntry`

Chaque entrée de la légende contient :
- `officialColor` : Le code couleur hexadécimal officiel
- `rgbRange` : Les plages RGB utilisées pour la détection (avec tolérance)
- `officialLabel` : Le libellé exact de la légende officielle
- `extractionStatus` : Le statut simplifié utilisé dans nos extractions
- `description` : Description détaillée du statut

### Couleurs et Statuts

| Couleur Officielle | Plage RGB | Libellé Officiel | Statut d'Extraction |
|---|---|---|---|
| `#ea5257` | R:230-240, G:80-90, B:85-95 | Espèce actuellement très rarement inventoriée ou exceptionnellement observée | `très rarement inventoriée` |
| `#f7a923` | R:245-250, G:165-175, B:30-40 | Espèce actuellement rare ou assez rare | `rare ou assez rare` |
| `#dbe7b0` | R:215-225, G:225-235, B:170-180 | Espèce peu commune ou localement commune | `peu commune ou localement commune` |
| `#95cb9b` | R:145-155, G:200-210, B:150-160 | Espèce assez commune à très commune | `assez commune à très commune` |
| `#ffef23` | R:250-255, G:235-245, B:30-40 | Espèce présente mais mal connue | `présente mais mal connue` |
| `#b0b1b3` | R:170-180, G:175-185, B:175-185 | Espèce disparue ou non retrouvée sur la zone | `disparue ou non retrouvée` |
| `#fffdea` | R:250-255, G:250-255, B:225-235 | Espèce absente, n'ayant jamais été trouvée | `absente` |
| `#fefefe` | R:250-255, G:250-255, B:250-255 | Espèce absente (variante blanche) | `absente` |

## Utilisation

### Dans `smartExtractor.ts`

```typescript
import { ColorLegendUtils } from '../data/color-legend-mapping';

// Obtenir le statut à partir des composants RGB
const status = ColorLegendUtils.getDistributionStatus(r, g, b);

// Obtenir l'entrée complète de la légende
const legendEntry = ColorLegendUtils.getLegendEntry(r, g, b);

// Vérifier si l'espèce est absente
const isAbsent = ColorLegendUtils.isAbsentStatus(r, g, b);

// Vérifier si la présence est confirmée
const isPresent = ColorLegendUtils.isPresenceConfirmed(r, g, b);
```

### Méthodes utilitaires disponibles

- `getDistributionStatus(r, g, b)` : Retourne le statut d'extraction
- `getLegendEntry(r, g, b)` : Retourne l'entrée complète de légende
- `getAllStatuses()` : Liste tous les statuts possibles
- `getColorToStatusMap()` : Dictionnaire couleur → statut
- `isAbsentStatus(r, g, b)` : Vérifie si l'espèce est absente
- `isPresenceConfirmed(r, g, b)` : Vérifie si la présence est confirmée

## Tolérance des couleurs

Les plages RGB incluent une tolérance pour tenir compte :
- Des variations de compression JPEG/PNG
- Des légers ajustements de couleur lors du traitement d'image
- Des variations d'affichage et de rendu

Cette tolérance assure une détection robuste tout en restant fidèle aux couleurs officielles.

## Source

Plan National d'Actions en faveur des Chiroptères 2016-2025  
Référence : https://plan-actions-chiropteres.fr/
