#!/usr/bin/env tsx

/**
 * Script pour découvrir les vraies URLs des images de cartes de distribution
 * en analysant les pages de détail de chaque espèce
 */

import { ImageUrlDiscoverer } from '../src/discoverImageUrls.js';
import { resolveUserConfigFromProcess } from '../src/config/loadUserConfig.js';

async function main(): Promise<void> {
  try {
    const userConfig = await resolveUserConfigFromProcess(
      process.argv.slice(2)
    );
    const discoverer = new ImageUrlDiscoverer(userConfig);
    const results = await discoverer.discoverImageUrls();
    await discoverer.generateReport(results);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
