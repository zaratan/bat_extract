#!/usr/bin/env ts-node

/**
 * Script pour télécharger automatiquement les cartes de distribution
 * de toutes les espèces de chauves-souris françaises
 */

import { MapDownloader } from '../src/downloadMaps';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isPriorityMode = args.includes('--priority');

  try {
    const downloader = new MapDownloader();

    if (isPriorityMode) {
      await downloader.downloadPriorityMaps();
    } else {
      await downloader.downloadAllMaps();
    }

    console.log('\n🎉 Téléchargement terminé!');
  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
