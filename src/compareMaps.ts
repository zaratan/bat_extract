import { BatExtractor } from './batExtractor';
import { ImageProcessor } from './imageProcessor';
import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import path from 'path';

interface DepartmentMapping {
  name: string;
  coordinates: { x: number; y: number };
  color?: { r: number; g: number; b: number };
  distributionStatus?: string;
}

interface MapComparison {
  departmentMap: string;
  distributionMap: string;
  departments: DepartmentMapping[];
  colorAnalysis: {
    dominantColors: Array<{ rgb: string; count: number; hex: string }>;
    departmentColors: DepartmentMapping[];
  };
  analysis: {
    totalDepartments: number;
    mappedDepartments: number;
    unmappedDepartments: number;
  };
}

export class MapComparator {
  private batExtractor: BatExtractor;
  private imageProcessor: ImageProcessor;

  constructor() {
    this.batExtractor = new BatExtractor();
    this.imageProcessor = new ImageProcessor();
  }

  async compareMaps(): Promise<MapComparison> {
    console.log('🗺️  Comparaison des cartes et extraction des départements');
    console.log('=====================================================');

    // Initialiser BatExtractor
    await this.batExtractor.initialize('fra');

    const departmentMapPath =
      './images/carte-des-departements-francais-noir-et-blanc-800-4213659499.jpg';
    const distributionMapPath =
      './images/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png';

    console.log('📍 Étape 1: Analyse de la carte des départements');
    console.log('===============================================');

    // Extraire les noms des départements de la carte administrative
    const departmentExtraction = await this.batExtractor.extractFromImage(
      departmentMapPath,
      { preprocess: true }
    );
    console.log(
      `Texte extrait de la carte des départements (confiance: ${departmentExtraction.confidence}%)`
    );

    // Extraire les départements depuis le texte
    const departments = this.extractDepartmentNames(departmentExtraction.text);
    console.log(`🏛️ Départements trouvés: ${departments.length}`);
    departments.forEach((dept, i) => console.log(`  ${i + 1}. ${dept}`));

    console.log(
      '\n📍 Étape 2: Analyse des couleurs de la carte de distribution'
    );
    console.log('=========================================================');

    // Analyser les couleurs de la carte de distribution
    const distributionColors =
      await this.analyzeDistributionColors(distributionMapPath);
    console.log(
      `🎨 Couleurs dominantes trouvées: ${distributionColors.length}`
    );

    console.log('\n📍 Étape 3: Analyse géométrique des cartes');
    console.log('==========================================');

    // Analyser la géométrie des deux cartes pour mapping
    const geometryMapping = await this.analyzeGeometry(
      departmentMapPath,
      distributionMapPath
    );

    console.log('\n📍 Étape 4: Création du mapping département-couleur');
    console.log('==================================================');

    // Créer le mapping final
    const departmentMappings: DepartmentMapping[] = departments.map(
      (name, index) => ({
        name,
        coordinates: { x: 0, y: 0 }, // À améliorer avec la détection de position
        color: distributionColors[index % distributionColors.length]?.color,
        distributionStatus: this.inferDistributionStatus(
          distributionColors[index % distributionColors.length]
        ),
      })
    );

    const result: MapComparison = {
      departmentMap: departmentMapPath,
      distributionMap: distributionMapPath,
      departments: departmentMappings,
      colorAnalysis: {
        dominantColors: distributionColors,
        departmentColors: departmentMappings,
      },
      analysis: {
        totalDepartments: departments.length,
        mappedDepartments: departmentMappings.filter(d => d.color).length,
        unmappedDepartments: departmentMappings.filter(d => !d.color).length,
      },
    };

    // Sauvegarder les résultats
    await this.saveResults(result);

    console.log('\n🎯 RÉSUMÉ DE LA COMPARAISON:');
    console.log('============================');
    console.log(
      `✅ Départements identifiés: ${result.analysis.totalDepartments}`
    );
    console.log(
      `✅ Départements mappés avec couleurs: ${result.analysis.mappedDepartments}`
    );
    console.log(
      `⚠️  Départements non mappés: ${result.analysis.unmappedDepartments}`
    );
    console.log(
      `🎨 Couleurs distinctes analysées: ${result.colorAnalysis.dominantColors.length}`
    );

    return result;
  }

