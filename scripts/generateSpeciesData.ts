#!/usr/bin/env ts-node

/**
 * Script de génération automatique des données d'espèces de chauves-souris
 * Scrape le site https://plan-actions-chiropteres.fr pour extraire toutes les espèces
 */

import { SpeciesDataGenerator } from '../src/generateSpeciesData';

async function main(): Promise<void> {
  const generator = new SpeciesDataGenerator();

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
