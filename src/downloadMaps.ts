#!/usr/bin/env ts-node

/**
 * Script pour télécharger automatiquement les cartes de distribution
 * de toutes les espèces de chauves-souris françaises
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  mergeConfig,
  type DefaultConfig,
  type DeepPartial,
} from './config/defaultConfig.js';
import { runWithConcurrency } from './utils/concurrency.js';

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

/**
 * Charge les données d'espèces depuis le fichier JSON généré
 */
async function loadSpeciesData(outputDir: string): Promise<BatSpecies[]> {
  try {
    const filePath = join(
      process.cwd(),
      outputDir,
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
async function loadDiscoveredUrls(
  outputDir: string
): Promise<{ [slug: string]: string }> {
  try {
    const filePath = join(
      process.cwd(),
      outputDir,
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
function getSpeciesImageUrl(slug: string, cfg: DefaultConfig): string {
  // Fallback pattern basé sur config
  const pattern = cfg.images.fileNamePattern
    .replace(/\{slug\}/g, slug)
    .replace('{resolution}', cfg.images.resolutionSuffix);
  return `${cfg.sources.baseUrl}/wp-content/uploads/2024/11/${pattern}`; // TODO: année/mois potentiellement à configurer plus tard
}

/**
 * Obtient l'URL d'image pour une espèce (découverte ou pattern par défaut)
 */
async function getImageUrl(
  slug: string,
  outputDir: string,
  cfg: DefaultConfig
): Promise<string> {
  const discovered = await loadDiscoveredUrls(outputDir);
  return discovered[slug] || getSpeciesImageUrl(slug, cfg);
}

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(
  url: string,
  filePath: string,
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
    await writeFile(filePath, buffer);
    console.log(
      `   ✅ Téléchargée: ${filePath.split('/').pop()} (${(buffer.length / 1024).toFixed(1)} KB)`
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
function generateFileName(slug: string, cfg: DefaultConfig): string {
  return cfg.images.fileNamePattern
    .replace(/\{slug\}/g, slug)
    .replace('{resolution}', cfg.images.resolutionSuffix);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, ms);
  });
}

async function downloadAllMapsInternal(cfg: DefaultConfig): Promise<void> {
  const imagesDir = join(process.cwd(), cfg.paths.imagesDir);
  const outputDir = cfg.paths.outputDir;
  const delayMs = cfg.network.requestDelayMs;
  const species = await loadSpeciesData(outputDir);
  console.log(
    `🦇 Début du téléchargement de ${species.length} cartes de distribution\n`
  );
  if (!existsSync(imagesDir)) {
    await mkdir(imagesDir, { recursive: true });
    console.log(`📁 Dossier créé: ${imagesDir}\n`);
  }
  const limit = Math.max(1, cfg.parallel.maxConcurrentDownloads || 1);
  if (limit > 1) {
    console.log(
      `⚙️  Mode parallèle limité: ${limit} téléchargements simultanés`
    );
  }
  let successCount = 0;
  let errorCount = 0;
  if (limit === 1) {
    for (let i = 0; i < species.length; i++) {
      const currentSpecies = species[i];
      const filename = generateFileName(currentSpecies.slug, cfg);
      const filePath = join(imagesDir, filename);
      console.log(`[${i + 1}/${species.length}] ${currentSpecies.name}`);
      if (existsSync(filePath)) {
        console.log('   ⏭️  Fichier déjà présent, passage au suivant');
      } else {
        const imageUrl = await getImageUrl(currentSpecies.slug, outputDir, cfg);
        console.log(`   🔗 URL: ${imageUrl}`);
        const success = await downloadImage(
          imageUrl,
          filePath,
          currentSpecies.name
        );
        if (success) successCount++;
        else errorCount++;
      }
      if (i < species.length - 1) await delay(delayMs);
      console.log('');
    }
  } else {
    await runWithConcurrency(species, limit, async (currentSpecies, index) => {
      const filename = generateFileName(currentSpecies.slug, cfg);
      const filePath = join(imagesDir, filename);
      console.log(`[${index + 1}/${species.length}] ${currentSpecies.name}`);
      if (existsSync(filePath)) {
        console.log('   ⏭️  Fichier déjà présent, passage au suivant');
        return;
      }
      const imageUrl = await getImageUrl(currentSpecies.slug, outputDir, cfg);
      console.log(`   🔗 URL: ${imageUrl}`);
      const success = await downloadImage(
        imageUrl,
        filePath,
        currentSpecies.name
      );
      if (success) successCount++;
      else errorCount++;
    });
  }
  console.log('🦇 ================================');
  console.log('🦇 RAPPORT DE TÉLÉCHARGEMENT');
  console.log('🦇 ================================');
  console.log(`📊 Total: ${species.length}`);
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Dossier: ${imagesDir}`);
}

async function downloadPriorityMapsInternal(cfg: DefaultConfig): Promise<void> {
  const imagesDir = join(process.cwd(), cfg.paths.imagesDir);
  const outputDir = cfg.paths.outputDir;
  const delayMs = cfg.network.requestDelayMs;
  const allSpecies = await loadSpeciesData(outputDir);
  const prioritySpecies = allSpecies.filter(s => s.isPriority);
  console.log(
    `🎯 Téléchargement des espèces prioritaires (${prioritySpecies.length} sur ${allSpecies.length})\n`
  );
  if (!existsSync(imagesDir)) {
    await mkdir(imagesDir, { recursive: true });
    console.log(`📁 Dossier créé: ${imagesDir}\n`);
  }
  const limit = Math.max(1, cfg.parallel.maxConcurrentDownloads || 1);
  if (limit > 1) {
    console.log(
      `⚙️  Mode parallèle limité: ${limit} téléchargements simultanés`
    );
  }
  let successCount = 0;
  let errorCount = 0;
  if (limit === 1) {
    for (let i = 0; i < prioritySpecies.length; i++) {
      const currentSpecies = prioritySpecies[i];
      const filename = generateFileName(currentSpecies.slug, cfg);
      const filePath = join(imagesDir, filename);
      console.log(
        `[${i + 1}/${prioritySpecies.length}] ${currentSpecies.name} 🎯`
      );
      if (existsSync(filePath)) {
        console.log('   ⏭️  Fichier déjà présent, passage au suivant');
      } else {
        const imageUrl = await getImageUrl(currentSpecies.slug, outputDir, cfg);
        console.log(`   🔗 URL: ${imageUrl}`);
        const success = await downloadImage(
          imageUrl,
          filePath,
          currentSpecies.name
        );
        if (success) successCount++;
        else errorCount++;
      }
      if (i < prioritySpecies.length - 1) await delay(delayMs);
      console.log('');
    }
  } else {
    await runWithConcurrency(
      prioritySpecies,
      limit,
      async (currentSpecies, index) => {
        const filename = generateFileName(currentSpecies.slug, cfg);
        const filePath = join(imagesDir, filename);
        console.log(
          `[${index + 1}/${prioritySpecies.length}] ${currentSpecies.name} 🎯`
        );
        if (existsSync(filePath)) {
          console.log('   ⏭️  Fichier déjà présent, passage au suivant');
          return;
        }
        const imageUrl = await getImageUrl(currentSpecies.slug, outputDir, cfg);
        console.log(`   🔗 URL: ${imageUrl}`);
        const success = await downloadImage(
          imageUrl,
          filePath,
          currentSpecies.name
        );
        if (success) successCount++;
        else errorCount++;
      }
    );
  }
  console.log('🦇 ================================');
  console.log('🦇 RAPPORT DE TÉLÉCHARGEMENT');
  console.log('🦇 ================================');
  console.log(`📊 Total: ${prioritySpecies.length}`);
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Dossier: ${imagesDir}`);
}

/**
 * Classe wrapper pour le téléchargement de cartes (configurable)
 */
export class MapDownloader {
  private readonly config: DefaultConfig;
  constructor(cfg?: DeepPartial<DefaultConfig>) {
    this.config = mergeConfig(cfg);
  }
  async downloadAllMaps(): Promise<void> {
    return downloadAllMapsInternal(this.config);
  }
  async downloadPriorityMaps(): Promise<void> {
    return downloadPriorityMapsInternal(this.config);
  }
}

// Le script d'exécution est maintenant dans scripts/downloadMaps.ts
