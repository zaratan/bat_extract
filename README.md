# BatExtract - Extracteur OCR d'Images

Un outil TypeScript puissant pour extraire du texte depuis des images en utilisant l'OCR (Optical Character Recognition).

## 🚀 Fonctionnalités

- **OCR avancé** avec Tesseract.js
- **Préprocessing d'images** pour améliorer la qualité OCR
- **Support multi-langues** (français, anglais, etc.)
- **Traitement par lots** de plusieurs images
- **Export des résultats** en JSON
- **TypeScript** avec typage strict
- **ESLint et Prettier** pour la qualité du code

## 📦 Installation

```bash
# Cloner le projet
git clone <votre-repo>
cd bat_extract

# Installer les dépendances avec pnpm
pnpm install

# Compiler le projet
pnpm build
```

## 🛠 Utilisation

### Utilisation de base

```typescript
import { BatExtractor } from './src/batExtractor';

const extractor = new BatExtractor('./temp_images');

// Initialisation
await extractor.initialize('fra'); // ou 'eng' pour l'anglais

// Extraction simple
const result = await extractor.extractFromImage('path/to/image.jpg');
console.log('Texte extrait:', result.text);
console.log('Confiance:', result.confidence);

// Nettoyage
await extractor.cleanup();
```

### Avec préprocessing d'image

```typescript
const result = await extractor.extractFromImage('path/to/image.jpg', {
  preprocess: true,
  imageOptions: {
    enhance: true, // Améliore la netteté
    grayscale: true, // Conversion en niveaux de gris
    resize: { width: 800 }, // Redimensionnement
  },
  ocrOptions: {
    language: 'fra',
  },
});
```

### Traitement de plusieurs images

```typescript
const imagePaths = ['image1.jpg', 'image2.png', 'image3.tiff'];

const results = await extractor.extractFromMultipleImages(imagePaths, {
  preprocess: true,
});

// Sauvegarde des résultats
await extractor.saveResults(results, 'extracted_text.json');
```

## 🔧 Scripts disponibles

```bash
# Développement avec hot-reload
pnpm dev

# Build du projet
pnpm build

# Démarrage en production
pnpm start

# Linting
pnpm lint
pnpm lint:fix

# Formatage du code
pnpm format
pnpm format:check

# Nettoyage des fichiers de build
pnpm clean
```

## 📁 Structure du projet

```
src/
├── batExtractor.ts    # Classe principale
├── imageProcessor.ts  # Traitement d'images
├── ocrEngine.ts      # Moteur OCR
├── types.ts          # Types TypeScript
├── index.ts          # Exemple d'utilisation
└── main.ts           # Exports principaux
```

## 🌍 Langues supportées

- Français (`fra`)
- Anglais (`eng`)
- Et bien d'autres langues supportées par Tesseract

## 📋 Formats d'images supportés

- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff)
- WebP (.webp)

## 🔍 API

### BatExtractor

#### `initialize(language?: string)`

Initialise l'extracteur avec la langue spécifiée.

#### `extractFromImage(imagePath, options?)`

Extrait le texte d'une seule image.

#### `extractFromMultipleImages(imagePaths, options?)`

Extrait le texte de plusieurs images.

#### `saveResults(results, outputPath)`

Sauvegarde les résultats dans un fichier JSON.

#### `cleanup()`

Nettoie les fichiers temporaires et ferme l'OCR.

### Types

```typescript
interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}
```

## 🧪 Exemple complet

Voir le fichier `src/index.ts` pour un exemple complet d'utilisation.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence ISC.

## 🔧 Technologies utilisées

- **TypeScript** - Langage principal
- **Tesseract.js** - OCR
- **Sharp** - Traitement d'images
- **ESLint** - Linting
- **Prettier** - Formatage du code
- **pnpm** - Gestionnaire de packages
