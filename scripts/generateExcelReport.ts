#!/usr/bin/env ts-node

/**
 * Script de génération de rapport Excel
 * Crée une matrice espèces × départements avec statuts de distribution
 */

import { ExcelReportGenerator } from '../src/generateExcelReport';

async function main(): Promise<void> {
  const generator = new ExcelReportGenerator();

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
