import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { ImageProcessor } from './imageProcessor';
import { OCREngine } from './ocrEngine';
import { OCRResult, ImageProcessingOptions, OCROptions } from './types';

export class BatExtractor {
  private imageProcessor: ImageProcessor;
  private ocrEngine: OCREngine;
  private tempDir: string;

  constructor(tempDir: string = './temp_images') {
    this.imageProcessor = new ImageProcessor();
    this.ocrEngine = new OCREngine();
    this.tempDir = tempDir;
  }

  /**
   * S'assure que le dossier temporaire existe
   */
  private async ensureTempDirExists(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch {
      // Ignore l'erreur si le dossier existe déjà
    }
  }

  /**
   * Initialise l'extracteur (crée le dossier temporaire, initialise l'OCR)
   */
  async initialize(language: string = 'fra'): Promise<void> {
    try {
      // Crée le dossier temporaire s'il n'existe pas
      await this.ensureTempDirExists();

      // Initialise le moteur OCR
      await this.ocrEngine.initialize(language);

      console.log('BatExtractor initialisé avec succès');
    } catch (error) {
      throw new Error(
        `Erreur lors de l'initialisation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Extrait le texte d'une image avec préprocessing optionnel
   */
  async extractFromImage(
    imagePath: string,
    options: {
      preprocess?: boolean;
      imageOptions?: ImageProcessingOptions;
      ocrOptions?: OCROptions;
    } = {}
  ): Promise<OCRResult> {
    try {
      // Valide le fichier image
      const isValid = await this.imageProcessor.validateImageFile(imagePath);
      if (!isValid) {
        throw new Error(`Fichier image invalide: ${imagePath}`);
      }

      let processedImagePath = imagePath;

      // Préprocessing de l'image si demandé
      if (options.preprocess) {
        // S'assure que le dossier temporaire existe
        await this.ensureTempDirExists();

        const fileName = path.basename(imagePath, path.extname(imagePath));
        const tempPath = path.join(this.tempDir, `${fileName}_processed.png`);

        processedImagePath = await this.imageProcessor.preprocessImage(
          imagePath,
          tempPath,
          options.imageOptions
        );

        console.log(`Image préprocessée: ${processedImagePath}`);
      }

      // Extraction du texte
      const result = await this.ocrEngine.extractText(
        processedImagePath,
        options.ocrOptions
      );

      console.log(`Texte extrait de ${imagePath}`);
      console.log(`Confiance: ${result.confidence.toFixed(2)}%`);

      return result;
    } catch (error) {
      throw new Error(
        `Erreur lors de l'extraction: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Extrait le texte de plusieurs images
   */
  async extractFromMultipleImages(
    imagePaths: string[],
    options: {
      preprocess?: boolean;
      imageOptions?: ImageProcessingOptions;
      ocrOptions?: OCROptions;
    } = {}
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    for (const imagePath of imagePaths) {
      try {
        const result = await this.extractFromImage(imagePath, options);
        results.push(result);
      } catch (error) {
        console.error(
          `Erreur lors du traitement de ${imagePath}:`,
          error instanceof Error ? error.message : String(error)
        );
        results.push({
          text: '',
          confidence: 0,
          words: [],
        });
      }
    }

    return results;
  }

  /**
   * Sauvegarde les résultats dans un fichier JSON
   */
  async saveResults(results: OCRResult[], outputPath: string): Promise<void> {
    try {
      const jsonData = JSON.stringify(results, null, 2);
      await fs.writeFile(outputPath, jsonData, 'utf-8');
      console.log(`Résultats sauvegardés dans: ${outputPath}`);
    } catch (error) {
      throw new Error(
        `Erreur lors de la sauvegarde: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Nettoie les fichiers temporaires et ferme l'OCR
   */
  async cleanup(): Promise<void> {
    try {
      // Ferme le worker OCR
      await this.ocrEngine.terminate();

      // Supprime les fichiers temporaires
      try {
        await fs.rm(this.tempDir, { recursive: true, force: true });
      } catch {
        // Ignore les erreurs de suppression
      }

      console.log('Nettoyage terminé');
    } catch (error) {
      console.error(
        'Erreur lors du nettoyage:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Obtient des informations sur une image
   */
  async getImageInfo(imagePath: string): Promise<sharp.Metadata> {
    return await this.imageProcessor.getImageMetadata(imagePath);
  }
}