  private extractDepartmentNames(text: string): string[] {
    console.log('🔍 Extraction des noms de départements...');

    // Liste des départements français pour validation
    const frenchDepartments = [
      'Ain',
      'Aisne',
      'Allier',
      'Alpes-de-Haute-Provence',
      'Hautes-Alpes',
      'Alpes-Maritimes',
      'Ardèche',
      'Ardennes',
      'Ariège',
      'Aube',
      'Aude',
      'Aveyron',
      'Bouches-du-Rhône',
      'Calvados',
      'Cantal',
      'Charente',
      'Charente-Maritime',
      'Cher',
      'Corrèze',
      'Corse-du-Sud',
      'Haute-Corse',
      "Côte-d'Or",
      "Côtes-d'Armor",
      'Creuse',
      'Dordogne',
      'Doubs',
      'Drôme',
      'Eure',
      'Eure-et-Loir',
      'Finistère',
      'Gard',
      'Haute-Garonne',
      'Gers',
      'Gironde',
      'Hérault',
      'Ille-et-Vilaine',
      'Indre',
      'Indre-et-Loire',
      'Isère',
      'Jura',
      'Landes',
      'Loir-et-Cher',
      'Loire',
      'Haute-Loire',
      'Loire-Atlantique',
      'Loiret',
      'Lot',
      'Lot-et-Garonne',
      'Lozère',
      'Maine-et-Loire',
      'Manche',
      'Marne',
      'Haute-Marne',
      'Mayenne',
      'Meurthe-et-Moselle',
      'Meuse',
      'Morbihan',
      'Moselle',
      'Nièvre',
      'Nord',
      'Oise',
      'Orne',
      'Pas-de-Calais',
      'Puy-de-Dôme',
      'Pyrénées-Atlantiques',
      'Hautes-Pyrénées',
      'Pyrénées-Orientales',
      'Bas-Rhin',
      'Haut-Rhin',
      'Rhône',
      'Haute-Saône',
      'Saône-et-Loire',
      'Sarthe',
      'Savoie',
      'Haute-Savoie',
      'Paris',
      'Seine-Maritime',
      'Seine-et-Marne',
      'Yvelines',
      'Deux-Sèvres',
      'Somme',
      'Tarn',
      'Tarn-et-Garonne',
      'Var',
      'Vaucluse',
      'Vendée',
      'Vienne',
      'Haute-Vienne',
      'Vosges',
      'Yonne',
      'Territoire de Belfort',
      'Essonne',
      'Hauts-de-Seine',
      'Seine-Saint-Denis',
      'Val-de-Marne',
      "Val-d'Oise",
    ];

    // Recherche des départements dans le texte extrait
    const foundDepartments: string[] = [];
    const words = text.split(/\s+/);

    for (const department of frenchDepartments) {
      const departmentWords = department.toLowerCase().split(/[-\s]/);
      const textLower = text.toLowerCase();

      if (textLower.includes(department.toLowerCase())) {
        foundDepartments.push(department);
      }
    }

    // Recherche additionnelle par mots-clés dans le texte
    const additionalMatches = words.filter(word => {
      const cleanWord = word.replace(/[^a-zA-Zàâäéèêëïîôöùûüÿç-]/g, '');
      return (
        cleanWord.length > 3 &&
        frenchDepartments.some(
          dept =>
            dept.toLowerCase().includes(cleanWord.toLowerCase()) ||
            cleanWord.toLowerCase().includes(dept.toLowerCase())
        )
      );
    });

    // Ajouter les correspondances supplémentaires
    additionalMatches.forEach(match => {
      const matchingDept = frenchDepartments.find(
        dept =>
          dept.toLowerCase().includes(match.toLowerCase()) ||
          match.toLowerCase().includes(dept.toLowerCase())
      );
      if (matchingDept && !foundDepartments.includes(matchingDept)) {
        foundDepartments.push(matchingDept);
      }
    });

    return [...new Set(foundDepartments)].sort();
  }

