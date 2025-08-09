import { BatExtractor } from './batExtractor';

async function main(): Promise<void> {
  const extractor = new BatExtractor('./temp_images');

  try {
    // Initialisation
    console.log('Initialisation de BatExtractor...');
    await extractor.initialize('fra'); // ou 'eng' pour l'anglais

    // Exemple 1: Extraction simple d'une image
    // const result = await extractor.extractFromImage('path/to/your/image.jpg');
    // console.log('Texte extrait:', result.text);
    // console.log('Confiance:', result.confidence);

    // Exemple 2: Extraction avec préprocessing
    // const resultWithPreprocessing = await extractor.extractFromImage(
    //   'path/to/your/image.jpg',
    //   {
    //     preprocess: true,
    //     imageOptions: {
    //       enhance: true,
    //       grayscale: true,
    //       resize: { width: 800 }
    //     },
    //     ocrOptions: {
    //       language: 'fra'
    //     }
    //   }
    // );

    // Exemple 3: Extraction de plusieurs images
    // const imagePaths = [
    //   'path/to/image1.jpg',
    //   'path/to/image2.png',
    //   'path/to/image3.tiff'
    // ];
    // const results = await extractor.extractFromMultipleImages(imagePaths, {
    //   preprocess: true
    // });

    // Sauvegarde des résultats
    // await extractor.saveResults(results, 'extracted_text.json');

    console.log('Extraction terminée avec succès!');
    console.log(
      "Pour utiliser ce script, décommentez les exemples ci-dessus et ajoutez vos chemins d'images."
    );
  } catch (error) {
    console.error(
      'Erreur:',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    // Nettoyage
    await extractor.cleanup();
  }
}

// Exécution si ce fichier est lancé directement
if (require.main === module) {
  main().catch(console.error);
}
