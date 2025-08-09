import { writeFile } from 'fs/promises';
import { SmartDepartmentExtractor } from './smartExtractor';

// Convertir le JSON en interface TypeScript
async function updateCoordinatesFromJSON(): Promise<void> {
  console.log('🔄 Mise à jour des coordonnées des départements...');

  // Lire le fichier de coordonnées taggées
  const coordsData = require('../department_coordinates.json');

  // Convertir vers notre format
  const updatedDepartments = Object.values(coordsData).map((coord: any) => ({
    code: coord.code,
    name: coord.name,
    region: getRegionFromCode(coord.code), // Fonction pour déterminer la région
    approximateCoords: { x: coord.x, y: coord.y },
  }));

  // Générer le code TypeScript mis à jour
  const tsCode = generateTypeScriptCode(updatedDepartments);

  console.log('✅ Coordonnées mises à jour avec succès !');
  console.log(
    `📍 ${updatedDepartments.length} départements avec nouvelles coordonnées`
  );

  return;
}

function getRegionFromCode(code: string): string {
  const regionMap: Record<string, string> = {
    '01': 'Auvergne-Rhône-Alpes',
    '02': 'Hauts-de-France',
    '03': 'Auvergne-Rhône-Alpes',
    '04': "Provence-Alpes-Côte d'Azur",
    '05': "Provence-Alpes-Côte d'Azur",
    '06': "Provence-Alpes-Côte d'Azur",
    '07': 'Auvergne-Rhône-Alpes',
    '08': 'Grand Est',
    '09': 'Occitanie',
    '10': 'Grand Est',
    '11': 'Occitanie',
    '12': 'Occitanie',
    '13': "Provence-Alpes-Côte d'Azur",
    '14': 'Normandie',
    '15': 'Auvergne-Rhône-Alpes',
    '16': 'Nouvelle-Aquitaine',
    '17': 'Nouvelle-Aquitaine',
    '18': 'Centre-Val de Loire',
    '19': 'Nouvelle-Aquitaine',
    '21': 'Bourgogne-Franche-Comté',
    '22': 'Bretagne',
    '23': 'Nouvelle-Aquitaine',
    '24': 'Nouvelle-Aquitaine',
    '25': 'Bourgogne-Franche-Comté',
    '26': 'Auvergne-Rhône-Alpes',
    '27': 'Normandie',
    '28': 'Centre-Val de Loire',
    '29': 'Bretagne',
    '30': 'Occitanie',
    '31': 'Occitanie',
    '32': 'Occitanie',
    '33': 'Nouvelle-Aquitaine',
    '34': 'Occitanie',
    '35': 'Bretagne',
    '36': 'Centre-Val de Loire',
    '37': 'Centre-Val de Loire',
    '38': 'Auvergne-Rhône-Alpes',
    '39': 'Bourgogne-Franche-Comté',
    '40': 'Nouvelle-Aquitaine',
    '41': 'Centre-Val de Loire',
    '42': 'Auvergne-Rhône-Alpes',
    '43': 'Auvergne-Rhône-Alpes',
    '44': 'Pays de la Loire',
    '45': 'Centre-Val de Loire',
    '46': 'Occitanie',
    '47': 'Nouvelle-Aquitaine',
    '48': 'Occitanie',
    '49': 'Pays de la Loire',
    '50': 'Normandie',
    '51': 'Grand Est',
    '52': 'Grand Est',
    '53': 'Pays de la Loire',
    '54': 'Grand Est',
    '55': 'Grand Est',
    '56': 'Bretagne',
    '57': 'Grand Est',
    '58': 'Bourgogne-Franche-Comté',
    '59': 'Hauts-de-France',
    '60': 'Hauts-de-France',
    '61': 'Normandie',
    '62': 'Hauts-de-France',
    '63': 'Auvergne-Rhône-Alpes',
    '64': 'Nouvelle-Aquitaine',
    '65': 'Occitanie',
    '66': 'Occitanie',
    '67': 'Grand Est',
    '68': 'Grand Est',
    '69': 'Auvergne-Rhône-Alpes',
    '70': 'Bourgogne-Franche-Comté',
    '71': 'Bourgogne-Franche-Comté',
    '72': 'Pays de la Loire',
    '73': 'Auvergne-Rhône-Alpes',
    '74': 'Auvergne-Rhône-Alpes',
    '75': 'Île-de-France',
    '76': 'Normandie',
    '77': 'Île-de-France',
    '78': 'Île-de-France',
    '79': 'Nouvelle-Aquitaine',
    '80': 'Hauts-de-France',
    '81': 'Occitanie',
    '82': 'Occitanie',
    '83': "Provence-Alpes-Côte d'Azur",
    '84': "Provence-Alpes-Côte d'Azur",
    '85': 'Pays de la Loire',
    '86': 'Nouvelle-Aquitaine',
    '87': 'Nouvelle-Aquitaine',
    '88': 'Grand Est',
    '89': 'Bourgogne-Franche-Comté',
    '90': 'Bourgogne-Franche-Comté',
    '91': 'Île-de-France',
    '92': 'Île-de-France',
    '93': 'Île-de-France',
    '94': 'Île-de-France',
    '95': 'Île-de-France',
  };

  return regionMap[code] || 'Région inconnue';
}

function generateTypeScriptCode(departments: any[]): string {
  let tsCode = 'private departments: FrenchDepartment[] = [\n';

  // Trier par code département
  departments.sort((a, b) => parseInt(a.code) - parseInt(b.code));

  departments.forEach((dept, index) => {
    tsCode += '    {\n';
    tsCode += `      code: '${dept.code}',\n`;
    tsCode += `      name: '${dept.name}',\n`;
    tsCode += `      region: '${dept.region}',\n`;
    tsCode += `      approximateCoords: { x: ${dept.approximateCoords.x.toFixed(6)}, y: ${dept.approximateCoords.y.toFixed(6)} },\n`;
    tsCode += '    }';

    if (index < departments.length - 1) {
      tsCode += ',';
    }
    tsCode += '\n';
  });

  tsCode += '  ];';

  console.log(
    '\n📝 Code TypeScript généré - Copiez ce code dans smartExtractor.ts:'
  );
  console.log('='.repeat(80));
  console.log(tsCode);
  console.log('='.repeat(80));

  return tsCode;
}

// Script principal
async function main(): Promise<void> {
  await updateCoordinatesFromJSON();

  // Maintenant faire l'extraction avec les nouvelles coordonnées
  console.log(
    "\n🚀 Lancement de l'extraction avec les coordonnées précises..."
  );
  const extractor = new SmartDepartmentExtractor();

  try {
    await extractor.extractDepartmentDistribution();
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction:", error);
  } finally {
    await extractor.cleanup();
  }
}

if (require.main === module) {
  main();
}
