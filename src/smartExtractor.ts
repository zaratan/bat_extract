import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ColorLegendUtils } from '../data/color-legend-mapping.js';
import {
  FRENCH_DEPARTMENTS,
  FrenchDepartment,
} from '../data/french-departments.js';

// === Nouveaux ajouts pour injection et personnalisation ===
export interface IRawImageData {
  data: Buffer;
  width: number;
  height: number;
}
export interface IImageLoader {
  loadRaw(imagePath: string): Promise<IRawImageData>;
}
export class SharpImageLoader implements IImageLoader {
  async loadRaw(imagePath: string): Promise<IRawImageData> {
    const image = sharp(imagePath);
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width!, height: info.height! };
  }
}
export interface SmartExtractorOptions {
  imageLoader?: IImageLoader;
  sampleRadius?: number; // rayon d'échantillonnage
  minPixelThreshold?: number; // seuil min pour considérer une couleur dominante
}

interface DepartmentColorMapping {
  department: FrenchDepartment;
  dominantColor: { r: number; g: number; b: number; hex: string } | null;
  distributionStatus: string;
  pixelCount: number;
}

export class SmartDepartmentExtractor {
  private readonly imagePath: string;
  private readonly speciesName: string;
  private readonly imageLoader: IImageLoader;
  private readonly sampleRadius: number;
  private readonly minPixelThreshold: number;

  // Liste des départements français externalisée
  private departments: FrenchDepartment[] = FRENCH_DEPARTMENTS;

  constructor(
    imagePath?: string,
    speciesName?: string,
    options?: SmartExtractorOptions
  ) {
    this.imagePath =
      imagePath ||
      join(
        process.cwd(),
        'images',
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png'
      );
    this.speciesName = speciesName || "Barbastelle d'Europe";
    this.imageLoader = options?.imageLoader || new SharpImageLoader();
    this.sampleRadius = options?.sampleRadius ?? 30;
    this.minPixelThreshold = options?.minPixelThreshold ?? 10;
  }

  async extractDepartmentDistribution(): Promise<DepartmentColorMapping[]> {
    console.log(
      `🗺️  Extraction intelligente des départements avec distribution`
    );
    console.log(`🦇 Espèce: ${this.speciesName}`);
    console.log('==========================================================');

    console.log('📊 Analyse de la carte de distribution...');
    const { data, width, height } = await this.imageLoader.loadRaw(
      this.imagePath
    );

    console.log(`📐 Dimensions: ${width}x${height}px`);

    const departmentMappings: DepartmentColorMapping[] = [];

    // Pour chaque département, échantillonner les couleurs dans sa région approximative
    for (const department of this.departments) {
      console.log(`🔍 Analyse ${department.name} (${department.code})...`);

      const mapping = await this.analyzeDepartmentRegion(
        data,
        width,
        height,
        department
      );

      departmentMappings.push(mapping);

      if (mapping.dominantColor) {
        console.log(
          `  ✅ ${department.name}: ${mapping.dominantColor.hex} - ${mapping.distributionStatus}`
        );
      } else {
        console.log(
          `  ⚠️  ${department.name}: Aucune couleur significative détectée`
        );
      }
    }

    // Sauvegarder les résultats
    await this.saveDetailedResults(departmentMappings);

    console.log("\n🎯 RÉSUMÉ DE L'EXTRACTION:");
    console.log('===========================');
    const withColor = departmentMappings.filter(d => d.dominantColor);
    console.log(
      `✅ Départements avec couleur détectée: ${withColor.length}/101`
    );
    console.log(
      `⚠️  Départements sans couleur: ${departmentMappings.length - withColor.length}/101`
    );

    // Statistiques par statut de distribution
    const statusStats = new Map<string, number>();
    withColor.forEach(d => {
      statusStats.set(
        d.distributionStatus,
        (statusStats.get(d.distributionStatus) || 0) + 1
      );
    });

    console.log('\n📊 Répartition par statut de distribution:');
    for (const [status, count] of Array.from(statusStats.entries())) {
      console.log(`  ${status}: ${count} départements`);
    }

    return departmentMappings;
  }

  /** Nouvelle méthode retournant aussi un résumé structuré */
  async extractWithSummary(): Promise<{
    mappings: DepartmentColorMapping[];
    summary: {
      detectedCount: number;
      total: number;
      byStatus: Record<string, number>;
    };
  }> {
    const mappings = await this.extractDepartmentDistribution();
    const detectedCount = mappings.filter(m => m.dominantColor).length;
    const byStatus: Record<string, number> = {};
    mappings.forEach(m => {
      byStatus[m.distributionStatus] =
        (byStatus[m.distributionStatus] || 0) + 1;
    });
    return {
      mappings,
      summary: { detectedCount, total: mappings.length, byStatus },
    };
  }

