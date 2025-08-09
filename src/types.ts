export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
  };
  enhance?: boolean;
  grayscale?: boolean;
}

export interface OCROptions {
  language?: string;
  tessJsOptions?: object;
}
