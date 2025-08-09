import sharp from 'sharp';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

interface DepartmentCoordinate {
  code: string;
  name: string;
  x: number;
  y: number;
  clicked: boolean;
}

export class DepartmentTagger {
  private departments = [
    { code: '01', name: 'Ain' },
    { code: '02', name: 'Aisne' },
    { code: '03', name: 'Allier' },
    { code: '04', name: 'Alpes-de-Haute-Provence' },
    { code: '05', name: 'Hautes-Alpes' },
    { code: '06', name: 'Alpes-Maritimes' },
    { code: '07', name: 'Ardèche' },
    { code: '08', name: 'Ardennes' },
    { code: '09', name: 'Ariège' },
    { code: '10', name: 'Aube' },
    // ... (liste complète)
  ];

  async createTaggingInterface(): Promise<void> {
    console.log("🗺️  Création de l'interface de tagging des départements");
    console.log('====================================================');

    const imagePath =
      './images/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png';

    // Générer une page HTML interactive
    const htmlContent = await this.generateTaggingHTML(imagePath);

    await writeFile('department_tagger.html', htmlContent);

    console.log('✅ Interface créée: department_tagger.html');
    console.log('📋 Instructions:');
    console.log('   1. Ouvrez department_tagger.html dans votre navigateur');
    console.log('   2. Cliquez sur le centre de chaque département');
    console.log('   3. Les coordonnées seront sauvegardées automatiquement');
    console.log(
      '   4. Utilisez les fichiers JSON générés pour mettre à jour le code'
    );
  }

  private async generateTaggingHTML(imagePath: string): Promise<string> {
    const imageBase64 = await this.imageToBase64(imagePath);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tagging des Départements - Barbastelle d'Europe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .map-container {
            position: relative;
            display: inline-block;
            border: 2px solid #333;
        }
        .map-image {
            display: block;
            max-width: 100%;
            cursor: crosshair;
        }
        .department-dot {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #ff4444;
            border: 2px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .department-label {
            position: absolute;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            transform: translate(-50%, -120%);
            white-space: nowrap;
        }
        .info-panel {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .department-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }
        .department-item {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
            background: white;
        }
        .department-item.tagged {
            background: #d4edda;
            border-color: #28a745;
        }
        .export-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
        }
        .export-btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗺️ Tagging des Départements - Distribution de la Barbastelle d'Europe</h1>
        <p><strong>Instructions:</strong> Cliquez sur le centre de chaque département pour enregistrer ses coordonnées.</p>
        
        <div class="map-container" id="mapContainer">
            <img src="data:image/png;base64,${imageBase64}" 
                 class="map-image" 
                 id="mapImage" 
                 alt="Carte de distribution">
        </div>
        
        <div class="info-panel">
            <h3>Départements à taguer:</h3>
            <div class="department-list" id="departmentList"></div>
            
            <button class="export-btn" onclick="exportCoordinates()">
                📥 Exporter les coordonnées (JSON)
            </button>
            
            <div id="progress" style="margin-top: 10px;">
                <strong>Progression: <span id="progressText">0/101 départements</span></strong>
            </div>
        </div>
    </div>

    <script>
        const departments = ${JSON.stringify(this.getAllDepartments())};
        let taggedDepartments = {};
        let currentDepartmentIndex = 0;

        // Initialiser l'interface
        function initInterface() {
            const list = document.getElementById('departmentList');
            departments.forEach((dept, index) => {
                const item = document.createElement('div');
                item.className = 'department-item';
                item.id = 'dept-' + dept.code;
                item.innerHTML = dept.code + ' - ' + dept.name;
                if (index === 0) item.style.background = '#fff3cd';
                list.appendChild(item);
            });
            
            updateProgress();
        }

