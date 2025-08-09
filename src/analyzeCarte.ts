import { BatExtractor } from './batExtractor';
import { promises as fs } from 'fs';

async function analyzeCarte(): Promise<void> {
  const extractor = new BatExtractor('./temp_images');

  try {
    console.log('🗺️  Analyse approfondie de la carte de distribution');
    console.log('=================================================');

    await extractor.initialize('fra');

    const imagePath =
      './images/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png';

    // Configuration optimisée pour cartes géographiques
    console.log('🔍 Extraction avec paramètres optimisés pour cartes...');

    const mapResult = await extractor.extractFromImage(imagePath, {
      preprocess: true,
      imageOptions: {
        resize: { width: 2400 }, // Très haute résolution
        enhance: false,
        grayscale: false, // Garder les couleurs pour mieux distinguer les éléments
      },
      ocrOptions: {
        language: 'fra',
        tessJsOptions: {
          tessedit_pageseg_mode: '11', // Sparse text
          tessedit_char_whitelist:
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÉÈÊËÎÏÔÙÛÜÇàáâäéèêëíìîïóòôöúùûüýÿç0123456789 .-',
        },
      },
    });

    console.log('📊 Résultat extraction carte:');
    console.log('Confiance:', `${mapResult.confidence.toFixed(2)}%`);
    console.log('Texte extrait:', mapResult.text);
    console.log('\n' + '='.repeat(60) + '\n');

    // Liste élargie de termes géographiques
    const geoTerms = [
      // Départements
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

      // Régions
      'Auvergne-Rhône-Alpes',
      'Bourgogne-Franche-Comté',
      'Bretagne',
      'Centre-Val de Loire',
      'Corse',
      'Grand Est',
      'Hauts-de-France',
      'Île-de-France',
      'Normandie',
      'Nouvelle-Aquitaine',
      'Occitanie',
      'Pays de la Loire',
      "Provence-Alpes-Côte d'Azur",

      // Pays voisins (mentionnés dans la source)
      'France',
      'Belgique',
      'Luxembourg',
      'Suisse',

      // Villes importantes
      'Lyon',
      'Marseille',
      'Toulouse',
      'Lille',
      'Bordeaux',
      'Nantes',
      'Strasbourg',
      'Montpellier',
      'Rennes',
      'Reims',
      'Tours',
      'Nancy',
      'Metz',
      'Dijon',

      // Termes géographiques généraux
      'Nord',
      'Sud',
      'Est',
      'Ouest',
      'Centre',
    ];

    const foundTerms = new Set<string>();
    const text = mapResult.text.toLowerCase();

    console.log('🔍 Recherche de termes géographiques...');

    geoTerms.forEach(term => {
      const searchTerm = term.toLowerCase();
      if (text.includes(searchTerm)) {
        foundTerms.add(term);
        console.log(`✅ Terme géographique trouvé: ${term}`);
      }
    });

    // Recherche de patterns de codes postaux
    const postalCodePattern = /\b\d{5}\b/g;
    const postalCodes = mapResult.text.match(postalCodePattern) || [];

    console.log(`\n📮 Codes postaux détectés: ${postalCodes.length}`);
    postalCodes.forEach(code => {
      console.log(`  • ${code}`);
    });

    // Analyse du contenu spécifique à cette carte
    console.log('\n📋 ANALYSE SPÉCIFIQUE DE LA CARTE:');
    console.log('=================================');

    const specificInfo = {
      title: "Distribution de la Barbastelle d'Europe",
      source: 'Arthur L., Lemaire M. - 2021',
      publisher: 'Éditions Biotope, Mèze',
      museum: "Muséum national d'Histoire naturelle, Paris",
      countries: ['France', 'Belgique', 'Luxembourg', 'Suisse'],
      mapType: "Distribution d'espèce (Barbastelle d'Europe)",
      legend: {
        'très rare':
          'Espèce actuellement très rarement inventoriée ou exceptionnellement observée (moins de 5 données)',
        rare: 'Espèce actuellement rare ou assez rare',
        'peu commune': 'Espèce peu commune ou localement commune',
        'assez commune': 'Espèce assez commune à très commune',
        'mal connue': 'Espèce présente mais mal connue',
        disparue: 'Espèce disparue ou non retrouvée sur la zone',
        absente: "Espèce absente, n'ayant jamais été trouvée",
      },
    };

    console.log('📊 Type de carte:', specificInfo.mapType);
    console.log('🌍 Pays couverts:', specificInfo.countries.join(', '));
    console.log('📚 Source:', specificInfo.source);

    console.log('\n🎯 RÉSUMÉ:');
    console.log(`• ${foundTerms.size} termes géographiques détectés`);
    console.log(`• ${postalCodes.length} codes postaux détectés`);
    console.log(`• Type: Carte de distribution d'espèce`);
    console.log(
      `• Cette carte utilise des symboles/couleurs plutôt que des noms de départements`
    );

    // Sauvegarde des résultats
    const analysisResult = {
      extractedText: mapResult.text,
      confidence: mapResult.confidence,
      foundGeographicTerms: Array.from(foundTerms).sort(),
      postalCodes: postalCodes,
      mapAnalysis: specificInfo,
      note: "Cette carte de distribution utilise principalement des symboles et couleurs pour indiquer la présence de l'espèce. Les noms de départements ne sont pas directement visibles sur cette carte.",
    };

    await fs.writeFile(
      'carte_analysis.json',
      JSON.stringify(analysisResult, null, 2),
      'utf-8'
    );

    console.log('\n💾 Analyse complète sauvegardée dans carte_analysis.json');
  } catch (error) {
    console.error(
      '❌ Erreur:',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await extractor.cleanup();
  }
}

if (require.main === module) {
  analyzeCarte().catch(console.error);
}
