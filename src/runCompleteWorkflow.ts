import { execSync } from 'child_process';
import { access } from 'fs/promises';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { readJson } from './utils/fsUtils.js';
import {
  mergeConfig,
  type DeepPartial,
  type DefaultConfig,
} from './config/defaultConfig.js';

interface SpeciesDataFile {
  metadata?: { totalSpecies: number; prioritySpecies: number };
  species?: unknown[];
  [k: string]: unknown;
}
interface DiscoveredUrlsFile {
  metadata?: { totalSpecies: number; imagesFound: number; errors: number };
  validImageUrls?: Record<string, string>;
  results?: unknown[];
  [k: string]: unknown;
}
interface ConsolidatedSummaryFile {
  summary?: Record<string, { detectedDepartments?: number }>;
  [k: string]: unknown;
}

interface StepResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  duration: number;
  message: string;
  details?: string[];
  stats?: { [key: string]: number };
}

interface WorkflowReport {
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  steps: StepResult[];
  overallStatus: 'success' | 'partial' | 'failed';
  summary: {
    successCount: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface IStepCommandRunner {
  run(command: string): void;
}

export class LocalStepCommandRunner implements IStepCommandRunner {
  run(command: string): void {
    execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: process.cwd(),
    });
  }
}

export class BatExtractWorkflow {
  private report: WorkflowReport;
  private readonly outputDir: string;
  private readonly imagesDir: string;
  private readonly runner: IStepCommandRunner;
  private readonly shouldExitOnFatal: boolean;
  private readonly config: DefaultConfig;

  constructor(
    runner: IStepCommandRunner = new LocalStepCommandRunner(),
    options?: { exitOnFatal?: boolean; config?: DeepPartial<DefaultConfig> }
  ) {
    this.config = mergeConfig(options?.config);
    this.outputDir = join(process.cwd(), this.config.paths.outputDir);
    this.imagesDir = join(process.cwd(), this.config.paths.imagesDir);
    this.runner = runner;
    this.shouldExitOnFatal = options?.exitOnFatal !== false; // true par défaut
    this.report = {
      startTime: new Date(),
      steps: [],
      overallStatus: 'success',
      summary: { successCount: 0, errorCount: 0, warningCount: 0 },
    };
  }

  async runCompleteWorkflow(): Promise<void> {
    console.log('🦇 ================================');
    console.log('🦇 WORKFLOW COMPLET BAT EXTRACT');
    console.log('🦇 ================================');
    console.log(
      `🕒 Démarrage: ${this.report.startTime.toLocaleString('fr-FR')}`
    );
    console.log('');

    try {
      // Étape 0: Génération des données d'espèces
      await this.runStep(
        "Génération des données d'espèces",
        '🧬',
        'pnpm generate-species',
        async () => this.checkGeneratedSpeciesData()
      );

      // Étape 1: Découverte des URLs
      await this.runStep(
        'Découverte des URLs',
        '🔍',
        'pnpm discover-urls',
        async () => this.checkDiscoveredUrls()
      );

      // Étape 2: Téléchargement des cartes
      await this.runStep(
        'Téléchargement des cartes',
        '📥',
        'pnpm download',
        async () => this.checkDownloadedImages()
      );

      // Étape 3: Extraction des données
      await this.runStep(
        'Extraction des données',
        '🎨',
        'pnpm extract',
        async () => this.checkExtractedData()
      );

      // Étape 4: Génération du rapport Excel
      await this.runStep(
        'Génération rapport Excel',
        '📊',
        'pnpm excel',
        async () => this.checkExcelReport()
      );

      // Finalisation
      this.finalizeReport();
      this.printFinalReport();
    } catch (error) {
      console.error('💥 Erreur critique dans le workflow:', error);
      this.report.overallStatus = 'failed';
      this.finalizeReport();
      this.printFinalReport();
      if (this.shouldExitOnFatal) {
        process.exit(1);
      }
    }
  }

