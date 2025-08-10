#!/usr/bin/env tsx

/**
 * Script d'exécution du workflow complet BatExtract
 * Orchestre toutes les étapes : génération → découverte → téléchargement → extraction → rapport
 */

import { BatExtractWorkflow } from '../src/runCompleteWorkflow.js';
import { resolveUserConfigFromProcess } from '../src/config/loadUserConfig.js';

async function main(): Promise<void> {
  const userConfig = await resolveUserConfigFromProcess(process.argv.slice(2));
  const workflow = new BatExtractWorkflow(undefined, { config: userConfig });

  try {
    await workflow.runCompleteWorkflow();
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
