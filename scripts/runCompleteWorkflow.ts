#!/usr/bin/env tsx

/**
 * Script d'exécution du workflow complet BatExtract
 * Orchestre toutes les étapes : génération → découverte → téléchargement → extraction → rapport
 */

import { BatExtractWorkflow } from '../src/runCompleteWorkflow.js';

async function main(): Promise<void> {
  const workflow = new BatExtractWorkflow();

  try {
    await workflow.runCompleteWorkflow();
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
