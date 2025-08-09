import { BatExtractor } from './batExtractor';
import { promises as fs } from 'fs';

async function extractDepartments(): Promise<void> {
  const extractor = new BatExtractor('./temp_images');

  try {
    console.log('🗺️  Extraction des départements depuis la carte');
    console.log('==============================================');

    // Initialisation
    console.log('📋 Initialisation...');
    await extractor.initialize('fra');

    const imagePath =
      './images/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png';

    console.log(`🔍 Analyse de: ${imagePath}`);

    // Configuration optimisée pour extraire les départements sur une carte
    console.log('🔍 Extraction optimisée pour les départements...');

    // Test 1: Augmentation de la résolution pour mieux voir les petits textes
    const highResResult = await extractor.extractFromImage(imagePath, {
      preprocess: true,
      imageOptions: {
        resize: { width: 2000 }, // Augmentation significative de la résolution
        enhance: false, // Pas d'enhancement pour préserver les détails fins
        grayscale: true,
      },
      ocrOptions: {
        language: 'fra',
        tessJsOptions: {
          tessedit_char_whitelist:
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -',
          tessedit_pageseg_mode: '6', // Assume a single uniform block of text
        },
      },
    });

    console.log('📍 Résultat haute résolution:');
    console.log('Confiance:', `${highResResult.confidence.toFixed(2)}%`);
    console.log('Texte extrait:', highResResult.text);
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Configuration pour texte éparpillé (noms de départements sur carte)
    const scatteredTextResult = await extractor.extractFromImage(imagePath, {
      preprocess: true,
      imageOptions: {
        resize: { width: 1600 },
        enhance: true,
        grayscale: true,
      },
      ocrOptions: {
        language: 'fra',
        tessJsOptions: {
          tessedit_pageseg_mode: '8', // Treat the image as a single word
          tessedit_char_whitelist:
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -',
        },
      },
    });

    console.log('📍 Résultat texte éparpillé:');
    console.log('Confiance:', `${scatteredTextResult.confidence.toFixed(2)}%`);
    console.log('Texte extrait:', scatteredTextResult.text);
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Mode détection automatique
    const autoResult = await extractor.extractFromImage(imagePath, {
      preprocess: true,
      imageOptions: {
        resize: { width: 1800 },
        enhance: true,
        grayscale: true,
      },
      ocrOptions: {
        language: 'fra',
        tessJsOptions: {
          tessedit_pageseg_mode: '3', // Fully automatic page segmentation, but no OSD
        },
      },
    });

    console.log('📍 Résultat détection automatique:');
    console.log('Confiance:', `${autoResult.confidence.toFixed(2)}%`);
    console.log('Texte extrait:', autoResult.text);

    // Analyse des résultats pour extraire les départements
    console.log('\n🔍 ANALYSE DES DÉPARTEMENTS DÉTECTÉS:');
    console.log('====================================');

    const allTexts = [
      highResResult.text,
      scatteredTextResult.text,
      autoResult.text,
    ];

    // Liste des départements français pour la validation
    const departmentsList = [
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

    const foundDepartments = new Set<string>();

    allTexts.forEach((text, index) => {
      console.log(`\n📋 Analyse du résultat ${index + 1}:`);
      departmentsList.forEach(dept => {
        if (text.toLowerCase().includes(dept.toLowerCase())) {
          foundDepartments.add(dept);
          console.log(`✅ Département trouvé: ${dept}`);
        }
      });
    });

    console.log(`\n🎯 RÉSUMÉ: ${foundDepartments.size} départements détectés:`);
    Array.from(foundDepartments)
      .sort()
      .forEach(dept => {
        console.log(`  • ${dept}`);
      });

    // Sauvegarde des résultats
    const departmentResults = {
      foundDepartments: Array.from(foundDepartments).sort(),
      extractions: [
        {
          method: 'highResolution',
          confidence: highResResult.confidence,
          text: highResResult.text,
        },
        {
          method: 'scatteredText',
          confidence: scatteredTextResult.confidence,
          text: scatteredTextResult.text,
        },
        {
          method: 'autoDetection',
          confidence: autoResult.confidence,
          text: autoResult.text,
        },
      ],
    };

    // Utilisation de fs pour sauvegarder directement
    await fs.writeFile(
      'departments_results.json',
      JSON.stringify(departmentResults, null, 2),
      'utf-8'
    );
    console.log('\n💾 Résultats sauvegardés dans departments_results.json');
  } catch (error) {
    console.error(
      '❌ Erreur:',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await extractor.cleanup();
  }
}

// Exécution de l'extraction des départements
if (require.main === module) {
  extractDepartments().catch(console.error);
}
