import { promises as fs } from 'fs';
import * as path from 'path';
import { SmartDepartmentExtractor } from './smartExtractor';

/**
 * Extracteur multi-espèces qui traite automatiquement toutes les cartes
 * dans le dossier /images et extrait les données de distribution par département
 */
export class MultiSpeciesExtractor {
  private readonly imagesPath = path.join(process.cwd(), 'images');
  private readonly outputPath = path.join(process.cwd(), 'results');

  /**
   * Extrait le nom de l'espèce depuis le nom du fichier
   */
  private extractSpeciesName(filename: string): string {
    // Enlever l'extension
    const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg)$/i, '');

    // Patterns pour extraire le nom de l'espèce
    const patterns = [
      // Pattern: plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271
      /plan-actions-chiropteres\.fr-([^-]+(?:-[^-]+)*)-carte/i,
      // Pattern: plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271
      /plan-actions-chiropteres\.fr-carte-([^-]+(?:-[^-]+)*)-carte/i,
      // Pattern général: quelque-chose-ESPECE-quelque-chose
      /carte-([^-]+(?:-[^-]+)*)-carte/i,
      // Pattern de fallback: tout ce qui ressemble à un nom d'espèce
      /([a-z]+-[a-z]+(?:-[a-z]+)*)/i,
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match && match[1]) {
        return this.formatSpeciesName(match[1]);
      }
    }

    // Si aucun pattern ne marche, utiliser le nom du fichier nettoyé
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
    } catch (error) {
      // Le dossier existe déjà, c'est ok
    }
  }

  /**
   * Traite une seule image/espèce
   */
  private async processSpecies(filename: string): Promise<void> {
    const speciesName = this.extractSpeciesName(filename);
    const imagePath = path.join(this.imagesPath, filename);

    console.log(`\n🦇 Traitement de l'espèce: ${speciesName}`);
    console.log(`📁 Image: ${filename}`);
    console.log('='.repeat(80));

    try {
      // Créer un extracteur pour cette espèce
      const extractor = new SmartDepartmentExtractor(imagePath, speciesName);

      // Faire l'extraction
      const results = await extractor.extractDepartmentDistribution();

      // Sauvegarder les résultats spécifiques à cette espèce
      const outputFile = path.join(
        this.outputPath,
        `${speciesName.toLowerCase().replace(/\s+/g, '-')}-distribution.json`
      );

      await fs.writeFile(outputFile, JSON.stringify(results, null, 2), 'utf8');

      console.log(`✅ Extraction terminée pour ${speciesName}`);
      console.log(`💾 Résultats sauvegardés: ${outputFile}`);

      await extractor.cleanup();
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${speciesName}:`, error);
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
        species: [] as any[],
      };

      for (const file of distributionFiles) {
        try {
          const filePath = path.join(this.outputPath, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

          const speciesName = file
            .replace('-distribution.json', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          consolidatedData.species.push({
            name: speciesName,
            filename: file,
            totalDepartments: data.metadata?.totalDepartments || 0,
            detectedDepartments: data.metadata?.detectedDepartments || 0,
            summary: data.summary || {},
          });
        } catch (error) {
          console.warn(`⚠️  Impossible de lire ${file}:`, error);
        }
      }

      const reportPath = path.join(
        this.outputPath,
        'consolidated-species-report.json'
      );
      await fs.writeFile(
        reportPath,
        JSON.stringify(consolidatedData, null, 2),
        'utf8'
      );

      console.log(`\n📊 Rapport consolidé généré: ${reportPath}`);

      // Afficher un résumé
      console.log('\n🦇 RÉSUMÉ MULTI-ESPÈCES:');
      console.log('='.repeat(50));
      consolidatedData.species.forEach(species => {
        console.log(`${species.name}:`);
        console.log(
          `  📊 Départements détectés: ${species.detectedDepartments}/${species.totalDepartments}`
        );
        if (species.summary.byStatus) {
          Object.entries(species.summary.byStatus).forEach(
            ([status, count]) => {
              console.log(`  ${status}: ${count} départements`);
            }
          );
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
  async extractAllSpecies(): Promise<void> {
    console.log("🚀 Démarrage de l'extraction multi-espèces");
    console.log('🔍 Recherche des cartes dans le dossier /images...');

    await this.ensureOutputDir();

    const imageFiles = await this.getImageFiles();

    if (imageFiles.length === 0) {
      console.log('❌ Aucune image trouvée dans le dossier /images');
      return;
    }

    console.log(`📸 ${imageFiles.length} carte(s) trouvée(s):`);
    imageFiles.forEach(file => {
      const speciesName = this.extractSpeciesName(file);
      console.log(`  - ${file} → ${speciesName}`);
    });

    // Traiter chaque espèce
    for (const filename of imageFiles) {
      await this.processSpecies(filename);
    }

    // Générer le rapport consolidé
    await this.generateConsolidatedReport();

    console.log('\n🎉 Extraction multi-espèces terminée !');
    console.log(`📁 Tous les résultats sont dans: ${this.outputPath}`);
  }
}

// Script principal
async function main(): Promise<void> {
  const extractor = new MultiSpeciesExtractor();
  await extractor.extractAllSpecies();
}

if (require.main === module) {
  main().catch(console.error);
}
