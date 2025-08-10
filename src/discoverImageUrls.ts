#!/usr/bin/env ts-node

/**
 * Script pour découvrir les vraies URLs des images de cartes de distribution
 * en analysant les pages de détail de chaque espèce
 */

import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import {
  mergeConfig,
  type DefaultConfig,
  type DeepPartial,
} from './config/defaultConfig.js';

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

/**
 * Interface pour stocker les informations d'image trouvées
 */
interface ImageInfo {
  species: string;
  slug: string;
  pageUrl: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Extrait l'URL de l'image de carte depuis le HTML d'une page d'espèce
 */
function extractImageUrl(html: string, slug: string): string | null {
  // Patterns possibles pour les images de cartes
  const patterns = [
    // Pattern exact observé
    new RegExp(
      `plan-actions-chiropteres\\.fr-${slug}-carte-${slug}-\\d+x\\d+\\.png`,
      'i'
    ),
    // Pattern avec "carte" au début
    new RegExp(
      `plan-actions-chiropteres\\.fr-carte-${slug}-carte-${slug}-\\d+x\\d+\\.png`,
      'i'
    ),
    // Pattern simplifié
    new RegExp(`${slug}-carte-${slug}-\\d+x\\d+\\.png`, 'i'),
    // Pattern avec juste le nom
    new RegExp(`carte-${slug}-\\d+x\\d+\\.png`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      // Trouver l'URL complète contenant ce nom de fichier
      const fullUrlPattern = new RegExp(
        `https://[^"\\s]*${match[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        'i'
      );
      const fullMatch = html.match(fullUrlPattern);
      if (fullMatch) {
        return fullMatch[0];
      }
    }
  }

  // Fallback: chercher toute image avec "carte" dans le nom
  const cartePattern =
    /https:\/\/[^"\s]*\/wp-content\/uploads\/[^"\s]*carte[^"\s]*\.png/gi;
  const carteMatches = html.match(cartePattern);
  if (carteMatches && carteMatches.length > 0) {
    // Prendre la première qui contient le slug ou la plus probable
    const withSlug = carteMatches.find(url => url.includes(slug));
    return withSlug || carteMatches[0];
  }

  return null;
}

/**
 * Analyse une page d'espèce pour trouver l'URL de la carte
 */
async function analyzeSpeciesPage(species: BatSpecies): Promise<ImageInfo> {
  const info: ImageInfo = {
    species: species.name,
    slug: species.slug,
    pageUrl: species.pageUrl,
  };

  try {
    console.log(`🔍 Analyse: ${species.name}`);

    const response = await globalThis.fetch(species.pageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const imageUrl = extractImageUrl(html, species.slug);

    if (imageUrl) {
      info.imageUrl = imageUrl;
      console.log(`✅ Image trouvée: ${imageUrl}`);
    } else {
      info.error = 'Aucune image de carte trouvée';
      console.log(`❌ Aucune image trouvée pour ${species.name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    info.error = errorMessage;
    console.log(`❌ Erreur pour ${species.name}: ${errorMessage}`);
  }

  return info;
}

/**
 * Pause l'exécution pendant un délai donné
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, ms);
  });
}

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

async function discoverImageUrlsInternal(
  cfg: DefaultConfig
): Promise<ImageInfo[]> {
  const species = await loadSpeciesData(cfg.paths.outputDir);
  console.log(
    `🦇 Découverte des URLs d'images pour ${species.length} espèces\n`
  );
  const results: ImageInfo[] = [];
  const delayMs = cfg.network.requestDelayMs; // utilisation config centralisée
  for (let i = 0; i < species.length; i++) {
    const currentSpecies = species[i];
    console.log(`[${i + 1}/${species.length}] ${currentSpecies.name}`);
    const info = await analyzeSpeciesPage(currentSpecies);
    results.push(info);
    if (i < species.length - 1) {
      await delay(delayMs);
    }
    console.log('');
  }
  return results;
}

async function generateReportInternal(
  results: ImageInfo[],
  cfg: DefaultConfig
): Promise<void> {
  const successCount = results.filter(r => r.imageUrl).length;
  const errorCount = results.filter(r => r.error).length;
  console.log('🎯 RAPPORT DE DÉCOUVERTE');
  console.log('========================');
  console.log(`✅ Images trouvées: ${successCount}`);
  console.log(`❌ Erreurs/manquantes: ${errorCount}`);
  console.log(`📊 Total analysé: ${results.length}`);
  const outputPath = join(
    process.cwd(),
    cfg.paths.outputDir,
    'discovered-image-urls.json'
  );
  const reportData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalSpecies: results.length,
      imagesFound: successCount,
      errors: errorCount,
    },
    results: results.map(r => ({
      species: r.species,
      slug: r.slug,
      pageUrl: r.pageUrl,
      imageUrl: r.imageUrl || null,
      hasImage: !!r.imageUrl,
      error: r.error || null,
    })),
    validImageUrls: results
      .filter(r => r.imageUrl)
      .reduce(
        (acc, r) => {
          acc[r.slug] = r.imageUrl!;
          return acc;
        },
        {} as Record<string, string>
      ),
  };
  await writeFile(outputPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📁 Rapport sauvegardé: ${outputPath}`);
  if (errorCount > 0) {
    console.log('\n📋 DÉTAILS DES ERREURS:');
    results
      .filter(r => r.error)
      .forEach(r => {
        console.log(`• ${r.species}: ${r.error}`);
      });
  }
  const validUrls = results.filter(r => r.imageUrl).slice(0, 3);
  if (validUrls.length > 0) {
    console.log("\n📋 EXEMPLES D'URLS TROUVÉES:");
    validUrls.forEach(r => {
      console.log(`• ${r.species}: ${r.imageUrl}`);
    });
  }
}

/**
 * Classe wrapper pour la découverte d'URLs d'images (configurable)
 */
export class ImageUrlDiscoverer {
  private readonly config: DefaultConfig;
  constructor(cfg?: DeepPartial<DefaultConfig>) {
    this.config = mergeConfig(cfg);
  }
  async discoverImageUrls(): Promise<ImageInfo[]> {
    return discoverImageUrlsInternal(this.config);
  }
  async generateReport(results: ImageInfo[]): Promise<void> {
    return generateReportInternal(results, this.config);
  }
  extractImageUrl(html: string, slug: string): string | null {
    return extractImageUrl(html, slug);
  }
  async analyzeSpeciesPage(species: BatSpecies): Promise<ImageInfo> {
    return analyzeSpeciesPage(species);
  }
}

// Fonctions exportées (retro-compat) avec config optionnelle
async function discoverImageUrls(
  cfg?: DeepPartial<DefaultConfig>
): Promise<ImageInfo[]> {
  const merged = mergeConfig(cfg);
  return discoverImageUrlsInternal(merged);
}
async function generateReport(
  results: ImageInfo[],
  cfg?: DeepPartial<DefaultConfig>
): Promise<void> {
  const merged = mergeConfig(cfg);
  return generateReportInternal(results, merged);
}

export {
  discoverImageUrls,
  analyzeSpeciesPage,
  extractImageUrl,
  ImageInfo,
  BatSpecies,
  generateReport,
};
