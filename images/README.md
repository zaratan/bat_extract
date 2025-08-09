# Dossier Images

Ce dossier est destiné à recevoir vos images de test pour l'extraction OCR.

## Formats supportés

- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff)
- WebP (.webp)

## Comment utiliser

1. Déposez vos images dans ce dossier
2. Modifiez le chemin dans `src/demo.ts` ou `src/index.ts`
3. Exemple : `'./images/mon-image.jpg'`

## Conseils pour de meilleurs résultats OCR

- Utilisez des images avec du texte net et contrasté
- Évitez les images floues ou avec beaucoup de bruit
- Les images en noir et blanc donnent souvent de meilleurs résultats
- Une résolution d'au moins 300 DPI est recommandée

## Exemples d'utilisation

```typescript
// Extraction simple
const result = await extractor.extractFromImage('./images/document.jpg');

// Extraction avec préprocessing
const result = await extractor.extractFromImage('./images/document.jpg', {
  preprocess: true,
  imageOptions: {
    enhance: true,
    grayscale: true,
    resize: { width: 800 },
  },
});
```
