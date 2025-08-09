import { BatExtractor } from './batExtractor';

async function demo(): Promise<void> {
  const extractor = new BatExtractor('./temp_images');

  try {
    console.log("🚀 Démo BatExtract - Extracteur OCR d'images");
    console.log('============================================');

    // Initialisation
    console.log('📋 Initialisation...');
    await extractor.initialize('fra');

    // Si vous avez une image de test, décommentez et modifiez le chemin :
    /*
    const imagePath = 'path/to/your/test/image.jpg';
    
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
        resize: { width: 800 }
      }
    });
    console.log('Texte extrait (amélioré):', enhancedResult.text);
    console.log('Confiance (amélioré):', `${enhancedResult.confidence.toFixed(2)}%`);
    
    // Sauvegarde des résultats
    await extractor.saveResults([simpleResult, enhancedResult], 'demo_results.json');
    */

    console.log('✅ Démo terminée !');
    console.log('💡 Pour tester avec une vraie image :');
    console.log('   1. Ajoutez une image dans le dossier du projet');
    console.log('   2. Décommentez le code ci-dessus');
    console.log("   3. Modifiez le chemin de l'image");
    console.log('   4. Relancez avec: pnpm dev:demo');
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
