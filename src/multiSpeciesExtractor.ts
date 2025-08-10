import { promises as fs } from 'fs';
import { join } from 'path';
import { SmartDepartmentExtractor } from './smartExtractor.js';
import {
  mergeConfig,
  type DeepPartial,
  type DefaultConfig,
} from './config/defaultConfig.js';
import { runWithConcurrency } from './utils/concurrency.js';
import { createMetrics } from './utils/metrics.js';
import { appendMultiSpeciesExtractionMetrics } from './utils/metricsStore.js';

/** Interface d'un extracteur départemental (simplifiée pour injection) */
export interface IDepartmentExtractor {
  extractDepartmentDistribution(): Promise<unknown>;
  cleanup(): Promise<void>;
}

/** Factory pour créer les extracteurs (permet de mocker facilement) */
export interface IDepartmentExtractorFactory {
  create(imagePath: string, speciesName: string): IDepartmentExtractor;
}

class SmartDepartmentExtractorFactory implements IDepartmentExtractorFactory {
  create(imagePath: string, speciesName: string): IDepartmentExtractor {
    return new SmartDepartmentExtractor(
      imagePath,
      speciesName
    ) as unknown as IDepartmentExtractor;
  }
}

/** Résultat structuré du traitement d'une espèce */
export interface ProcessSpeciesResult {
  speciesName: string;
  filename: string;
  success: boolean;
  outputFile?: string;
  error?: string;
}

/**
 * Extracteur multi-espèces qui traite automatiquement toutes les cartes
 * dans le dossier images configuré et extrait les données de distribution
 */
export class MultiSpeciesExtractor {
  private readonly imagesPath: string;
  private readonly outputPath: string;
  private readonly factory: IDepartmentExtractorFactory;
  private readonly config: DefaultConfig;

  constructor(
    factory: IDepartmentExtractorFactory = new SmartDepartmentExtractorFactory(),
    config?: DeepPartial<DefaultConfig>
  ) {
    this.factory = factory;
    this.config = mergeConfig(config);
    this.imagesPath = join(process.cwd(), this.config.paths.imagesDir);
    this.outputPath = join(process.cwd(), this.config.paths.outputDir);
  }