  private async runStep(
    stepName: string,
    emoji: string,
    command: string,
    validator: () => Promise<{
      stats?: { [key: string]: number };
      details?: string[];
    }>
  ): Promise<void> {
    console.log(`${emoji} ${stepName}...`);
    console.log(`⚡ Commande: ${command}`);

    const startTime = Date.now();
    let result: StepResult;

    try {
      // Exécuter la commande via runner injecté
      this.runner.run(command);

      const duration = Date.now() - startTime;

      // Valider le résultat
      const validation = await validator();

      result = {
        name: stepName,
        status: 'success',
        duration,
        message: `✅ ${stepName} terminée avec succès`,
        details: validation.details,
        stats: validation.stats,
      };

      console.log(`✅ Succès (${(duration / 1000).toFixed(1)}s)`);
      if (validation.stats) {
        Object.entries(validation.stats).forEach(([key, value]) => {
          console.log(`   📊 ${key}: ${value}`);
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      result = {
        name: stepName,
        status: 'error',
        duration,
        message: `❌ Erreur lors de ${stepName}`,
        details: [errorMessage],
      };

      console.log(`❌ Erreur (${(duration / 1000).toFixed(1)}s)`);
      console.log(`   💬 ${errorMessage}`);

      // Continuer le workflow même en cas d'erreur
      this.report.overallStatus =
        this.report.overallStatus === 'success' ? 'partial' : 'failed';
    }

    this.report.steps.push(result);
    this.updateSummary(result.status);
    console.log('');
  }

  private async checkGeneratedSpeciesData(): Promise<{
    stats: { [key: string]: number };
    details: string[];
  }> {
    try {
      const filePath = join(this.outputDir, 'generated-species-data.json');
      const data = await readJson<SpeciesDataFile>(filePath);
      if (!data) {
        throw new Error('Fichier vide');
      }

      if (data.metadata) {
        const { totalSpecies, prioritySpecies } = data.metadata;
        const nonPrioritySpecies = totalSpecies - prioritySpecies;
        const priorityRate = Math.round((prioritySpecies / totalSpecies) * 100);

        return {
          stats: {
            'Espèces total': totalSpecies,
            'Espèces prioritaires': prioritySpecies,
            'Espèces non-prioritaires': nonPrioritySpecies,
            'Taux prioritaire (%)': priorityRate,
          },
          details: [
            `${totalSpecies} espèces scrapées depuis le site web`,
            `${prioritySpecies} espèces prioritaires identifiées`,
            'Données générées dynamiquement',
          ],
        };
      }

      // Fallback si pas de métadonnées
      const speciesCount = (data.species || []).length;
      return {
        stats: {
          'Espèces trouvées': speciesCount,
        },
        details: [`${speciesCount} espèces dans le fichier généré`],
      };
    } catch (error) {
      throw new Error(
        `Impossible de vérifier les données d'espèces générées: ${error}`
      );
    }
  }

  private async checkDiscoveredUrls(): Promise<{
    stats: { [key: string]: number };
    details: string[];
  }> {
    try {
      const filePath = join(this.outputDir, 'discovered-image-urls.json');
      const data = await readJson<DiscoveredUrlsFile>(filePath);
      if (!data) throw new Error('Fichier vide');

      // Utiliser les métadonnées du fichier si disponibles
      if (data.metadata) {
        const { totalSpecies, imagesFound, errors } = data.metadata;
        const successRate = Math.round((imagesFound / totalSpecies) * 100);

        return {
          stats: {
            'URLs découvertes': imagesFound,
            'Espèces analysées': totalSpecies,
            Erreurs: errors,
            'Taux de succès': successRate,
          },
          details: [
            `${imagesFound}/${totalSpecies} URLs valides découvertes`,
            errors > 0
              ? `${errors} espèces sans image de carte`
              : 'Toutes les espèces ont une image',
          ],
        };
      }

      // Fallback: compter manuellement depuis validImageUrls
      const validUrls = Object.keys(data.validImageUrls || {}).length;
      const totalResults = (data.results || []).length;

      return {
        stats: {
          'URLs découvertes': validUrls,
          'Espèces analysées': totalResults,
          'Taux de succès':
            totalResults > 0 ? Math.round((validUrls / totalResults) * 100) : 0,
        },
        details: [`${validUrls}/${totalResults} URLs valides découvertes`],
      };
    } catch (error) {
      throw new Error(`Impossible de vérifier les URLs découvertes: ${error}`);
    }
  }

  private async checkDownloadedImages(): Promise<{
    stats: { [key: string]: number };
    details: string[];
  }> {
    try {
      await access(this.imagesDir);

      const files = readdirSync(this.imagesDir);
      const imageFiles = files.filter((file: string) => file.endsWith('.png'));

      return {
        stats: {
          'Images téléchargées': imageFiles.length,
          'Taille dossier (MB)': Math.round(
            this.calculateDirectorySize(this.imagesDir) / (1024 * 1024)
          ),
        },
        details: [`${imageFiles.length} cartes de distribution téléchargées`],
      };
    } catch (error) {
      throw new Error(
        `Impossible de vérifier les images téléchargées: ${error}`
      );
    }
  }

  private async checkExtractedData(): Promise<{
    stats: { [key: string]: number };
    details: string[];
  }> {
    try {
      await access(this.outputDir);

      const files = readdirSync(this.outputDir);

      const distributionFiles = files.filter(
        (file: string) =>
          file.endsWith('-distribution.json') && !file.includes('consolidated')
      );

      const consolidatedExists = files.includes(
        'consolidated-species-report.json'
      );

      // Analyser le rapport consolidé si disponible
      let averageDetection = 0;

      if (consolidatedExists) {
        try {
          const consolidatedPath = join(
            this.outputDir,
            'consolidated-species-report.json'
          );
          const consolidatedData = await readJson<ConsolidatedSummaryFile>(
            consolidatedPath,
            {
              optional: true,
            }
          );
          if (consolidatedData && consolidatedData.summary) {
            const speciesSummaries = Object.values(
              consolidatedData.summary
            ) as Array<{ detectedDepartments?: number }>;
            if (speciesSummaries.length > 0) {
              const detectionRates = speciesSummaries.map(
                species => species.detectedDepartments || 0
              );
              averageDetection = Math.round(
                detectionRates.reduce(
                  (sum: number, rate: number) => sum + rate,
                  0
                ) / detectionRates.length
              );
            }
          }
        } catch {
          console.warn("⚠️  Impossible d'analyser le rapport consolidé");
        }
      }

      return {
        stats: {
          'Espèces extraites': distributionFiles.length,
          'Départements détectés (moyenne)': averageDetection,
          'Rapport consolidé': consolidatedExists ? 1 : 0,
        },
        details: [
          `${distributionFiles.length} fichiers de distribution générés`,
          consolidatedExists
            ? 'Rapport consolidé créé'
            : 'Rapport consolidé manquant',
        ],
      };
    } catch (error) {
      throw new Error(`Impossible de vérifier les données extraites: ${error}`);
    }
  }

  private async checkExcelReport(): Promise<{
    stats: { [key: string]: number };
    details: string[];
  }> {
    try {
      const excelPath = join(this.outputDir, 'bat-distribution-matrix.xlsx');
      await access(excelPath);

      const stats = statSync(excelPath);
      const fileSizeKB = Math.round(stats.size / 1024);

      return {
        stats: {
          'Fichier Excel créé': 1,
          'Taille fichier (KB)': fileSizeKB,
        },
        details: [
          'Matrice espèces × départements générée',
          'Page de légende incluse',
          'Formatage couleur appliqué',
        ],
      };
    } catch (error) {
      throw new Error(`Impossible de vérifier le rapport Excel: ${error}`);
    }
  }

  private calculateDirectorySize(dirPath: string): number {
    let totalSize = 0;

    try {
      const files = readdirSync(dirPath);
      files.forEach((file: string) => {
        const filePath = join(dirPath, file);
        const stats = statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      });
    } catch {
      // Ignore errors
    }

    return totalSize;
  }

  private updateSummary(status: StepResult['status']): void {
    switch (status) {
      case 'success':
        this.report.summary.successCount++;
        break;
      case 'error':
        this.report.summary.errorCount++;
        break;
      case 'warning':
        this.report.summary.warningCount++;
        break;
    }
  }

  private finalizeReport(): void {
    this.report.endTime = new Date();
    this.report.totalDuration =
      this.report.endTime.getTime() - this.report.startTime.getTime();

    // Déterminer le statut global
    if (this.report.summary.errorCount === 0) {
      this.report.overallStatus =
        this.report.summary.warningCount > 0 ? 'partial' : 'success';
    } else {
      this.report.overallStatus =
        this.report.summary.successCount > 0 ? 'partial' : 'failed';
    }
  }

  private printFinalReport(): void {
    console.log('🦇 ================================');
    console.log('🦇 RAPPORT FINAL DU WORKFLOW');
    console.log('🦇 ================================');
    console.log('');

    // Statut global
    const statusEmoji = {
      success: '✅',
      partial: '⚠️',
      failed: '❌',
    };

    const statusMessage = {
      success: 'SUCCÈS COMPLET',
      partial: 'SUCCÈS PARTIEL',
      failed: 'ÉCHEC',
    };

    console.log(
      `${statusEmoji[this.report.overallStatus]} Statut: ${statusMessage[this.report.overallStatus]}`
    );
    console.log(
      `🕒 Durée totale: ${((this.report.totalDuration || 0) / 1000).toFixed(1)}s`
    );
    console.log(
      `📊 Étapes: ${this.report.summary.successCount} succès, ${this.report.summary.errorCount} erreurs, ${this.report.summary.warningCount} avertissements`
    );
    console.log('');

    // Détail par étape
    console.log('📋 DÉTAIL DES ÉTAPES:');
    console.log('====================');

    this.report.steps.forEach((step, index) => {
      const stepEmoji =
        step.status === 'success'
          ? '✅'
          : step.status === 'warning'
            ? '⚠️'
            : '❌';
      console.log(
        `${index + 1}. ${stepEmoji} ${step.name} (${(step.duration / 1000).toFixed(1)}s)`
      );

      if (step.stats) {
        Object.entries(step.stats).forEach(([key, value]) => {
          console.log(`   📊 ${key}: ${value}`);
        });
      }

      if (step.details) {
        step.details.forEach(detail => {
          console.log(`   💬 ${detail}`);
        });
      }

      if (step.status === 'error') {
        console.log(`   ❌ ${step.message}`);
      }

      console.log('');
    });

    // Résumé des fichiers générés
    console.log('📁 FICHIERS GÉNÉRÉS:');
    console.log('====================');
    console.log(`📂 ${this.imagesDir}/`);
    console.log('   🖼️  Cartes de distribution (PNG)');
    console.log('');
    console.log(`📂 ${this.outputDir}/`);
    console.log('   📄 *-distribution.json (données par espèce)');
    console.log('   📊 consolidated-species-report.json (rapport consolidé)');
    console.log('   📈 bat-distribution-matrix.xlsx (matrice Excel)');
    console.log('');

    // Recommandations
    if (this.report.overallStatus === 'partial') {
      console.log('💡 RECOMMANDATIONS:');
      console.log('===================');
      console.log('• Vérifier les étapes en erreur ci-dessus');
      console.log('• Relancer les étapes individuellement si nécessaire');
      console.log("• Consulter les logs détaillés pour plus d'informations");
      console.log('');
    }

    console.log('🦇 Workflow terminé!');

    if (this.report.overallStatus === 'success') {
      console.log('🎉 Toutes les étapes ont été exécutées avec succès!');
      console.log(
        `📊 Vous pouvez maintenant ouvrir: ${join(this.outputDir, 'bat-distribution-matrix.xlsx')}`
      );
    }
  }
}

// Le script d'exécution est maintenant dans scripts/runCompleteWorkflow.ts
