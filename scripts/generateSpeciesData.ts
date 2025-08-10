#!/usr/bin/env tsx

/**
 * Script de génération automatique des données d'espèces de chauves-souris
 * Scrape le site https://plan-actions-chiropteres.fr pour extraire toutes les espèces
 */

import { SpeciesDataGenerator } from '../src/generateSpeciesData.js';
import { resolveUserConfigFromProcess } from '../src/config/loadUserConfig.js';

async function main(): Promise<void> {
  const userConfig = await resolveUserConfigFromProcess(process.argv.slice(2));
  const generator = new SpeciesDataGenerator(userConfig);

  try {
    await generator.generateSpeciesData();
    console.log('');
    console.log('🎉 Génération terminée avec succès!');
    console.log('📄 Fichier créé: output/generated-species-data.json');
    console.log('');
    console.log('💡 Pour enrichir avec les noms latins (optionnel):');
    console.log('   Modifiez le script pour appeler enrichWithLatinNames()');
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