        // Gestion des clics sur la carte
        document.getElementById('mapImage').addEventListener('click', function(e) {
            if (currentDepartmentIndex >= departments.length) {
                alert('Tous les départements ont été tagués !');
                return;
            }

            const rect = this.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            const currentDept = departments[currentDepartmentIndex];
            
            // Enregistrer les coordonnées
            taggedDepartments[currentDept.code] = {
                code: currentDept.code,
                name: currentDept.name,
                x: x,
                y: y,
                absoluteX: e.clientX - rect.left,
                absoluteY: e.clientY - rect.top
            };
            
            // Ajouter un point visuel
            addDepartmentDot(e.clientX - rect.left, e.clientY - rect.top, currentDept);
            
            // Marquer comme tagué
            document.getElementById('dept-' + currentDept.code).className = 'department-item tagged';
            
            // Passer au suivant
            currentDepartmentIndex++;
            if (currentDepartmentIndex < departments.length) {
                document.getElementById('dept-' + departments[currentDepartmentIndex].code).style.background = '#fff3cd';
            }
            
            updateProgress();
            
            console.log('Tagué:', currentDept.name, 'Coordonnées:', x.toFixed(3), y.toFixed(3));
        });

        function addDepartmentDot(x, y, dept) {
            const container = document.getElementById('mapContainer');
            
            const dot = document.createElement('div');
            dot.className = 'department-dot';
            dot.style.left = x + 'px';
            dot.style.top = y + 'px';
            
            const label = document.createElement('div');
            label.className = 'department-label';
            label.textContent = dept.code;
            label.style.left = x + 'px';
            label.style.top = y + 'px';
            
            container.appendChild(dot);
            container.appendChild(label);
        }

        function updateProgress() {
            const total = departments.length;
            const tagged = Object.keys(taggedDepartments).length;
            document.getElementById('progressText').textContent = tagged + '/' + total + ' départements';
        }

