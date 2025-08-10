/**
 * Générateur automatique des données d'espèces de chauves-souris
 * Scrape le site https://plan-actions-chiropteres.fr pour extraire toutes les espèces
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import {
  mergeConfig,
  type DefaultConfig,
  type DeepPartial,
} from './config/defaultConfig.js';

interface BatSpecies {
  /** Nom français de l'espèce */
  name: string;
  /** Nom latin de l'espèce (si disponible) */
  latinName?: string;
  /** URL de la page de l'espèce */
  pageUrl: string;
  /** Slug pour identifier l'espèce (dernière partie de l'URL) */
  slug: string;
  /** Indique si l'espèce est prioritaire pour la conservation */
  isPriority: boolean;
}

interface SpeciesDataOutput {
  metadata: {
    generatedAt: string;
    source: string;
    totalSpecies: number;
    prioritySpecies: number;
  };
  species: BatSpecies[];
}

export class SpeciesDataGenerator {
  private readonly baseUrl = 'https://plan-actions-chiropteres.fr';
  private readonly speciesListUrl = `${this.baseUrl}/les-chauves-souris/les-especes/`;
  private readonly config: DefaultConfig;

  constructor(cfg?: DeepPartial<DefaultConfig>) {
    this.config = mergeConfig(cfg);
  }

