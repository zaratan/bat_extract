/**
 * Outil simple pour corriger le mapping des couleurs détectées
 */

import { promises as fs } from 'fs';
import path from 'path';

export class SimpleColorTagger {
  async generateSimpleColorInterface(): Promise<void> {
    // Lire les couleurs déjà détectées depuis les résultats
    const resultsPath = path.join(
      process.cwd(),
      'smart_department_extraction.json'
    );
    let detectedColors: Record<string, string> = {};

    try {
      const results = JSON.parse(await fs.readFile(resultsPath, 'utf8'));

      // Extraire toutes les couleurs uniques détectées
      const colorSet = new Set<string>();
      results.departments.forEach((dept: any) => {
        if (dept.color && dept.color.hex) {
          colorSet.add(dept.color.hex);
        }
      });

      // Initialiser avec les mappings actuels
      colorSet.forEach(hex => {
        const dept = results.departments.find((d: any) => d.color?.hex === hex);
        if (dept) {
          detectedColors[hex] = dept.distributionStatus;
        }
      });
    } catch (error) {
      console.log(
        'Pas de résultats précédents trouvés, démarrage avec les couleurs de base'
      );
      // Couleurs de base si pas de résultats
      detectedColors = {
        '#96cb9d': 'assez commune à très commune',
        '#dce7b1': 'peu commune ou localement commune',
        '#f7a926': 'rare ou assez rare',
        '#ea5459': 'très rarement inventoriée',
        '#b1b2b4': 'présente mais mal connue',
      };
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Correction du Mapping des Couleurs - BatExtract</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .instructions {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #2196f3;
        }
        .color-item {
            display: flex;
            align-items: center;
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        .color-preview {
            width: 60px;
            height: 60px;
            border: 2px solid #333;
            border-radius: 8px;
            margin-right: 20px;
            flex-shrink: 0;
        }
        .color-info {
            flex: 1;
            margin-right: 20px;
        }
        .color-hex {
            font-family: monospace;
            font-weight: bold;
            font-size: 18px;
            color: #333;
            margin-bottom: 5px;
        }
        .color-rgb {
            font-family: monospace;
            color: #666;
            font-size: 14px;
        }
        .status-select {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            min-width: 250px;
        }
        .buttons {
            text-align: center;
            margin-top: 30px;
            gap: 10px;
            display: flex;
            justify-content: center;
        }
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        .btn-primary {
            background-color: #4caf50;
            color: white;
        }
        .btn-primary:hover {
            background-color: #45a049;
        }
        .btn-secondary {
            background-color: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background-color: #5a6268;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Correction du Mapping des Couleurs</h1>
        
        <div class="instructions">
            <strong>Instructions :</strong>
            <p>Voici les couleurs détectées automatiquement. Corrigez les statuts de distribution si nécessaire.</p>
        </div>

        <div id="colorList">
            ${Object.entries(detectedColors)
              .map(([hex, status]) => {
                // Convertir hex en RGB pour affichage
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);

                return `
                <div class="color-item">
                    <div class="color-preview" style="background-color: ${hex};"></div>
                    <div class="color-info">
                        <div class="color-hex">${hex}</div>
                        <div class="color-rgb">R:${r}, G:${g}, B:${b}</div>
                    </div>
                    <select class="status-select" data-color="${hex}">
                        <option value="assez commune à très commune" ${status === 'assez commune à très commune' ? 'selected' : ''}>Assez commune à très commune</option>
                        <option value="peu commune ou localement commune" ${status === 'peu commune ou localement commune' ? 'selected' : ''}>Peu commune ou localement commune</option>
                        <option value="rare ou assez rare" ${status === 'rare ou assez rare' ? 'selected' : ''}>Rare ou assez rare</option>
                        <option value="très rarement inventoriée" ${status === 'très rarement inventoriée' ? 'selected' : ''}>Très rarement inventoriée</option>
                        <option value="présente mais mal connue" ${status === 'présente mais mal connue' ? 'selected' : ''}>Présente mais mal connue</option>
                    </select>
                </div>
              `;
              })
              .join('')}
        </div>

        <div class="buttons">
            <button class="btn-primary" onclick="saveColorMapping()">💾 Sauvegarder le mapping corrigé</button>
        </div>
    </div>

    <script>
        function saveColorMapping() {
            const colorMapping = {};
            
            // Récupérer tous les selects
            document.querySelectorAll('.status-select').forEach(select => {
                const hex = select.getAttribute('data-color');
                const status = select.value;
                
                // Convertir hex en RGB
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                
                colorMapping[hex] = {
                    hex: hex,
                    rgb: { r, g, b },
                    status: status
                };
            });

            const dataToSave = {
                metadata: {
                    creationDate: new Date().toISOString(),
                    totalColors: Object.keys(colorMapping).length,
                    source: 'Manual correction of detected colors'
                },
                colorMapping: colorMapping
            };

            // Créer un fichier JSON téléchargeable
            const dataStr = JSON.stringify(dataToSave, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'color_legend_mapping.json';
            link.click();
            
            URL.revokeObjectURL(url);
            
            alert(\`Mapping corrigé sauvegardé avec \${Object.keys(colorMapping).length} couleurs !\`);
        }
    </script>
</body>
</html>`;

    const htmlPath = path.join(process.cwd(), 'simple_color_tagger.html');
    await fs.writeFile(htmlPath, htmlContent, 'utf8');

    console.log('🎨 Interface simple de correction des couleurs générée !');
    console.log(`📁 Fichier créé: ${htmlPath}`);
    console.log(
      '✅ Interface beaucoup plus simple avec les couleurs déjà détectées'
    );
    console.log('🔧 Vous pouvez maintenant corriger les statuts si nécessaire');
  }

  async run(): Promise<void> {
    try {
      await this.generateSimpleColorInterface();
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      throw error;
    }
  }
}

// Exécution directe du script
if (require.main === module) {
  const tagger = new SimpleColorTagger();
  tagger.run().catch(console.error);
}
