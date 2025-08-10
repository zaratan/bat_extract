#!/usr/bin/env tsx

/**
 * Script de génération de rapport Excel
 * Crée une matrice espèces × départements avec statuts de distribution
 */

import { ExcelReportGenerator } from '../src/generateExcelReport.js';
import { resolveUserConfigFromProcess } from '../src/config/loadUserConfig.js';

async function main(): Promise<void> {
  const userConfig = await resolveUserConfigFromProcess(process.argv.slice(2));
  const outputDir = userConfig?.paths?.outputDir; // si surchargé
  const generator = new ExcelReportGenerator(outputDir);

  try {
    console.log('🦇 Démarrage de la génération du rapport Excel...');
    await generator.generateReport();
    console.log('✅ Rapport Excel généré avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