  private async analyzeDepartmentRegion(
    imageData: Buffer,
    width: number,
    height: number,
    department: FrenchDepartment
  ): Promise<DepartmentColorMapping> {
    // Calculer la zone d'échantillonnage autour des coordonnées du département
    const centerX = Math.floor(department.approximateCoords.x * width);
    const centerY = Math.floor(department.approximateCoords.y * height);

    // Zone d'échantillonnage (rayon de 30 pixels autour du centre)
    const radius = this.sampleRadius;
    const colorCounts = new Map<string, number>();

    for (
      let y = Math.max(0, centerY - radius);
      y < Math.min(height, centerY + radius);
      y++
    ) {
      for (
        let x = Math.max(0, centerX - radius);
        x < Math.min(width, centerX + radius);
        x++
      ) {
        const pixelIndex = (y * width + x) * 3;
        const r = imageData[pixelIndex];
        const g = imageData[pixelIndex + 1];
        const b = imageData[pixelIndex + 2];

        // Ignorer le blanc pur et le noir pur
        if (
          (r === 255 && g === 255 && b === 255) ||
          (r === 0 && g === 0 && b === 0)
        ) {
          continue;
        }

        const colorKey = `${r},${g},${b}`;
        colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
      }
    }

    // Trouver la couleur dominante
    let dominantColor: { r: number; g: number; b: number; hex: string } | null =
      null;
    let maxCount = 0;

    for (const [colorKey, count] of Array.from(colorCounts.entries())) {
      if (count > maxCount && count > this.minPixelThreshold) {
        // Minimum 10 pixels
        const components = colorKey.split(',').map(Number);
        if (components.length !== 3) continue;

        const r = components[0];
        const g = components[1];
        const b = components[2];

        // Vérifier que les composants sont des nombres valides
        if (
          typeof r !== 'number' ||
          typeof g !== 'number' ||
          typeof b !== 'number' ||
          isNaN(r) ||
          isNaN(g) ||
          isNaN(b)
        )
          continue;

        dominantColor = {
          r,
          g,
          b,
          hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
        };
        maxCount = count;
      }
    }

    const distributionStatus = dominantColor
      ? this.inferDistributionStatus(dominantColor)
      : 'non détecté';

    return {
      department,
      dominantColor,
      distributionStatus,
      pixelCount: maxCount,
    };
  }

  private inferDistributionStatus(color: {
    r: number;
    g: number;
    b: number;
  }): string {
    const { r, g, b } = color;

    // Utilisation de la correspondance centralisée des couleurs
    return ColorLegendUtils.getDistributionStatus(r, g, b);
  }

  private async saveDetailedResults(
    mappings: DepartmentColorMapping[]
  ): Promise<void> {
    const results = {
      metadata: {
        extractionDate: new Date().toISOString(),
        totalDepartments: mappings.length,
        detectedDepartments: mappings.filter(m => m.dominantColor).length,
        sourceMap: "Barbastelle d'Europe - Distribution Atlas",
      },
      departments: mappings.map(mapping => ({
        code: mapping.department.code,
        name: mapping.department.name,
        region: mapping.department.region,
        coordinates: mapping.department.approximateCoords,
        color: mapping.dominantColor,
        distributionStatus: mapping.distributionStatus,
        pixelCount: mapping.pixelCount,
        confidence:
          mapping.pixelCount > 50
            ? 'high'
            : mapping.pixelCount > 20
              ? 'medium'
              : 'low',
      })),
      summary: {
        byStatus: this.groupByStatus(mappings),
        byRegion: this.groupByRegion(mappings),
      },
    };

    const outputFilename = join(
      process.cwd(),
      'output',
      `${this.speciesName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')}-department-extraction.json`
    );

    await writeFile(outputFilename, JSON.stringify(results, null, 2));
    console.log(`💾 Résultats détaillés sauvegardés dans: ${outputFilename}`);
  }

  private groupByStatus(
    mappings: DepartmentColorMapping[]
  ): Record<string, number> {
    const statusCount: Record<string, number> = {};
    mappings.forEach(mapping => {
      statusCount[mapping.distributionStatus] =
        (statusCount[mapping.distributionStatus] || 0) + 1;
    });
    return statusCount;
  }

  private groupByRegion(
    mappings: DepartmentColorMapping[]
  ): Record<string, number> {
    const regionCount: Record<string, number> = {};
    mappings
      .filter(m => m.dominantColor)
      .forEach(mapping => {
        regionCount[mapping.department.region] =
          (regionCount[mapping.department.region] || 0) + 1;
      });
    return regionCount;
  }

  async cleanup(): Promise<void> {
    // Nettoyage si nécessaire
  }
}
