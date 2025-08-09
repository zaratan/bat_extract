import { MultiSpeciesExtractor } from './multiSpeciesExtractor';

/**
 * Point d'entrée principal pour l'extraction multi-espèces
 */
async function main(): Promise<void> {
  try {
    console.log("🦇 Démarrage de l'extraction multi-espèces...");
    const extractor = new MultiSpeciesExtractor();
    await extractor.extractAllSpecies();
    console.log('✅ Extraction terminée avec succès!');
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction:", error);
    process.exit(1);
  }
}

// Exécuter uniquement si ce fichier est directement appelé
if (require.main === module) {
  main();
}

export { main };
