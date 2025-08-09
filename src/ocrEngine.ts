import Tesseract from 'tesseract.js';
import { OCRResult, OCROptions } from './types';

export class OCREngine {
  private worker: Tesseract.Worker | null = null;

  /**
   * Initialise le worker Tesseract
   */
  async initialize(language: string = 'fra'): Promise<void> {
    try {
      this.worker = await Tesseract.createWorker(language);
      console.log(`Worker OCR initialisé avec la langue: ${language}`);
    } catch (error) {
      throw new Error(
        `Erreur lors de l'initialisation du worker OCR: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Extrait le texte d'une image
   */
  async extractText(
    imagePath: string,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize(options.language || 'fra');
    }

    try {
      if (!this.worker) {
        throw new Error('Worker OCR non initialisé');
      }

      // Configuration des options Tesseract
      if (options.tessJsOptions) {
        await this.worker.setParameters(options.tessJsOptions);
      }

      const result = await this.worker.recognize(imagePath);
      const { text, confidence } = result.data;

      // Pour l'instant, nous retournons un tableau vide pour les mots
      // car l'API Tesseract.js ne fournit pas directement cette information
      const formattedWords: Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }> = [];

      return {
        text: text.trim(),
        confidence,
        words: formattedWords,
      };
    } catch (error) {
      throw new Error(
        `Erreur lors de l'extraction de texte: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Extrait le texte de plusieurs images
   */
  async extractTextFromMultipleImages(
    imagePaths: string[],
    options: OCROptions = {}
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    for (const imagePath of imagePaths) {
      try {
        const result = await this.extractText(imagePath, options);
        results.push(result);
      } catch (error) {
        console.error(
          `Erreur lors du traitement de ${imagePath}:`,
          error instanceof Error ? error.message : String(error)
        );
        // Continue avec les autres images même en cas d'erreur
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
   * Ferme le worker Tesseract
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('Worker OCR fermé');
    }
  }
}
