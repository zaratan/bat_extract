import { BatExtractor } from './batExtractor';

async function demo(): Promise<void> {
  const extractor = new BatExtractor('./temp_images');

  try {
    console.log("🚀 Démo BatExtract - Extracteur OCR d'images");
    console.log('============================================');

    // Initialisation
    console.log('📋 Initialisation...');
    await extractor.initialize('fra');

    // Test avec l'image des chauves-souris
    const imagePath =
      './images/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png';

    console.log(`🔍 Extraction du texte de: ${imagePath}`);

    // Test sans préprocessing
    console.log('📄 Extraction simple...');
    const simpleResult = await extractor.extractFromImage(imagePath);
    console.log('Texte extrait:', simpleResult.text);
    console.log('Confiance:', `${simpleResult.confidence.toFixed(2)}%`);

    // Test avec préprocessing
    console.log('🎨 Extraction avec préprocessing...');
    const enhancedResult = await extractor.extractFromImage(imagePath, {
      preprocess: true,
      imageOptions: {
        enhance: true,
        grayscale: true,
        resize: { width: 800 },
      },
    });
    console.log('Texte extrait (amélioré):', enhancedResult.text);
    console.log(
      'Confiance (amélioré):',
      `${enhancedResult.confidence.toFixed(2)}%`
    );

    // Sauvegarde des résultats
    await extractor.saveResults(
      [simpleResult, enhancedResult],
      'demo_results.json'
    );

    console.log('✅ Démo terminée !');
    console.log('� Résultats sauvegardés dans demo_results.json');
  } catch (error) {
    console.error(
      '❌ Erreur:',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await extractor.cleanup();
  }
}

// Exécution de la démo
if (require.main === module) {
  demo().catch(console.error);
}
