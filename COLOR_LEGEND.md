# Légende des couleurs - Plan National d'Actions Chiroptères

Ce document décrit le mapping entre les couleurs utilisées sur les cartes de distribution et les statuts de présence des espèces de chauves-souris.

## Correspondance couleurs → statuts

| Couleur | Code Hex | Statut | Description |
|---------|----------|--------|-------------|
| 🔴 Rouge | `#ea5257` | **Très rarement inventoriée** | Espèce actuellement très rarement inventoriée ou exceptionnellement observée |
| 🟠 Orange | `#f7a923` | **Rare ou assez rare** | Espèce actuellement rare ou assez rare |
| 🟢 Vert clair | `#dbe7b0` | **Peu commune** | Espèce peu commune ou localement commune |
| 🟢 Vert foncé | `#95cb9b` | **Assez commune** | Espèce assez commune à très commune |
| 🟡 Jaune | `#ffef23` | **Présente mais mal connue** | Espèce présente mais mal connue |
| ⚫ Gris | `#b0b1b3` | **Disparue** | Espèce disparue ou non retrouvée sur la zone |
| ⚪ Blanc/Écru | `#fffdea`, `#fefefe` | **Absente** | Espèce absente, n'ayant jamais été trouvée |

## Couleurs observées dans les données

D'après l'analyse des cartes téléchargées, voici les couleurs effectivement présentes :

- `#ea5257` - Rouge (très rarement inventoriée)
- `#f7a923` - Orange (rare ou assez rare)  
- `#dbe7b0` - Vert clair (peu commune ou localement commune)
- `#95cb9b` - Vert foncé (assez commune à très commune)
- `#ffef23` - Jaune (présente mais mal connue)
- `#b0b1b3` - Gris (disparue ou non retrouvée)
- `#fffdea` - Blanc/Écru (absente)
- `#fefefe` - Blanc pur (absente)

## Utilisation dans le code

La fonction `inferDistributionStatus()` dans `src/smartExtractor.ts` utilise des plages de tolérance RGB pour identifier chaque couleur et assigner le statut correspondant.

### Exemple de plages de tolérance :

```typescript
// Rouge (#ea5257): Très rarement inventoriée
if (r >= 230 && r <= 240 && g >= 80 && g <= 90 && b >= 85 && b <= 95) {
  return 'très rarement inventoriée';
}
```

Ces plages permettent de gérer les variations mineures de couleur dues à la compression JPEG ou aux variations d'affichage.