  /**
   * Génère le fichier JSON des espèces depuis le site web
   */
  async generateSpeciesData(): Promise<void> {
    console.log("🦇 Génération des données d'espèces depuis le site web...");
    console.log(`🌐 Source: ${this.speciesListUrl}`);

    try {
      const speciesWithPriority = await this.scrapeSpeciesList();
      const output: SpeciesDataOutput = {
        metadata: {
          generatedAt: new Date().toISOString(),
          source: this.speciesListUrl,
          totalSpecies: speciesWithPriority.length,
          prioritySpecies: speciesWithPriority.filter(s => s.isPriority).length,
        },
        species: speciesWithPriority,
      };
      const outputPath = join(
        process.cwd(),
        this.config.paths.outputDir,
        'generated-species-data.json'
      );
      await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`✅ Données générées: ${outputPath}`);
      console.log(`📊 Total: ${output.metadata.totalSpecies} espèces`);
      console.log(
        `🎯 Prioritaires: ${output.metadata.prioritySpecies} espèces`
      );
    } catch (error) {
      console.error('❌ Erreur lors de la génération des données:', error);
      throw error;
    }
  }

  /**
   * Scrape la page principale pour extraire toutes les espèces
   */
  private async scrapeSpeciesList(): Promise<BatSpecies[]> {
    console.log('🔍 Analyse de la page des espèces...');

    try {
      const response = await fetch(this.speciesListUrl);
      if (!response.ok) {
        throw new Error(
          `Erreur HTTP: ${response.status} - ${response.statusText}`
        );
      }

      const html = await response.text();
      const species = this.extractSpeciesFromHtml(html);

      console.log(`📋 ${species.length} espèces trouvées`);
      return species;
    } catch (error) {
      throw new Error(`Impossible de récupérer la liste des espèces: ${error}`);
    }
  }

  /**
   * Extrait les espèces depuis le HTML de la page
   */
  private extractSpeciesFromHtml(html: string): BatSpecies[] {
    const species: BatSpecies[] = [];
    const linkPattern =
      /<a[^>]+href="([^"']*\/les-especes\/([^/]+)\/)["'][^>]*>([^<]+)<\/a>/gi;
    let match: RegExpExecArray | null;
    const seenSlugs = new Set<string>();
    while ((match = linkPattern.exec(html)) !== null) {
      const matchIndex = match.index;
      const [, fullUrl, slug, rawName] = match;
      const name = this.cleanSpeciesName(rawName);
      if (seenSlugs.has(slug) || !name || name.length < 3) continue;
      const pageUrl = fullUrl.startsWith('http')
        ? fullUrl
        : `${this.baseUrl}${fullUrl}`;
      const isPriority = this.detectPriorityNear(html, matchIndex, slug);
      species.push({ name, slug, pageUrl, isPriority });
      seenSlugs.add(slug);
    }
    return species.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  /**
   * Détecte la priorité à partir du lien :
   * 1. Cherche le dernier tag ouvrant <article ...> ou <div ...> avant le lien dans une fenêtre limitée.
   * 2. Inspecte ses classes.
   * 3. Cherche juste après le lien (fenêtre courte) un badge ou span prioritaire.
   */
  private detectPriorityNear(
    html: string,
    linkStart: number,
    _slug: string
  ): boolean {
    // Fenêtre avant le lien pour trouver le heading englobant
    const windowStart = Math.max(0, linkStart - 600);
    const before = html.slice(windowStart, linkStart);
    // Trouver toutes les balises heading avec classes avant le lien
    const headingRegex = /<h[2-6][^>]*class=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    let lastClasses: string | null = null;
    while ((m = headingRegex.exec(before)) !== null) {
      lastClasses = m[1];
    }
    if (!lastClasses) return false;
    const cls = lastClasses.toLowerCase();
    // Critère principal : classe Gutenberg has-orange-background-color
    if (/(^|\s)has-orange-background-color(\s|$)/.test(cls)) return true;
    if (/has-[a-z0-9-]*orange[a-z0-9-]*-background-color/.test(cls)) {
      return true;
    }
    return false;
  }

  /**
   * Nettoie le nom de l'espèce extrait du HTML
   */
  private cleanSpeciesName(rawName: string): string {
    return rawName
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'");
  }

  /**
   * Enrichit les données avec les noms latins depuis les pages individuelles
   * (et met aussi à jour la priorité si pas encore renseignée)
   */
  async enrichWithLatinNames(species: BatSpecies[]): Promise<BatSpecies[]> {
    console.log('🔬 Enrichissement avec les noms latins...');
    const enrichedSpecies: BatSpecies[] = [];
    const delayMs = this.config.network.requestDelayMs;
    for (let index = 0; index < species.length; index++) {
      const sp = species[index];
      console.log(`📖 (${index + 1}/${species.length}) ${sp.name}...`);
      try {
        const response = await fetch(sp.pageUrl);
        if (!response || !response.ok) {
          enrichedSpecies.push(sp);
        } else {
          const html = await response.text();
          const latinName = this.extractLatinNameFromHtml(html);
          const updated: BatSpecies = {
            ...sp,
            latinName,
            // isPriority déjà déterminé lors de l'extraction de la liste
          };
          enrichedSpecies.push(updated);
        }
        await new Promise<void>(resolve => {
          globalThis.setTimeout(resolve, delayMs);
        });
      } catch (error) {
        console.warn(
          `⚠️  Impossible d'extraire le nom latin pour ${sp.name}: ${error}`
        );
        enrichedSpecies.push(sp);
      }
    }
    return enrichedSpecies;
  }

  // Nouvelle factorisation de l'extraction du nom latin depuis un HTML déjà récupéré
  private extractLatinNameFromHtml(html: string): string | undefined {
    const patterns = [
      /<em[^>]*>([A-Z][a-z]+ [a-z]+)<\/em>/i,
      /<i[^>]*>([A-Z][a-z]+ [a-z]+)<\/i>/i,
      /\(([A-Z][a-z]+ [a-z]+)\)/,
      /<span[^>]*class="[^"]*latin[^"]*"[^>]*>([A-Z][a-z]+ [a-z]+)<\/span>/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const latinName = match[1].trim();
        if (/^[A-Z][a-z]+ [a-z]+$/.test(latinName)) return latinName;
      }
    }
    return undefined;
  }

  /**
   * Extrait le nom latin depuis une page d'espèce
   */
  private async extractLatinName(pageUrl: string): Promise<string | undefined> {
    // Conservée pour compat compat éventuelle (utilisée par tests existants),
    // mais redirige vers logique factorisée.
    try {
      const response = await fetch(pageUrl);
      if (!response || !response.ok) return undefined;
      const html = await response.text();
      return this.extractLatinNameFromHtml(html);
    } catch {
      return undefined;
    }
  }
}
