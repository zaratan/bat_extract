import { promises as fs } from 'fs';
import path from 'path';

/**
 * Générateur d'outil interactif pour tagger les couleurs de la légende
 * Permet de cliquer sur chaque couleur pour associer le bon statut de distribution
 */
export class ColorLegendTagger {
  private readonly imageBasePath = path.join(process.cwd(), 'images');
  private readonly outputPath = path.join(
    process.cwd(),
    'color_legend_mapping.json'
  );

  /**
   * Génère l'interface HTML pour tagger les couleurs de la légende
   */
  async generateColorTaggerHTML(): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tagging des Couleurs de Légende - BatExtract</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
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
        .image-container {
            text-align: center;
            margin: 20px 0;
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            display: inline-block;
        }
        #mapImage {
            max-width: 100%;
            height: auto;
            cursor: crosshair;
            display: block;
        }
        .controls {
            display: flex;
            gap: 15px;
            align-items: center;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .status-selector {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        select {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            min-width: 200px;
        }
        .color-preview {
            width: 40px;
            height: 40px;
            border: 2px solid #333;
            border-radius: 4px;
            display: inline-block;
            margin-right: 10px;
        }
        .tagged-colors {
            margin-top: 20px;
        }
        .color-entry {
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #4caf50;
        }
        .color-entry .color-info {
            flex: 1;
            margin-left: 10px;
        }
        .color-entry .color-hex {
            font-family: monospace;
            font-weight: bold;
            color: #333;
        }
        .color-entry .color-status {
            color: #666;
            font-size: 14px;
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
        .status-info {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            line-height: 1.4;
        }
        .crosshair {
            position: absolute;
            pointer-events: none;
            z-index: 10;
        }
        .crosshair-h {
            width: 100%;
            height: 1px;
            background: red;
            position: absolute;
        }
        .crosshair-v {
            width: 1px;
            height: 100%;
            background: red;
            position: absolute;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Tagging des Couleurs de Légende</h1>
        
        <div class="instructions">
            <strong>Instructions :</strong>
            <ol>
                <li>Cliquez sur une couleur dans la légende de la carte</li>
                <li>Sélectionnez le statut de distribution correspondant</li>
                <li>Répétez pour toutes les couleurs de la légende</li>
                <li>Cliquez sur "Sauvegarder" pour enregistrer le mapping</li>
            </ol>
        </div>

        <div class="image-container" id="imageContainer">
            <img id="mapImage" src="plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png" alt="Carte de distribution">
            <div class="crosshair" id="crosshair" style="display: none;">
                <div class="crosshair-h" id="crosshairH"></div>
                <div class="crosshair-v" id="crosshairV"></div>
            </div>
        </div>

        <div class="controls">
            <div class="status-selector">
                <label for="statusSelect"><strong>Statut de distribution :</strong></label>
                <select id="statusSelect">
                    <option value="">-- Sélectionnez un statut --</option>
                    <option value="assez commune à très commune">Assez commune à très commune</option>
                    <option value="peu commune ou localement commune">Peu commune ou localement commune</option>
                    <option value="rare ou assez rare">Rare ou assez rare</option>
                    <option value="très rarement inventoriée">Très rarement inventoriée</option>
                    <option value="présente mais mal connue">Présente mais mal connue</option>
                </select>
            </div>
        </div>

        <div class="tagged-colors" id="taggedColors">
            <h3>🏷️ Couleurs taggées :</h3>
            <div id="colorList">
                <p><em>Aucune couleur taggée pour le moment</em></p>
            </div>
        </div>

        <div class="buttons">
            <button class="btn-secondary" onclick="clearAll()">Effacer tout</button>
            <button class="btn-primary" onclick="saveMapping()">💾 Sauvegarder le mapping</button>
        </div>

        <div class="status-info">
            <strong>Info :</strong> Cliquez précisément sur chaque couleur de la légende pour créer le mapping couleur → statut.
            Les coordonnées et couleurs RGB seront automatiquement détectées.
        </div>
    </div>

    <script>
        let colorMapping = {};
        let imageNaturalDimensions = { width: 0, height: 0 };

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            const img = document.getElementById('mapImage');
            img.onload = function() {
                imageNaturalDimensions.width = this.naturalWidth;
                imageNaturalDimensions.height = this.naturalHeight;
                console.log('Image dimensions:', imageNaturalDimensions);
            };
        });

        // Gestion du clic sur l'image
        document.getElementById('mapImage').addEventListener('click', function(e) {
            const statusSelect = document.getElementById('statusSelect');
            const selectedStatus = statusSelect.value;
            
            if (!selectedStatus) {
                alert('Veuillez d\\'abord sélectionner un statut de distribution !');
                return;
            }

            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Coordonnées normalisées (0-1)
            const normalizedX = x / rect.width;
            const normalizedY = y / rect.height;
            
            // Coordonnées en pixels sur l'image originale
            const actualX = Math.round(normalizedX * imageNaturalDimensions.width);
            const actualY = Math.round(normalizedY * imageNaturalDimensions.height);

            // Créer un canvas pour lire la couleur du pixel
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.naturalWidth;
            canvas.height = this.naturalHeight;
            
            // Dessiner l'image dans le canvas
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                ctx.drawImage(img, 0, 0);
                
                // Lire la couleur du pixel
                const imageData = ctx.getImageData(actualX, actualY, 1, 1);
                const [r, g, b] = imageData.data;
                const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                
                // Ajouter au mapping
                colorMapping[hex] = {
                    hex: hex,
                    rgb: { r, g, b },
                    status: selectedStatus,
                    coordinates: { x: normalizedX, y: normalizedY },
                    pixelCoords: { x: actualX, y: actualY }
                };
                
                updateColorList();
                statusSelect.value = ''; // Reset selection
                
                console.log('Couleur ajoutée:', hex, 'Status:', selectedStatus);
            };
            img.src = this.src;
        });

        // Gestion du survol pour afficher le crosshair
        document.getElementById('mapImage').addEventListener('mousemove', function(e) {
            const crosshair = document.getElementById('crosshair');
            const crosshairH = document.getElementById('crosshairH');
            const crosshairV = document.getElementById('crosshairV');
            const rect = this.getBoundingClientRect();
            
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            crosshair.style.display = 'block';
            crosshairH.style.top = y + 'px';
            crosshairV.style.left = x + 'px';
        });

        document.getElementById('mapImage').addEventListener('mouseleave', function() {
            document.getElementById('crosshair').style.display = 'none';
        });

        // Mise à jour de la liste des couleurs
        function updateColorList() {
            const colorList = document.getElementById('colorList');
            
            if (Object.keys(colorMapping).length === 0) {
                colorList.innerHTML = '<p><em>Aucune couleur taggée pour le moment</em></p>';
                return;
            }
            
            let html = '';
            for (const [hex, data] of Object.entries(colorMapping)) {
                html += \`
                    <div class="color-entry">
                        <div class="color-preview" style="background-color: \${hex};"></div>
                        <div class="color-info">
                            <div class="color-hex">\${hex} (R:\${data.rgb.r}, G:\${data.rgb.g}, B:\${data.rgb.b})</div>
                            <div class="color-status">\${data.status}</div>
                        </div>
                        <button onclick="removeColor('\${hex}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">✕</button>
                    </div>
                \`;
            }
            colorList.innerHTML = html;
        }

        // Supprimer une couleur
        function removeColor(hex) {
            delete colorMapping[hex];
            updateColorList();
        }

        // Effacer tout
        function clearAll() {
            if (confirm('Êtes-vous sûr de vouloir effacer toutes les couleurs taggées ?')) {
                colorMapping = {};
                updateColorList();
            }
        }

        // Sauvegarder le mapping
        function saveMapping() {
            if (Object.keys(colorMapping).length === 0) {
                alert('Veuillez d\\'abord tagger au moins une couleur !');
                return;
            }

            const dataToSave = {
                metadata: {
                    creationDate: new Date().toISOString(),
                    totalColors: Object.keys(colorMapping).length,
                    imageSource: 'Barbastelle d\\'Europe - Distribution Atlas'
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
            
            alert(\`Mapping sauvegardé avec \${Object.keys(colorMapping).length} couleurs !\`);
        }
    </script>
</body>
</html>`;

    const htmlPath = path.join(process.cwd(), 'color_legend_tagger.html');
    await fs.writeFile(htmlPath, htmlContent, 'utf8');

    console.log('🎨 Interface de tagging des couleurs générée !');
    console.log(`📁 Fichier créé: ${htmlPath}`);
    console.log(
      '🚀 Ouvrez ce fichier dans votre navigateur pour commencer le tagging'
    );
    console.log(
      '💡 Cliquez sur chaque couleur de la légende et associez-la au bon statut'
    );
  }

  /**
   * Lance la génération de l'interface HTML
   */
  async run(): Promise<void> {
    try {
      await this.generateColorTaggerHTML();
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      throw error;
    }
  }
}

// Exécution directe du script
if (require.main === module) {
  const tagger = new ColorLegendTagger();
  tagger.run().catch(console.error);
}