  /**
   * Extrait le nom de l'espèce depuis le nom du fichier
   */
  private extractSpeciesName(filename: string): string {
    // Enlever l'extension
    const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg)$/i, '');

    // Patterns pour extraire le nom de l'espèce
    const patterns = [
      /plan-actions-chiropteres\.fr-([^-]+(?:-[^-]+)*)-carte/i,
      /plan-actions-chiropteres\.fr-carte-([^-]+(?:-[^-]+)*)-carte/i,
      /carte-([^-]+(?:-[^-]+)*)-carte/i,
      /([a-z]+-[a-z]+(?:-[a-z]+)*)/i,
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match && match[1]) {
        return this.formatSpeciesName(match[1]);
      }
    }

    return this.formatSpeciesName(nameWithoutExt);
  }

  /**
   * Formate le nom de l'espèce pour l'affichage
   */
  private formatSpeciesName(rawName: string): string {
    return rawName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Scanne le dossier images et retourne la liste des fichiers à traiter
   */
  private async getImageFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.imagesPath);
      return files.filter(
        file =>
          /\.(png|jpg|jpeg)$/i.test(file) &&
          !file.startsWith('.') &&
          file !== 'README.md'
      );
    } catch (error) {
      console.error('❌ Erreur lors de la lecture du dossier images:', error);
      return [];
    }
  }

  /**
   * Crée le dossier de résultats s'il n'existe pas
   */
  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.outputPath, { recursive: true });
    } catch {
      // ok
    }
  }

  /**
   * Crée l'extracteur (point d'extension/test)
   */
  protected createExtractor(
    imagePath: string,
    speciesName: string
  ): IDepartmentExtractor {
    return this.factory.create(imagePath, speciesName);
  }

  /**
   * Traite une seule image/espèce et retourne un résultat structuré
   */
  private async processSpecies(
    filename: string
  ): Promise<ProcessSpeciesResult> {
    const speciesName = this.extractSpeciesName(filename);
    const imagePath = join(this.imagesPath, filename);

    console.log(`\n🦇 Traitement de l'espèce: ${speciesName}`);
    console.log(`📁 Image: ${filename}`);
    console.log('='.repeat(80));

    try {
      const extractor = this.createExtractor(imagePath, speciesName);
      const results = await extractor.extractDepartmentDistribution();

      const outputFile = join(
        this.outputPath,
        `${speciesName.toLowerCase().replace(/\s+/g, '-')}-distribution.json`
      );

      await fs.writeFile(outputFile, JSON.stringify(results, null, 2), 'utf8');

      console.log(`✅ Extraction terminée pour ${speciesName}`);
      console.log(`💾 Résultats sauvegardés: ${outputFile}`);

      await extractor.cleanup();

      return { speciesName, filename, success: true, outputFile };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Erreur lors du traitement de ${speciesName}:`, error);
      return { speciesName, filename, success: false, error: message };
    }
  }

  /**
   * Génère un rapport consolidé de toutes les espèces
   */
  private async generateConsolidatedReport(): Promise<void> {
    try {
      const resultFiles = await fs.readdir(this.outputPath);
      const distributionFiles = resultFiles.filter(file =>
        file.endsWith('-distribution.json')
      );

      const consolidatedData = {
        metadata: {
          extractionDate: new Date().toISOString(),
          totalSpecies: distributionFiles.length,
          source: 'Multi-species extraction from plan-actions-chiropteres.fr',
        },
        species: [] as Array<{
          name: string;
          filename: string;
          totalDepartments: number;
          detectedDepartments: number;
          summary: Record<string, number>;
        }>,
      };

      for (const file of distributionFiles) {
        try {
          const filePath = join(this.outputPath, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

          const speciesName = file
            .replace('-distribution.json', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const departmentsArray = Array.isArray(data)
            ? (data as Array<{ distributionStatus?: string }>)
            : [];
          const detectedDepartments = departmentsArray.filter(
            d => d.distributionStatus !== 'non détecté'
          ).length;

          const summary: { [key: string]: number } = {};
          departmentsArray.forEach(dept => {
            const status = dept.distributionStatus || 'non détecté';
            summary[status] = (summary[status] || 0) + 1;
          });

          consolidatedData.species.push({
            name: speciesName,
            filename: file,
            totalDepartments: departmentsArray.length,
            detectedDepartments: detectedDepartments,
            summary: summary,
          });
        } catch (error) {
          console.warn(`⚠️  Impossible de lire ${file}:`, error);
        }
      }

      const reportPath = join(
        this.outputPath,
        'consolidated-species-report.json'
      );
      await fs.writeFile(
        reportPath,
        JSON.stringify(consolidatedData, null, 2),
        'utf8'
      );

      console.log(`\n📊 Rapport consolidé généré: ${reportPath}`);

      console.log('\n🦇 RÉSUMÉ MULTI-ESPÈCES:');
      console.log('='.repeat(50));
      consolidatedData.species.forEach(species => {
        console.log(`${species.name}:`);
        console.log(
          `  📊 Départements détectés: ${species.detectedDepartments}/${species.totalDepartments}`
        );
        if (species.summary && Object.keys(species.summary).length > 0) {
          Object.entries(species.summary).forEach(([status, count]) => {
            console.log(`  ${status}: ${count} départements`);
          });
        }
        console.log('');
      });
    } catch (error) {
      console.error(
        '❌ Erreur lors de la génération du rapport consolidé:',
        error
      );
    }
  }

  /**
   * Lance l'extraction pour toutes les espèces
   */
  async extractAllSpecies(): Promise<ProcessSpeciesResult[]> {
    console.log("🚀 Démarrage de l'extraction multi-espèces");
    console.log('🔍 Recherche des cartes dans le dossier images...');

    await this.ensureOutputDir();

    const imageFiles = await this.getImageFiles();

    if (imageFiles.length === 0) {
      console.log('❌ Aucune image trouvée dans le dossier images');
      return [];
    }

    console.log(`📸 ${imageFiles.length} carte(s) trouvée(s):`);
    imageFiles.forEach(file => {
      const speciesName = this.extractSpeciesName(file);
      console.log(`  - ${file} → ${speciesName}`);
    });

    const limit = Math.max(
      1,
      this.config.parallel.maxConcurrentExtractions || 1
    );
    if (limit > 1) {
      console.log(
        `⚙️  Mode parallèle limité: ${limit} extractions simultanées`
      );
    }

    const metrics = createMetrics('Extraction multi-espèces');

    const results = await runWithConcurrency(
      imageFiles,
      limit,
      async filename => {
        const r = await this.processSpecies(filename);
        if (r.success) {
          metrics.markSuccess();
        } else {
          metrics.markFailure();
        }
        return r;
      }
    );

    // results peut contenir potentiellement des Error si worker a throw hors try/catch
    const normalized: ProcessSpeciesResult[] = results.map(r => {
      if (r instanceof Error) {
        metrics.markFailure();
        return {
          speciesName: 'Inconnu',
          filename: 'inconnu',
          success: false,
          error: r.message,
        };
      }
      return r as ProcessSpeciesResult;
    });

    await this.generateConsolidatedReport();

    const successCount = normalized.filter(r => r.success).length;
    const failCount = normalized.length - successCount;
    console.log(`\n📌 Bilan: ${successCount} succès, ${failCount} échec(s)`);
    metrics.logSummary();

    try {
      const snapshot = metrics.snapshot();
      const metricsPath = await appendMultiSpeciesExtractionMetrics(snapshot, {
        outputDir: this.outputPath,
        extra: { successCount, failCount },
      });
      console.log(`📊 Métriques persistées: ${metricsPath}`);
    } catch (e) {
      console.warn('⚠️  Impossible de persister les métriques:', e);
    }

    console.log('\n🎉 Extraction multi-espèces terminée !');
    console.log(`📁 Tous les résultats sont dans: ${this.outputPath}`);

    return normalized;
  }
}
