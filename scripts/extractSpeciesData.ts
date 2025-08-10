#!/usr/bin/env tsx

/**
 * Script d'extraction des données de distribution multi-espèces
 * Analyse les cartes de distribution dans le dossier /images
 * et génère des fichiers JSON de résultats dans /output
 */

import { MultiSpeciesExtractor } from '../src/multiSpeciesExtractor.js';
import { resolveUserConfigFromProcess } from '../src/config/loadUserConfig.js';

async function main(): Promise<void> {
  try {
    console.log("🦇 Démarrage de l'extraction multi-espèces...");
    console.log('📁 Source: dossier /images');
    console.log('📁 Destination: dossier /output');
    console.log('');

    const userConfig = await resolveUserConfigFromProcess(
      process.argv.slice(2)
    );
    const extractor = new MultiSpeciesExtractor(undefined, userConfig);
    await extractor.extractAllSpecies();

    console.log('');
    console.log('✅ Extraction terminée avec succès!');
    console.log('📊 Les fichiers de résultats ont été générés dans /output');
    console.log('');
    console.log('💡 Prochaines étapes:');
    console.log('   - Consultez les fichiers *-distribution.json individuels');
    console.log('   - Générez le rapport Excel: pnpm excel');
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction:", error);
    process.exit(1);
  }
}

// Exécuter le script
main();
