#!/usr/bin/env tsx

/**
 * Script pour télécharger automatiquement les cartes de distribution
 * de toutes les espèces de chauves-souris françaises
 */

import { MapDownloader } from '../src/downloadMaps.js';
import { resolveUserConfigFromProcess } from '../src/config/loadUserConfig.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isPriorityMode = args.includes('--priority');

  try {
    const userConfig = await resolveUserConfigFromProcess(args);
    const downloader = new MapDownloader(userConfig);

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
