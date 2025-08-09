#!/usr/bin/env ts-node

/**
 * Script pour télécharger automatiquement les cartes de distribution
 * de toutes les espèces de chauves-souris françaises
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { BAT_SPECIES, getSpeciesImageUrl } from './species-data';
import { existsSync } from 'fs';

const IMAGES_DIR = join(process.cwd(), 'images');
const DOWNLOAD_DELAY = 1000; // 1 seconde entre chaque téléchargement
const DISCOVERED_URLS_FILE = join(
  process.cwd(),
  'data',
  'discovered-image-urls.json'
);

/**
 * Cache des URLs découvertes
 */
let discoveredUrls: Record<string, string> | null = null;

/**
 * Charge les URLs découvertes depuis le fichier JSON
 */
async function loadDiscoveredUrls(): Promise<Record<string, string>> {
  if (discoveredUrls !== null) {
    return discoveredUrls;
  }

  try {
    if (existsSync(DISCOVERED_URLS_FILE)) {
      const content = await readFile(DISCOVERED_URLS_FILE, 'utf-8');
      const data = JSON.parse(content);
      discoveredUrls = data.validImageUrls || {};
      console.log(
        `📋 ${Object.keys(discoveredUrls).length} URLs découvertes chargées`
      );
    } else {
      discoveredUrls = {};
      console.log(
        "⚠️  Aucun fichier d'URLs découvertes trouvé, utilisation du pattern par défaut"
      );
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des URLs découvertes:', error);
    discoveredUrls = {};
  }

  return discoveredUrls;
}

/**
 * Obtient l'URL d'image pour une espèce (découverte ou pattern par défaut)
 */
async function getImageUrl(slug: string): Promise<string> {
  const discovered = await loadDiscoveredUrls();
  return discovered[slug] || getSpeciesImageUrl(slug);
}

/**
 * Télécharge une image depuis une URL en utilisant fetch natif
 */
async function downloadImage(url: string, filepath: string): Promise<void> {
  try {
    console.log(`Téléchargement: ${url}`);

    // Utiliser le fetch natif de Node.js 18+
    const response = await globalThis.fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));

    console.log(`✅ Sauvegardé: ${filepath}`);
  } catch (error) {
    console.error(`❌ Erreur pour ${url}:`, error);
    throw error;
  }
}

/**
 * Génère le nom de fichier pour une espèce
 */
function generateFilename(slug: string): string {
  return `plan-actions-chiropteres.fr-${slug}-carte-${slug}-2048x1271.png`;
}

/**
 * Pause l'exécution pendant un délai donné
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, ms);
  });
}

/**
 * Télécharge toutes les cartes de distribution
 */
async function downloadAllMaps(): Promise<void> {
  console.log(
    `🦇 Début du téléchargement de ${BAT_SPECIES.length} cartes de distribution\n`
  );

  // Créer le dossier images s'il n'existe pas
  try {
    await mkdir(IMAGES_DIR, { recursive: true });
    console.log(`📁 Dossier créé: ${IMAGES_DIR}\n`);
  } catch {
    // Le dossier existe déjà
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: { species: string; error: string }[] = [];

  for (let i = 0; i < BAT_SPECIES.length; i++) {
    const species = BAT_SPECIES[i];
    const imageUrl = await getImageUrl(species.slug);
    const filename = generateFilename(species.slug);
    const filepath = join(IMAGES_DIR, filename);

    console.log(`[${i + 1}/${BAT_SPECIES.length}] ${species.name}`);

    try {
      await downloadImage(imageUrl, filepath);
      successCount++;
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push({
        species: species.name,
        error: errorMessage,
      });
    }

    // Pause entre les téléchargements pour éviter de surcharger le serveur
    if (i < BAT_SPECIES.length - 1) {
      await delay(DOWNLOAD_DELAY);
    }

    console.log(''); // Ligne vide pour la lisibilité
  }

  // Rapport final
  console.log('🎯 RAPPORT FINAL');
  console.log('================');
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📊 Total: ${BAT_SPECIES.length}`);

  if (errors.length > 0) {
    console.log('\n📋 DÉTAILS DES ERREURS:');
    errors.forEach(({ species, error }) => {
      console.log(`• ${species}: ${error}`);
    });
  }

  console.log(`\n📁 Images sauvegardées dans: ${IMAGES_DIR}`);
}

/**
 * Télécharge uniquement les cartes des espèces prioritaires
 */
async function downloadPriorityMaps(): Promise<void> {
  const prioritySpecies = BAT_SPECIES.filter(species => species.isPriority);

  console.log(
    `🦇 Téléchargement des ${prioritySpecies.length} espèces prioritaires seulement\n`
  );

  // Temporairement remplacer la liste complète
  const originalSpecies = [...BAT_SPECIES];
  BAT_SPECIES.length = 0;
  BAT_SPECIES.push(...prioritySpecies);

  try {
    await downloadAllMaps();
  } finally {
    // Restaurer la liste complète
    BAT_SPECIES.length = 0;
    BAT_SPECIES.push(...originalSpecies);
  }
}

/**
 * Script principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const priorityOnly = args.includes('--priority') || args.includes('-p');

  try {
    if (priorityOnly) {
      await downloadPriorityMaps();
    } else {
      await downloadAllMaps();
    }
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
const isMainModule =
  process.argv[1] && process.argv[1].includes('downloadMaps');
if (isMainModule) {
  main().catch(console.error);
}

export { downloadAllMaps, downloadPriorityMaps, downloadImage };
