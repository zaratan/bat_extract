/**
 * Générateur automatique des données d'espèces de chauves-souris
 * Scrape le site https://plan-actions-chiropteres.fr pour extraire toutes les espèces
 */

import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';
import * as path from 'path';

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

  /**
   * Génère le fichier JSON des espèces depuis le site web
   */
  async generateSpeciesData(): Promise<void> {
    console.log("🦇 Génération des données d'espèces depuis le site web...");
    console.log(`🌐 Source: ${this.speciesListUrl}`);

    try {
      // Récupérer la page principale des espèces
      const speciesData = await this.scrapeSpeciesList();

      // Déterminer les espèces prioritaires (basé sur la liste connue)
      const speciesWithPriority = this.addPriorityFlags(speciesData);

      // Créer la structure de sortie
      const output: SpeciesDataOutput = {
        metadata: {
          generatedAt: new Date().toISOString(),
          source: this.speciesListUrl,
          totalSpecies: speciesWithPriority.length,
          prioritySpecies: speciesWithPriority.filter(s => s.isPriority).length,
        },
        species: speciesWithPriority,
      };

      // Sauvegarder le fichier JSON
      const outputPath = path.join(
        process.cwd(),
        'output',
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

    // Pattern pour trouver les liens vers les pages d'espèces
    // Recherche les liens qui pointent vers /les-especes/[slug]/
    const linkPattern =
      /<a[^>]+href="([^"]*\/les-especes\/([^/]+)\/)["'][^>]*>([^<]+)<\/a>/gi;

    let match;
    const seenSlugs = new Set<string>();

    while ((match = linkPattern.exec(html)) !== null) {
      const [, fullUrl, slug, rawName] = match;

      // Nettoyer le nom de l'espèce
      const name = this.cleanSpeciesName(rawName);

      // Éviter les doublons
      if (seenSlugs.has(slug) || !name || name.length < 3) {
        continue;
      }

      // Construire l'URL complète si nécessaire
      const pageUrl = fullUrl.startsWith('http')
        ? fullUrl
        : `${this.baseUrl}${fullUrl}`;

      species.push({
        name,
        slug,
        pageUrl,
        isPriority: false, // Sera déterminé plus tard
      });

      seenSlugs.add(slug);
    }

    // Trier par nom pour une sortie cohérente
    return species.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
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
   * Ajoute les flags de priorité basés sur la connaissance existante
   */
  private addPriorityFlags(species: BatSpecies[]): BatSpecies[] {
    // Liste des espèces prioritaires selon le PNAC
    const prioritySlugs = new Set([
      'barbastelle-deurope',
      'grand-murin',
      'grand-rhinolophe',
      'grande-noctule',
      'minioptere-de-schreibers',
      'molosse-de-cestoni',
      'murin-a-oreilles-echancrees',
      'murin-de-bechstein',
      'murin-de-capaccini',
      'murin-des-marais',
      'oreillard-gris',
      'petit-murin',
      'petit-rhinolophe',
      'pipistrelle-pygmee',
      'rhinolophe-de-mehely',
      'rhinolophe-euryale',
      'vespere-de-savi',
    ]);

    return species.map(sp => ({
      ...sp,
      isPriority: prioritySlugs.has(sp.slug),
    }));
  }

  /**
   * Enrichit les données avec les noms latins depuis les pages individuelles
   */
  async enrichWithLatinNames(species: BatSpecies[]): Promise<BatSpecies[]> {
    console.log('🔬 Enrichissement avec les noms latins...');

    const enrichedSpecies: BatSpecies[] = [];

    for (let index = 0; index < species.length; index++) {
      const sp = species[index];
      console.log(`📖 (${index + 1}/${species.length}) ${sp.name}...`);

      try {
        const latinName = await this.extractLatinName(sp.pageUrl);
        enrichedSpecies.push({
          ...sp,
          latinName,
        });

        // Délai pour respecter le serveur
        await new Promise<void>(resolve => {
          globalThis.setTimeout(resolve, 1000);
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

  /**
   * Extrait le nom latin depuis une page d'espèce
   */
  private async extractLatinName(pageUrl: string): Promise<string | undefined> {
    try {
      const response = await fetch(pageUrl);
      if (!response.ok) return undefined;

      const html = await response.text();

      // Patterns pour trouver le nom latin
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
          // Vérifier que c'est bien un nom latin (format Genus species)
          if (/^[A-Z][a-z]+ [a-z]+$/.test(latinName)) {
            return latinName;
          }
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
