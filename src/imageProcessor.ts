import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { ImageProcessingOptions } from './types';

export class ImageProcessor {
  /**
   * Préprocesse une image pour améliorer la qualité OCR
   */
  async preprocessImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<string> {
    try {
      // S'assurer que le dossier de destination existe
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      let pipeline = sharp(inputPath);

      // Redimensionnement si spécifié
      if (options.resize) {
        pipeline = pipeline.resize(options.resize.width, options.resize.height);
      }

      // Conversion en niveaux de gris
      if (options.grayscale !== false) {
        pipeline = pipeline.grayscale();
      }

      // Amélioration de l'image
      if (options.enhance) {
        pipeline = pipeline
          .normalize() // Normalise la luminosité et le contraste
          .sharpen() // Améliore la netteté
          .threshold(128); // Binarisation pour améliorer le contraste
      }

      // Sauvegarde de l'image traitée
      await pipeline.png().toFile(outputPath);

      return outputPath;
    } catch (error) {
      throw new Error(
        `Erreur lors du traitement de l'image: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Vérifie si un fichier image existe et est valide
   */
  async validateImageFile(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return false;
      }

      // Vérifie l'extension du fichier
      const ext = path.extname(filePath).toLowerCase();
      const supportedFormats = [
        '.jpg',
        '.jpeg',
        '.png',
        '.bmp',
        '.tiff',
        '.webp',
      ];

      return supportedFormats.includes(ext);
    } catch {
      return false;
    }
  }

  /**
   * Obtient les métadonnées d'une image
   */
  async getImageMetadata(filePath: string): Promise<sharp.Metadata> {
    try {
      return await sharp(filePath).metadata();
    } catch (error) {
      throw new Error(
        `Erreur lors de la lecture des métadonnées: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