  private async analyzeDistributionColors(imagePath: string): Promise<
    Array<{
      rgb: string;
      count: number;
      hex: string;
      color: { r: number; g: number; b: number };
    }>
  > {
    console.log('🎨 Analyse des couleurs de distribution...');

    const image = sharp(imagePath);
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colorCounts = new Map<string, number>();

    // Analyser chaque pixel
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Ignorer le blanc pur et le noir pur (fond/contours)
      if (
        (r === 255 && g === 255 && b === 255) ||
        (r === 0 && g === 0 && b === 0)
      ) {
        continue;
      }

      const colorKey = `${r},${g},${b}`;
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }

    // Trier par fréquence et retourner les couleurs significatives
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Top 20 des couleurs
      .filter(([_, count]) => count > 50) // Minimum 50 pixels
      .map(([colorKey, count]) => {
        const components = colorKey.split(',').map(Number);
        if (components.length !== 3) return null;
        const [r, g, b] = components;
        // Vérification que r, g, b sont des nombres valides
        if (
          typeof r !== 'number' ||
          typeof g !== 'number' ||
          typeof b !== 'number' ||
          isNaN(r) ||
          isNaN(g) ||
          isNaN(b)
        ) {
          return null;
        }
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        return {
          rgb: `RGB(${r}, ${g}, ${b})`,
          count,
          hex,
          color: { r, g, b },
        };
      })
      .filter((color): color is NonNullable<typeof color> => color !== null);

    console.log(`🎨 ${sortedColors.length} couleurs significatives trouvées`);
    sortedColors.slice(0, 10).forEach((color, i) => {
      console.log(
        `  ${i + 1}. ${color.rgb} (${color.hex}) - ${color.count} pixels`
      );
    });

    return sortedColors;
  }

  private async analyzeGeometry(
    departmentMapPath: string,
    distributionMapPath: string
  ): Promise<{
    departmentDimensions: { width: number; height: number };
    distributionDimensions: { width: number; height: number };
    scale: { x: number; y: number };
  }> {
    console.log('📐 Analyse géométrique des cartes...');

    // Obtenir les dimensions des deux images
    const deptImage = sharp(departmentMapPath);
    const distImage = sharp(distributionMapPath);

    const deptInfo = await deptImage.metadata();
    const distInfo = await distImage.metadata();

    console.log(
      `📏 Carte départements: ${deptInfo.width}x${deptInfo.height}px`
    );
    console.log(
      `📏 Carte distribution: ${distInfo.width}x${distInfo.height}px`
    );

    // Calculer le facteur d'échelle
    const scaleX = distInfo.width! / deptInfo.width!;
    const scaleY = distInfo.height! / deptInfo.height!;

    console.log(
      `📊 Facteur d'échelle: X=${scaleX.toFixed(2)}, Y=${scaleY.toFixed(2)}`
    );

    return {
      departmentDimensions: { width: deptInfo.width, height: deptInfo.height },
      distributionDimensions: {
        width: distInfo.width,
        height: distInfo.height,
      },
      scale: { x: scaleX, y: scaleY },
    };
  }

  private inferDistributionStatus(colorData?: {
    rgb: string;
    count: number;
    hex: string;
    color: { r: number; g: number; b: number };
  }): string {
    if (!colorData) return 'non mappé';

    const { r, g, b } = colorData.color;

    // Correspondance approximative avec la légende
    if (g > 200 && r < 200 && b < 200) return 'assez commune à très commune';
    if (r > 200 && g > 150 && b < 100)
      return 'peu commune ou localement commune';
    if (r > 200 && g < 100 && b < 100) return 'rare ou assez rare';
    if (r < 100 && g < 100 && b > 150) return 'très rarement inventoriée';

    return 'statut à déterminer';
  }

  private async saveResults(result: MapComparison): Promise<void> {
    const outputPath = path.join(process.cwd(), 'map_comparison_results.json');
    await writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Résultats sauvegardés dans: ${outputPath}`);
  }

  async cleanup(): Promise<void> {
    await this.batExtractor.cleanup();
  }
}

// Script principal
async function main(): Promise<void> {
  const comparator = new MapComparator();

  try {
    await comparator.compareMaps();
  } catch (error) {
    console.error('❌ Erreur lors de la comparaison:', error);
  } finally {
    await comparator.cleanup();
    console.log('🧹 Nettoyage terminé');
  }
}

if (require.main === module) {
  main();
}
