import ExcelJS from 'exceljs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import {
  COLOR_LEGEND_MAPPING,
  ColorLegendEntry,
} from '../data/color-legend-mapping.js';

interface SpeciesData {
  speciesName: string;
  departments: {
    [departmentCode: string]: {
      name: string;
      distributionStatus: string;
      color?: { hex: string };
    };
  };
}

export class ExcelReportGenerator {
  private readonly outputDir: string;
  private readonly reportPath: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir || join(process.cwd(), 'output');
    this.reportPath = join(this.outputDir, 'bat-distribution-matrix.xlsx');
  }

  async generateReport(): Promise<void> {
    console.log('🦇 Génération du rapport Excel multi-espèces...');
    console.log('📊 Création de la matrice espèces × départements');

    // Lire tous les fichiers JSON d'extraction
    const speciesDataList = await this.loadAllSpeciesData();

    if (speciesDataList.length === 0) {
      throw new Error("Aucune donnée d'espèce trouvée dans le dossier output/");
    }

    console.log(`📋 ${speciesDataList.length} espèce(s) chargée(s)`);

    // Créer le workbook Excel
    const workbook = new ExcelJS.Workbook();

    // Page 1: Matrice des données
    await this.createDataMatrix(workbook, speciesDataList);

    // Page 2: Légende
    await this.createLegendSheet(workbook);

    // Sauvegarder le fichier
    await workbook.xlsx.writeFile(this.reportPath);
    console.log(`💾 Rapport Excel généré: ${this.reportPath}`);
  }

  private async loadAllSpeciesData(): Promise<SpeciesData[]> {
    const files = await readdir(this.outputDir);
    const jsonFiles = files.filter(
      file =>
        file.endsWith('-distribution.json') && !file.includes('consolidated')
    );

    const speciesDataList: SpeciesData[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = join(this.outputDir, file);
        const content = await readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        const speciesName = this.extractSpeciesNameFromFilename(file);
        const departments: {
          [code: string]: {
            name: string;
            distributionStatus: string;
            color?: { hex: string };
          };
        } = {};

        // Transformer les données en format utilisable
        if (Array.isArray(data)) {
          // Format tableau direct
          data.forEach(
            (dept: {
              department: {
                code: string;
                name: string;
              };
              distributionStatus: string;
              dominantColor?: { hex: string };
            }) => {
              departments[dept.department.code] = {
                name: dept.department.name,
                distributionStatus: dept.distributionStatus,
                color: dept.dominantColor,
              };
            }
          );
        } else if (data.departments) {
          // Format objet avec propriété departments
          data.departments.forEach(
            (dept: {
              code: string;
              name: string;
              distributionStatus: string;
              color?: { hex: string };
            }) => {
              departments[dept.code] = {
                name: dept.name,
                distributionStatus: dept.distributionStatus,
                color: dept.color,
              };
            }
          );
        }

        speciesDataList.push({
          speciesName,
          departments,
        });
      } catch (error) {
        console.warn(`⚠️  Erreur lors du chargement de ${file}:`, error);
      }
    }

    return speciesDataList.sort((a, b) =>
      a.speciesName.localeCompare(b.speciesName)
    );
  }

  private extractSpeciesNameFromFilename(filename: string): string {
    // Extraire le nom de l'espèce du nom de fichier
    // Ex: "barbastelle-deurope-distribution.json" -> "Barbastelle d'Europe"
    const baseName = filename.replace('-distribution.json', '');
    return baseName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/deurope/gi, "d'Europe")
      .replace(/dalcathoe/gi, "d'Alcathoe")
      .replace(/dor/gi, "d'Or");
  }

  private async createDataMatrix(
    workbook: ExcelJS.Workbook,
    speciesDataList: SpeciesData[]
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Distribution par Département');

    // Obtenir la liste de tous les départements (01-95)
    const allDepartments = this.getAllDepartmentCodes();

    // Largeur des colonnes
    worksheet.getColumn(1).width = 25; // Colonne espèces
    allDepartments.forEach((_, index) => {
      worksheet.getColumn(index + 2).width = 4; // Colonnes départements
    });

    // En-têtes
    worksheet.getCell(1, 1).value = 'Espèce';
    worksheet.getCell(1, 1).font = { bold: true, size: 12 };
    worksheet.getCell(1, 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6E6' },
    };

    // En-têtes départements
    allDepartments.forEach((deptCode, index) => {
      const cell = worksheet.getCell(1, index + 2);
      cell.value = deptCode;
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' },
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Données par espèce
    speciesDataList.forEach((species, rowIndex) => {
      const row = rowIndex + 2; // +2 car ligne 1 = en-têtes, indexé à partir de 1

      // Nom de l'espèce
      const speciesCell = worksheet.getCell(row, 1);
      speciesCell.value = species.speciesName;
      speciesCell.font = { bold: true, size: 11 };
      speciesCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' },
      };

      // Statut par département
      allDepartments.forEach((deptCode, colIndex) => {
        const cell = worksheet.getCell(row, colIndex + 2);
        const deptData = species.departments[deptCode];

        if (deptData) {
          // Utiliser la couleur basée sur le statut
          const statusColor = this.getStatusColor(deptData.distributionStatus);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: statusColor },
          };

          // Texte court pour le statut
          cell.value = this.getStatusShortCode(deptData.distributionStatus);
          cell.font = { size: 8 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          // Département non détecté
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCCCCC' },
          };
          cell.value = '?';
          cell.font = { size: 8 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Bordures
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Figer les panneaux (première ligne et première colonne)
    worksheet.views = [
      {
        state: 'frozen',
        xSplit: 1,
        ySplit: 1,
        topLeftCell: 'B2',
      },
    ];

    console.log(
      `✅ Matrice créée: ${speciesDataList.length} espèces × ${allDepartments.length} départements`
    );
  }

  private async createLegendSheet(workbook: ExcelJS.Workbook): Promise<void> {
    const worksheet = workbook.addWorksheet('Légende');

    // Titre
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'Légende des Couleurs - Distribution des Chauves-souris';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.mergeCells(1, 1, 1, 6);

    // Sous-titre
    const subtitleCell = worksheet.getCell(2, 1);
    subtitleCell.value =
      "Plan National d'Actions en faveur des Chiroptères 2016-2025";
    subtitleCell.font = { size: 12, italic: true };
    subtitleCell.alignment = { horizontal: 'center' };
    worksheet.mergeCells(2, 1, 2, 6);

    // En-têtes du tableau
    let row = 4;
    const headers = ['Code', 'Couleur', 'Statut', 'Description Officielle'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(row, index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Largeurs des colonnes
    worksheet.getColumn(1).width = 8; // Code
    worksheet.getColumn(2).width = 12; // Couleur
    worksheet.getColumn(3).width = 35; // Statut
    worksheet.getColumn(4).width = 60; // Description

    // Données de la légende
    row = 5;
    COLOR_LEGEND_MAPPING.forEach((entry: ColorLegendEntry) => {
      // Code court
      const codeCell = worksheet.getCell(row, 1);
      codeCell.value = this.getStatusShortCode(entry.extractionStatus);
      codeCell.font = { bold: true, size: 11 };
      codeCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Couleur (case colorée)
      const colorCell = worksheet.getCell(row, 2);
      colorCell.value = entry.officialColor;
      colorCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + entry.officialColor.substring(1) },
      };
      colorCell.font = { size: 10, color: { argb: 'FFFFFFFF' } };
      colorCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Statut
      const statusCell = worksheet.getCell(row, 3);
      statusCell.value = entry.extractionStatus;
      statusCell.font = { size: 11 };
      statusCell.alignment = { vertical: 'middle' };

      // Description officielle
      const descCell = worksheet.getCell(row, 4);
      descCell.value = entry.officialLabel;
      descCell.font = { size: 10 };
      descCell.alignment = { vertical: 'middle', wrapText: true };

      // Bordures pour toute la ligne
      [1, 2, 3, 4].forEach(col => {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      row++;
    });

    // Légende spéciale pour "non détecté"
    const unknownRow = row;
    worksheet.getCell(unknownRow, 1).value = '?';
    worksheet.getCell(unknownRow, 1).font = { bold: true, size: 11 };
    worksheet.getCell(unknownRow, 1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    worksheet.getCell(unknownRow, 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' },
    };
    worksheet.getCell(unknownRow, 2).value = '#CCCCCC';
    worksheet.getCell(unknownRow, 2).font = { size: 10 };
    worksheet.getCell(unknownRow, 2).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    worksheet.getCell(unknownRow, 3).value = 'non détecté';
    worksheet.getCell(unknownRow, 3).font = { size: 11 };

    worksheet.getCell(unknownRow, 4).value =
      "Département non détecté lors de l'analyse (zone urbaine ou coordonnées imprécises)";
    worksheet.getCell(unknownRow, 4).font = { size: 10 };
    worksheet.getCell(unknownRow, 4).alignment = { wrapText: true };

    [1, 2, 3, 4].forEach(col => {
      const cell = worksheet.getCell(unknownRow, col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Note finale
    const noteRow = unknownRow + 2;
    const noteCell = worksheet.getCell(noteRow, 1);
    noteCell.value =
      'Note: Cette matrice est générée automatiquement par analyse de couleurs des cartes de distribution officielles.';
    noteCell.font = { size: 10, italic: true };
    worksheet.mergeCells(noteRow, 1, noteRow, 4);

    console.log('✅ Feuille de légende créée');
  }

  private getAllDepartmentCodes(): string[] {
    // Tous les départements français (01-95, sans 20)
    const departments: string[] = [];

    // Départements 01-19
    for (let i = 1; i <= 19; i++) {
      departments.push(i.toString().padStart(2, '0'));
    }

    // Département 21-95 (pas de 20 car Corse)
    for (let i = 21; i <= 95; i++) {
      departments.push(i.toString());
    }

    return departments;
  }

  private getStatusColor(status: string): string {
    const statusColorMap: { [key: string]: string } = {
      'très rarement inventoriée': 'FFEA5257',
      'rare ou assez rare': 'FFF7A923',
      'peu commune ou localement commune': 'FFDBE7B0',
      'assez commune à très commune': 'FF95CB9B',
      'présente mais mal connue': 'FFFFEF23',
      'disparue ou non retrouvée': 'FFB0B1B3',
      absente: 'FFFFFDEA',
      'statut à déterminer': 'FFEEEEEE',
    };

    return statusColorMap[status] || 'FFCCCCCC';
  }

  private getStatusShortCode(status: string): string {
    const shortCodeMap: { [key: string]: string } = {
      'très rarement inventoriée': 'TR',
      'rare ou assez rare': 'R',
      'peu commune ou localement commune': 'PC',
      'assez commune à très commune': 'AC',
      'présente mais mal connue': 'PMC',
      'disparue ou non retrouvée': 'D',
      absente: 'A',
      'statut à déterminer': '?',
      'non détecté': '?',
    };

    return shortCodeMap[status] || '?';
  }
}

// Le script d'exécution est maintenant dans scripts/generateExcelReport.ts