        function exportCoordinates() {
            const dataStr = JSON.stringify(taggedDepartments, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'department_coordinates.json';
            link.click();
            
            console.log('Coordonnées exportées:', taggedDepartments);
            
            // Aussi afficher le code TypeScript
            generateTypeScriptCode();
        }

        function generateTypeScriptCode() {
            let tsCode = 'private departments: FrenchDepartment[] = [\\n';
            
            Object.values(taggedDepartments).forEach(dept => {
                tsCode += '  {\\n';
                tsCode += '    code: "' + dept.code + '",\\n';
                tsCode += '    name: "' + dept.name + '",\\n';
                tsCode += '    region: "...", // À compléter\\n';
                tsCode += '    approximateCoords: { x: ' + dept.x.toFixed(3) + ', y: ' + dept.y.toFixed(3) + ' },\\n';
                tsCode += '  },\\n';
            });
            
            tsCode += '];';
            
            console.log('Code TypeScript généré:');
            console.log(tsCode);
        }

        // Initialiser au chargement
        window.onload = initInterface;
    </script>
</body>
</html>`;
  }

  private async imageToBase64(imagePath: string): Promise<string> {
    const imageBuffer = await readFile(imagePath);
    return imageBuffer.toString('base64');
  }

  private getAllDepartments() {
    return [
      { code: '01', name: 'Ain' },
      { code: '02', name: 'Aisne' },
      { code: '03', name: 'Allier' },
      { code: '04', name: 'Alpes-de-Haute-Provence' },
      { code: '05', name: 'Hautes-Alpes' },
      { code: '06', name: 'Alpes-Maritimes' },
      { code: '07', name: 'Ardèche' },
      { code: '08', name: 'Ardennes' },
      { code: '09', name: 'Ariège' },
      { code: '10', name: 'Aube' },
      { code: '11', name: 'Aude' },
      { code: '12', name: 'Aveyron' },
      { code: '13', name: 'Bouches-du-Rhône' },
      { code: '14', name: 'Calvados' },
      { code: '15', name: 'Cantal' },
      { code: '16', name: 'Charente' },
      { code: '17', name: 'Charente-Maritime' },
      { code: '18', name: 'Cher' },
      { code: '19', name: 'Corrèze' },
      { code: '21', name: "Côte-d'Or" },
      { code: '22', name: "Côtes-d'Armor" },
      { code: '23', name: 'Creuse' },
      { code: '24', name: 'Dordogne' },
      { code: '25', name: 'Doubs' },
      { code: '26', name: 'Drôme' },
      { code: '27', name: 'Eure' },
      { code: '28', name: 'Eure-et-Loir' },
      { code: '29', name: 'Finistère' },
      { code: '30', name: 'Gard' },
      { code: '31', name: 'Haute-Garonne' },
      { code: '32', name: 'Gers' },
      { code: '33', name: 'Gironde' },
      { code: '34', name: 'Hérault' },
      { code: '35', name: 'Ille-et-Vilaine' },
      { code: '36', name: 'Indre' },
      { code: '37', name: 'Indre-et-Loire' },
      { code: '38', name: 'Isère' },
      { code: '39', name: 'Jura' },
      { code: '40', name: 'Landes' },
      { code: '41', name: 'Loir-et-Cher' },
      { code: '42', name: 'Loire' },
      { code: '43', name: 'Haute-Loire' },
      { code: '44', name: 'Loire-Atlantique' },
      { code: '45', name: 'Loiret' },
      { code: '46', name: 'Lot' },
      { code: '47', name: 'Lot-et-Garonne' },
      { code: '48', name: 'Lozère' },
      { code: '49', name: 'Maine-et-Loire' },
      { code: '50', name: 'Manche' },
      { code: '51', name: 'Marne' },
      { code: '52', name: 'Haute-Marne' },
      { code: '53', name: 'Mayenne' },
      { code: '54', name: 'Meurthe-et-Moselle' },
      { code: '55', name: 'Meuse' },
      { code: '56', name: 'Morbihan' },
      { code: '57', name: 'Moselle' },
      { code: '58', name: 'Nièvre' },
      { code: '59', name: 'Nord' },
      { code: '60', name: 'Oise' },
      { code: '61', name: 'Orne' },
      { code: '62', name: 'Pas-de-Calais' },
      { code: '63', name: 'Puy-de-Dôme' },
      { code: '64', name: 'Pyrénées-Atlantiques' },
      { code: '65', name: 'Hautes-Pyrénées' },
      { code: '66', name: 'Pyrénées-Orientales' },
      { code: '67', name: 'Bas-Rhin' },
      { code: '68', name: 'Haut-Rhin' },
      { code: '69', name: 'Rhône' },
      { code: '70', name: 'Haute-Saône' },
      { code: '71', name: 'Saône-et-Loire' },
      { code: '72', name: 'Sarthe' },
      { code: '73', name: 'Savoie' },
      { code: '74', name: 'Haute-Savoie' },
      { code: '75', name: 'Paris' },
      { code: '76', name: 'Seine-Maritime' },
      { code: '77', name: 'Seine-et-Marne' },
      { code: '78', name: 'Yvelines' },
      { code: '79', name: 'Deux-Sèvres' },
      { code: '80', name: 'Somme' },
      { code: '81', name: 'Tarn' },
      { code: '82', name: 'Tarn-et-Garonne' },
      { code: '83', name: 'Var' },
      { code: '84', name: 'Vaucluse' },
      { code: '85', name: 'Vendée' },
      { code: '86', name: 'Vienne' },
      { code: '87', name: 'Haute-Vienne' },
      { code: '88', name: 'Vosges' },
      { code: '89', name: 'Yonne' },
      { code: '90', name: 'Territoire de Belfort' },
      { code: '91', name: 'Essonne' },
      { code: '92', name: 'Hauts-de-Seine' },
      { code: '93', name: 'Seine-Saint-Denis' },
      { code: '94', name: 'Val-de-Marne' },
      { code: '95', name: "Val-d'Oise" },
    ];
  }
}

// Script principal
async function main(): Promise<void> {
  const tagger = new DepartmentTagger();
  await tagger.createTaggingInterface();
}

if (require.main === module) {
  main();
}
