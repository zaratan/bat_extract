#!/usr/bin/env ts-node

/**
 * Script pour télécharger automatiquement les cartes de distribution
 * de toutes les espèces de chauves-souris françaises
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface BatSpecies {
  name: string;
  slug: string;
  pageUrl: string;
  isPriority: boolean;
}

interface SpeciesDataFile {
  metadata: {
    generatedAt: string;
    source: string;
    totalSpecies: number;
    prioritySpecies: number;
  };
  species: BatSpecies[];
}

interface DiscoveredUrls {
  validImageUrls: { [slug: string]: string };
}

const IMAGES_DIR = join(process.cwd(), 'images');
const DOWNLOAD_DELAY = 1000; // 1 seconde entre chaque téléchargement

/**
 * Charge les données d'espèces depuis le fichier JSON généré
 */
async function loadSpeciesData(): Promise<BatSpecies[]> {
  try {
    const filePath = join(
      process.cwd(),
      'output',
      'generated-species-data.json'
    );
    const content = await readFile(filePath, 'utf-8');
    const data: SpeciesDataFile = JSON.parse(content);
    return data.species;
  } catch (error) {
    console.error("❌ Impossible de charger les données d'espèces:", error);
    console.log("💡 Exécutez d'abord: pnpm generate-species");
    process.exit(1);
  }
}

/**
 * Charge les URLs découvertes depuis le fichier JSON
 */
async function loadDiscoveredUrls(): Promise<{ [slug: string]: string }> {
  try {
    const filePath = join(
      process.cwd(),
      'output',
      'discovered-image-urls.json'
    );
    const content = await readFile(filePath, 'utf-8');
    const data: DiscoveredUrls = JSON.parse(content);
    return data.validImageUrls || {};
  } catch {
    console.warn(
      '⚠️  Impossible de charger les URLs découvertes, utilisation du pattern de fallback'
    );
    return {};
  }
}

/**
 * Génère l'URL de fallback pour une espèce (pattern observé)
 */
function getSpeciesImageUrl(slug: string): string {
  return `https://plan-actions-chiropteres.fr/wp-content/uploads/2024/11/plan-actions-chiropteres.fr-${slug}-carte-${slug}-2048x1271.png`;
}

/**
 * Obtient l'URL d'image pour une espèce (découverte ou pattern par défaut)
 */
async function getImageUrl(slug: string): Promise<string> {
  const discovered = await loadDiscoveredUrls();
  return discovered[slug] || getSpeciesImageUrl(slug);
}

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(
  url: string,
  filename: string,
  _speciesName: string
): Promise<boolean> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.log(
        `   ❌ Erreur HTTP ${response.status}: ${response.statusText}`
      );
      return false;
    }

    if (!response.body) {
      console.log('   ❌ Pas de contenu dans la réponse');
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = join(IMAGES_DIR, filename);

    await writeFile(filePath, buffer);
    console.log(
      `   ✅ Téléchargée: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`
    );
    return true;
  } catch (error) {
    console.log(`   ❌ Erreur de téléchargement: ${error}`);
    return false;
  }
}

/**
 * Génère le nom de fichier standardisé pour une espèce
 */
function generateFileName(slug: string): string {
  return `plan-actions-chiropteres.fr-${slug}-carte-${slug}-2048x1271.png`;
}

/**
 * Affiche une pause avec décompte
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
  // Charger les données d'espèces
  const species = await loadSpeciesData();

  console.log(
    `🦇 Début du téléchargement de ${species.length} cartes de distribution\n`
  );

  // Créer le dossier images s'il n'existe pas
  if (!existsSync(IMAGES_DIR)) {
    await mkdir(IMAGES_DIR, { recursive: true });
    console.log(`📁 Dossier créé: ${IMAGES_DIR}\n`);
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < species.length; i++) {
    const currentSpecies = species[i];
    const filename = generateFileName(currentSpecies.slug);
    const filePath = join(IMAGES_DIR, filename);

    console.log(`[${i + 1}/${species.length}] ${currentSpecies.name}`);

    // Vérifier si le fichier existe déjà
    if (existsSync(filePath)) {
      console.log('   ⏭️  Fichier déjà présent, passage au suivant');
    } else {
      // Télécharger l'image
      const imageUrl = await getImageUrl(currentSpecies.slug);
      console.log(`   🔗 URL: ${imageUrl}`);

      const success = await downloadImage(
        imageUrl,
        filename,
        currentSpecies.name
      );
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    // Pause entre les téléchargements
    if (i < species.length - 1) {
      await delay(DOWNLOAD_DELAY);
    }

    console.log(''); // Ligne vide pour la lisibilité
  }

  // Rapport final
  console.log('🦇 ================================');
  console.log('🦇 RAPPORT DE TÉLÉCHARGEMENT');
  console.log('🦇 ================================');
  console.log(`📊 Total: ${species.length}`);
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Dossier: ${IMAGES_DIR}`);
}

/**
 * Télécharge uniquement les espèces prioritaires
 */
async function downloadPriorityMaps(): Promise<void> {
  // Charger les données d'espèces et filtrer les prioritaires
  const allSpecies = await loadSpeciesData();
  const prioritySpecies = allSpecies.filter(species => species.isPriority);

  console.log(
    `🎯 Téléchargement des espèces prioritaires (${prioritySpecies.length} sur ${allSpecies.length})\n`
  );

  // Créer le dossier images s'il n'existe pas
  if (!existsSync(IMAGES_DIR)) {
    await mkdir(IMAGES_DIR, { recursive: true });
    console.log(`📁 Dossier créé: ${IMAGES_DIR}\n`);
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < prioritySpecies.length; i++) {
    const currentSpecies = prioritySpecies[i];
    const filename = generateFileName(currentSpecies.slug);
    const filePath = join(IMAGES_DIR, filename);

    console.log(
      `[${i + 1}/${prioritySpecies.length}] ${currentSpecies.name} 🎯`
    );

    // Vérifier si le fichier existe déjà
    if (existsSync(filePath)) {
      console.log('   ⏭️  Fichier déjà présent, passage au suivant');
    } else {
      // Télécharger l'image
      const imageUrl = await getImageUrl(currentSpecies.slug);
      console.log(`   🔗 URL: ${imageUrl}`);

      const success = await downloadImage(
        imageUrl,
        filename,
        currentSpecies.name
      );
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    // Pause entre les téléchargements
    if (i < prioritySpecies.length - 1) {
      await delay(DOWNLOAD_DELAY);
    }

    console.log(''); // Ligne vide pour la lisibilité
  }

  // Rapport final
  console.log('🦇 ================================');
  console.log('🦇 RAPPORT DE TÉLÉCHARGEMENT');
  console.log('🦇 ================================');
  console.log(`📊 Total: ${prioritySpecies.length}`);
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Dossier: ${IMAGES_DIR}`);
}

/**
 * Classe wrapper pour le téléchargement de cartes
 */
export class MapDownloader {
  async downloadAllMaps(): Promise<void> {
    return downloadAllMaps();
  }

  async downloadPriorityMaps(): Promise<void> {
    return downloadPriorityMaps();
  }
}

// Le script d'exécution est maintenant dans scripts/downloadMaps.ts
