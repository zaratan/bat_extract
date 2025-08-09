import { MapComparator } from './compareMaps';
import sharp from 'sharp';
import { writeFile } from 'fs/promises';

interface FrenchDepartment {
  code: string;
  name: string;
  region: string;
  approximateCoords: { x: number; y: number }; // Coordonnées relatives sur une carte de France
}

interface DepartmentColorMapping {
  department: FrenchDepartment;
  dominantColor: { r: number; g: number; b: number; hex: string } | null;
  distributionStatus: string;
  pixelCount: number;
}

export class SmartDepartmentExtractor {
  private comparator: MapComparator;

  // Liste des départements français avec coordonnées approximatives (0-1, normalisées)
  private departments: FrenchDepartment[] = [
    {
      code: '01',
      name: 'Ain',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.65, y: 0.55 },
    },
    {
      code: '02',
      name: 'Aisne',
      region: 'Hauts-de-France',
      approximateCoords: { x: 0.55, y: 0.25 },
    },
    {
      code: '03',
      name: 'Allier',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.55, y: 0.55 },
    },
    {
      code: '04',
      name: 'Alpes-de-Haute-Provence',
      region: "Provence-Alpes-Côte d'Azur",
      approximateCoords: { x: 0.75, y: 0.7 },
    },
    {
      code: '05',
      name: 'Hautes-Alpes',
      region: "Provence-Alpes-Côte d'Azur",
      approximateCoords: { x: 0.75, y: 0.65 },
    },
    {
      code: '06',
      name: 'Alpes-Maritimes',
      region: "Provence-Alpes-Côte d'Azur",
      approximateCoords: { x: 0.8, y: 0.75 },
    },
    {
      code: '07',
      name: 'Ardèche',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.65, y: 0.65 },
    },
    {
      code: '08',
      name: 'Ardennes',
      region: 'Grand Est',
      approximateCoords: { x: 0.65, y: 0.25 },
    },
    {
      code: '09',
      name: 'Ariège',
      region: 'Occitanie',
      approximateCoords: { x: 0.4, y: 0.85 },
    },
    {
      code: '10',
      name: 'Aube',
      region: 'Grand Est',
      approximateCoords: { x: 0.6, y: 0.4 },
    },
    {
      code: '11',
      name: 'Aude',
      region: 'Occitanie',
      approximateCoords: { x: 0.5, y: 0.8 },
    },
    {
      code: '12',
      name: 'Aveyron',
      region: 'Occitanie',
      approximateCoords: { x: 0.5, y: 0.7 },
    },
    {
      code: '13',
      name: 'Bouches-du-Rhône',
      region: "Provence-Alpes-Côte d'Azur",
      approximateCoords: { x: 0.7, y: 0.8 },
    },
    {
      code: '14',
      name: 'Calvados',
      region: 'Normandie',
      approximateCoords: { x: 0.35, y: 0.2 },
    },
    {
      code: '15',
      name: 'Cantal',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.5, y: 0.6 },
    },
    {
      code: '16',
      name: 'Charente',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.35, y: 0.55 },
    },
    {
      code: '17',
      name: 'Charente-Maritime',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.25, y: 0.55 },
    },
    {
      code: '18',
      name: 'Cher',
      region: 'Centre-Val de Loire',
      approximateCoords: { x: 0.5, y: 0.45 },
    },
    {
      code: '19',
      name: 'Corrèze',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.45, y: 0.6 },
    },
    {
      code: '21',
      name: "Côte-d'Or",
      region: 'Bourgogne-Franche-Comté',
      approximateCoords: { x: 0.65, y: 0.45 },
    },
    {
      code: '22',
      name: "Côtes-d'Armor",
      region: 'Bretagne',
      approximateCoords: { x: 0.15, y: 0.25 },
    },
    {
      code: '23',
      name: 'Creuse',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.45, y: 0.55 },
    },
    {
      code: '24',
      name: 'Dordogne',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.35, y: 0.65 },
    },
    {
      code: '25',
      name: 'Doubs',
      region: 'Bourgogne-Franche-Comté',
      approximateCoords: { x: 0.75, y: 0.45 },
    },
    {
      code: '26',
      name: 'Drôme',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.7, y: 0.65 },
    },
    {
      code: '27',
      name: 'Eure',
      region: 'Normandie',
      approximateCoords: { x: 0.4, y: 0.25 },
    },
    {
      code: '28',
      name: 'Eure-et-Loir',
      region: 'Centre-Val de Loire',
      approximateCoords: { x: 0.45, y: 0.35 },
    },
    {
      code: '29',
      name: 'Finistère',
      region: 'Bretagne',
      approximateCoords: { x: 0.05, y: 0.3 },
    },
    {
      code: '30',
      name: 'Gard',
      region: 'Occitanie',
      approximateCoords: { x: 0.65, y: 0.75 },
    },
    {
      code: '31',
      name: 'Haute-Garonne',
      region: 'Occitanie',
      approximateCoords: { x: 0.4, y: 0.8 },
    },
    {
      code: '32',
      name: 'Gers',
      region: 'Occitanie',
      approximateCoords: { x: 0.35, y: 0.8 },
    },
    {
      code: '33',
      name: 'Gironde',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.25, y: 0.65 },
    },
    {
      code: '34',
      name: 'Hérault',
      region: 'Occitanie',
      approximateCoords: { x: 0.6, y: 0.8 },
    },
    {
      code: '35',
      name: 'Ille-et-Vilaine',
      region: 'Bretagne',
      approximateCoords: { x: 0.2, y: 0.3 },
    },
    {
      code: '36',
      name: 'Indre',
      region: 'Centre-Val de Loire',
      approximateCoords: { x: 0.45, y: 0.5 },
    },
    {
      code: '37',
      name: 'Indre-et-Loire',
      region: 'Centre-Val de Loire',
      approximateCoords: { x: 0.4, y: 0.45 },
    },
    {
      code: '38',
      name: 'Isère',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.7, y: 0.6 },
    },
    {
      code: '39',
      name: 'Jura',
      region: 'Bourgogne-Franche-Comté',
      approximateCoords: { x: 0.7, y: 0.5 },
    },
    {
      code: '40',
      name: 'Landes',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.25, y: 0.75 },
    },
    {
      code: '41',
      name: 'Loir-et-Cher',
      region: 'Centre-Val de Loire',
      approximateCoords: { x: 0.45, y: 0.4 },
    },
    {
      code: '42',
      name: 'Loire',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.6, y: 0.6 },
    },
    {
      code: '43',
      name: 'Haute-Loire',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.55, y: 0.65 },
    },
    {
      code: '44',
      name: 'Loire-Atlantique',
      region: 'Pays de la Loire',
      approximateCoords: { x: 0.25, y: 0.4 },
    },
    {
      code: '45',
      name: 'Loiret',
      region: 'Centre-Val de Loire',
      approximateCoords: { x: 0.5, y: 0.4 },
    },
    {
      code: '46',
      name: 'Lot',
      region: 'Occitanie',
      approximateCoords: { x: 0.4, y: 0.7 },
    },
    {
      code: '47',
      name: 'Lot-et-Garonne',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.35, y: 0.7 },
    },
    {
      code: '48',
      name: 'Lozère',
      region: 'Occitanie',
      approximateCoords: { x: 0.6, y: 0.7 },
    },
    {
      code: '49',
      name: 'Maine-et-Loire',
      region: 'Pays de la Loire',
      approximateCoords: { x: 0.35, y: 0.4 },
    },
    {
      code: '50',
      name: 'Manche',
      region: 'Normandie',
      approximateCoords: { x: 0.3, y: 0.2 },
    },
    {
      code: '51',
      name: 'Marne',
      region: 'Grand Est',
      approximateCoords: { x: 0.6, y: 0.35 },
    },
    {
      code: '52',
      name: 'Haute-Marne',
      region: 'Grand Est',
      approximateCoords: { x: 0.65, y: 0.4 },
    },
    {
      code: '53',
      name: 'Mayenne',
      region: 'Pays de la Loire',
      approximateCoords: { x: 0.3, y: 0.35 },
    },
    {
      code: '54',
      name: 'Meurthe-et-Moselle',
      region: 'Grand Est',
      approximateCoords: { x: 0.75, y: 0.35 },
    },
    {
      code: '55',
      name: 'Meuse',
      region: 'Grand Est',
      approximateCoords: { x: 0.7, y: 0.35 },
    },
    {
      code: '56',
      name: 'Morbihan',
      region: 'Bretagne',
      approximateCoords: { x: 0.15, y: 0.35 },
    },
    {
      code: '57',
      name: 'Moselle',
      region: 'Grand Est',
      approximateCoords: { x: 0.75, y: 0.3 },
    },
    {
      code: '58',
      name: 'Nièvre',
      region: 'Bourgogne-Franche-Comté',
      approximateCoords: { x: 0.55, y: 0.5 },
    },
    {
      code: '59',
      name: 'Nord',
      region: 'Hauts-de-France',
      approximateCoords: { x: 0.55, y: 0.15 },
    },
    {
      code: '60',
      name: 'Oise',
      region: 'Hauts-de-France',
      approximateCoords: { x: 0.5, y: 0.25 },
    },
    {
      code: '61',
      name: 'Orne',
      region: 'Normandie',
      approximateCoords: { x: 0.35, y: 0.3 },
    },
    {
      code: '62',
      name: 'Pas-de-Calais',
      region: 'Hauts-de-France',
      approximateCoords: { x: 0.5, y: 0.15 },
    },
    {
      code: '63',
      name: 'Puy-de-Dôme',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.55, y: 0.6 },
    },
    {
      code: '64',
      name: 'Pyrénées-Atlantiques',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.2, y: 0.85 },
    },
    {
      code: '65',
      name: 'Hautes-Pyrénées',
      region: 'Occitanie',
      approximateCoords: { x: 0.3, y: 0.85 },
    },
    {
      code: '66',
      name: 'Pyrénées-Orientales',
      region: 'Occitanie',
      approximateCoords: { x: 0.55, y: 0.9 },
    },
    {
      code: '67',
      name: 'Bas-Rhin',
      region: 'Grand Est',
      approximateCoords: { x: 0.8, y: 0.35 },
    },
    {
      code: '68',
      name: 'Haut-Rhin',
      region: 'Grand Est',
      approximateCoords: { x: 0.8, y: 0.4 },
    },
    {
      code: '69',
      name: 'Rhône',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.65, y: 0.6 },
    },
    {
      code: '70',
      name: 'Haute-Saône',
      region: 'Bourgogne-Franche-Comté',
      approximateCoords: { x: 0.7, y: 0.45 },
    },
    {
      code: '71',
      name: 'Saône-et-Loire',
      region: 'Bourgogne-Franche-Comté',
      approximateCoords: { x: 0.6, y: 0.5 },
    },
    {
      code: '72',
      name: 'Sarthe',
      region: 'Pays de la Loire',
      approximateCoords: { x: 0.4, y: 0.35 },
    },
    {
      code: '73',
      name: 'Savoie',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.75, y: 0.6 },
    },
    {
      code: '74',
      name: 'Haute-Savoie',
      region: 'Auvergne-Rhône-Alpes',
      approximateCoords: { x: 0.75, y: 0.55 },
    },
    {
      code: '75',
      name: 'Paris',
      region: 'Île-de-France',
      approximateCoords: { x: 0.5, y: 0.3 },
    },
    {
      code: '76',
      name: 'Seine-Maritime',
      region: 'Normandie',
      approximateCoords: { x: 0.4, y: 0.2 },
    },
    {
      code: '77',
      name: 'Seine-et-Marne',
      region: 'Île-de-France',
      approximateCoords: { x: 0.55, y: 0.35 },
    },
    {
      code: '78',
      name: 'Yvelines',
      region: 'Île-de-France',
      approximateCoords: { x: 0.45, y: 0.3 },
    },
    {
      code: '79',
      name: 'Deux-Sèvres',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.3, y: 0.5 },
    },
    {
      code: '80',
      name: 'Somme',
      region: 'Hauts-de-France',
      approximateCoords: { x: 0.5, y: 0.2 },
    },
    {
      code: '81',
      name: 'Tarn',
      region: 'Occitanie',
      approximateCoords: { x: 0.5, y: 0.75 },
    },
    {
      code: '82',
      name: 'Tarn-et-Garonne',
      region: 'Occitanie',
      approximateCoords: { x: 0.4, y: 0.75 },
    },
    {
      code: '83',
      name: 'Var',
      region: "Provence-Alpes-Côte d'Azur",
      approximateCoords: { x: 0.75, y: 0.8 },
    },
    {
      code: '84',
      name: 'Vaucluse',
      region: "Provence-Alpes-Côte d'Azur",
      approximateCoords: { x: 0.7, y: 0.75 },
    },
    {
      code: '85',
      name: 'Vendée',
      region: 'Pays de la Loire',
      approximateCoords: { x: 0.25, y: 0.45 },
    },
    {
      code: '86',
      name: 'Vienne',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.35, y: 0.5 },
    },
    {
      code: '87',
      name: 'Haute-Vienne',
      region: 'Nouvelle-Aquitaine',
      approximateCoords: { x: 0.4, y: 0.6 },
    },
    {
      code: '88',
      name: 'Vosges',
      region: 'Grand Est',
      approximateCoords: { x: 0.75, y: 0.4 },
    },
    {
      code: '89',
      name: 'Yonne',
      region: 'Bourgogne-Franche-Comté',
      approximateCoords: { x: 0.55, y: 0.45 },
    },
    {
      code: '90',
      name: 'Territoire de Belfort',
      region: 'Bourgogne-Franche-Comté',
      approximateCoords: { x: 0.8, y: 0.45 },
    },
    {
      code: '91',
      name: 'Essonne',
      region: 'Île-de-France',
      approximateCoords: { x: 0.5, y: 0.35 },
    },
    {
      code: '92',
      name: 'Hauts-de-Seine',
      region: 'Île-de-France',
      approximateCoords: { x: 0.48, y: 0.3 },
    },
    {
      code: '93',
      name: 'Seine-Saint-Denis',
      region: 'Île-de-France',
      approximateCoords: { x: 0.52, y: 0.3 },
    },
    {
      code: '94',
      name: 'Val-de-Marne',
      region: 'Île-de-France',
      approximateCoords: { x: 0.52, y: 0.35 },
    },
    {
      code: '95',
      name: "Val-d'Oise",
      region: 'Île-de-France',
      approximateCoords: { x: 0.48, y: 0.28 },
    },
  ];

  constructor() {
    this.comparator = new MapComparator();
  }

  async extractDepartmentDistribution(): Promise<DepartmentColorMapping[]> {
    console.log(
      '🗺️  Extraction intelligente des départements avec distribution'
    );
    console.log('==========================================================');

    const distributionMapPath =
      './images/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png';

    console.log('📊 Analyse de la carte de distribution...');
    const image = sharp(distributionMapPath);
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log(`📐 Dimensions: ${info.width}x${info.height}px`);

    const departmentMappings: DepartmentColorMapping[] = [];

    // Pour chaque département, échantillonner les couleurs dans sa région approximative
    for (const department of this.departments) {
      console.log(`🔍 Analyse ${department.name} (${department.code})...`);

      const mapping = await this.analyzeDepartmentRegion(
        data,
        info.width!,
        info.height!,
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
    for (const [status, count] of statusStats.entries()) {
      console.log(`  ${status}: ${count} départements`);
    }

    return departmentMappings;
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
    const radius = 30;
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

    for (const [colorKey, count] of colorCounts.entries()) {
      if (count > maxCount && count > 10) {
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

    // Correspondance approximative avec la légende basée sur les couleurs observées
    // Vert clair (#96cb9d): espèce assez commune à très commune
    if (r >= 140 && r <= 160 && g >= 190 && g <= 210 && b >= 150 && b <= 170) {
      return 'assez commune à très commune';
    }

    // Vert jaunâtre (#dce7b1): espèce peu commune ou localement commune
    if (r >= 210 && r <= 230 && g >= 220 && g <= 240 && b >= 170 && b <= 190) {
      return 'peu commune ou localement commune';
    }

    // Orange (#f7a926): espèce rare ou assez rare
    if (r >= 240 && r <= 255 && g >= 160 && g <= 180 && b >= 30 && b <= 50) {
      return 'rare ou assez rare';
    }

    // Gris: espèce présente mais mal connue
    if (r >= 170 && r <= 190 && g >= 170 && g <= 190 && b >= 170 && b <= 190) {
      return 'présente mais mal connue';
    }

    // Rouge: très rarement inventoriée
    if (r >= 200 && g <= 100 && b <= 100) {
      return 'très rarement inventoriée';
    }

    return 'statut à déterminer';
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

    await writeFile(
      'smart_department_extraction.json',
      JSON.stringify(results, null, 2)
    );
    console.log(
      '💾 Résultats détaillés sauvegardés dans: smart_department_extraction.json'
    );
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
    await this.comparator.cleanup();
  }
}

// Script principal
async function main(): Promise<void> {
  const extractor = new SmartDepartmentExtractor();

  try {
    await extractor.extractDepartmentDistribution();
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction:", error);
  } finally {
    await extractor.cleanup();
    console.log('🧹 Nettoyage terminé');
  }
}

if (require.main === module) {
  main();
}
