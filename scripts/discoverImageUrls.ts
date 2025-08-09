#!/usr/bin/env tsx

/**
 * Script pour découvrir les vraies URLs des images de cartes de distribution
 * en analysant les pages de détail de chaque espèce
 */

import { ImageUrlDiscoverer } from '../src/discoverImageUrls.js';

async function main(): Promise<void> {
  try {
    const discoverer = new ImageUrlDiscoverer();
    const results = await discoverer.discoverImageUrls();
    await discoverer.generateReport(results);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
