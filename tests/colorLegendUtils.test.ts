import { ColorLegendUtils, COLOR_LEGEND_MAPPING } from '../data/color-legend-mapping.js';

describe('ColorLegendUtils', () => {
  describe('getDistributionStatus', () => {
    test('devrait identifier correctement une couleur rouge pour "très rarement inventoriée"', () => {
      const result = ColorLegendUtils.getDistributionStatus(235, 85, 90);
      expect(result).toBe('très rarement inventoriée');
    });

    test('devrait identifier correctement une couleur verte pour "assez commune"', () => {
      const result = ColorLegendUtils.getDistributionStatus(149, 203, 155);
      expect(result).toBe('assez commune à très commune');
    });

    test('devrait retourner "statut à déterminer" pour une couleur inconnue', () => {
      const result = ColorLegendUtils.getDistributionStatus(100, 50, 200);
      expect(result).toBe('statut à déterminer');
    });
  });

  describe('COLOR_LEGEND_MAPPING', () => {
    test('devrait avoir au moins une entrée', () => {
      expect(COLOR_LEGEND_MAPPING.length).toBeGreaterThan(0);
    });

    test('chaque entrée devrait avoir tous les champs requis', () => {
      COLOR_LEGEND_MAPPING.forEach(entry => {
        expect(entry).toHaveProperty('officialColor');
        expect(entry).toHaveProperty('rgbRange');
        expect(entry).toHaveProperty('officialLabel');
        expect(entry).toHaveProperty('extractionStatus');
        expect(entry).toHaveProperty('description');
      });
    });
  });
});
