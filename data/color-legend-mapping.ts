/**
 * Correspondance entre les codes couleur officiels du Plan National d'Actions Chiroptères
 * et les statuts de distribution utilisés dans l'extraction
 * 
 * Source: Plan National d'Actions en faveur des Chiroptères 2016-2025
 * Référence: https://plan-actions-chiropteres.fr/
 */

export interface ColorLegendEntry {
  /** Code couleur hexadécimal officiel */
  officialColor: string;
  /** Plages RGB utilisées pour la détection (avec tolérance) */
  rgbRange: {
    r: { min: number; max: number };
    g: { min: number; max: number };
    b: { min: number; max: number };
  };
  /** Libellé officiel de la légende */
  officialLabel: string;
  /** Statut utilisé dans l'extraction (simplifié) */
  extractionStatus: string;
  /** Description détaillée du statut */
  description: string;
}

/**
 * Mapping complet des couleurs de légende officielles
 */
export const COLOR_LEGEND_MAPPING: ColorLegendEntry[] = [
  {
    officialColor: '#ea5257',
    rgbRange: {
      r: { min: 230, max: 240 },
      g: { min: 80, max: 90 },
      b: { min: 85, max: 95 }
    },
    officialLabel: 'Espèce actuellement très rarement inventoriée ou exceptionnellement observée',
    extractionStatus: 'très rarement inventoriée',
    description: 'Espèce présente mais avec très peu d\'observations récentes ou exceptionnelles'
  },
  {
    officialColor: '#f7a923',
    rgbRange: {
      r: { min: 245, max: 250 },
      g: { min: 165, max: 175 },
      b: { min: 30, max: 40 }
    },
    officialLabel: 'Espèce actuellement rare ou assez rare',
    extractionStatus: 'rare ou assez rare',
    description: 'Espèce présente mais peu fréquente, nécessitant une attention particulière'
  },
  {
    officialColor: '#dbe7b0',
    rgbRange: {
      r: { min: 215, max: 225 },
      g: { min: 225, max: 235 },
      b: { min: 170, max: 180 }
    },
    officialLabel: 'Espèce peu commune ou localement commune',
    extractionStatus: 'peu commune ou localement commune',
    description: 'Espèce présente de façon modérée ou concentrée dans certaines zones'
  },
  {
    officialColor: '#95cb9b',
    rgbRange: {
      r: { min: 145, max: 155 },
      g: { min: 200, max: 210 },
      b: { min: 150, max: 160 }
    },
    officialLabel: 'Espèce assez commune à très commune',
    extractionStatus: 'assez commune à très commune',
    description: 'Espèce bien établie avec des populations importantes et stables'
  },
  {
    officialColor: '#ffef23',
    rgbRange: {
      r: { min: 250, max: 255 },
      g: { min: 235, max: 245 },
      b: { min: 30, max: 40 }
    },
    officialLabel: 'Espèce présente mais mal connue',
    extractionStatus: 'présente mais mal connue',
    description: 'Espèce signalée mais manque de données pour évaluer son statut précis'
  },
  {
    officialColor: '#b0b1b3',
    rgbRange: {
      r: { min: 170, max: 180 },
      g: { min: 175, max: 185 },
      b: { min: 175, max: 185 }
    },
    officialLabel: 'Espèce disparue ou non retrouvée sur la zone',
    extractionStatus: 'disparue ou non retrouvée',
    description: 'Espèce historiquement présente mais non retrouvée lors des inventaires récents'
  },
  {
    officialColor: '#fffdea',
    rgbRange: {
      r: { min: 250, max: 255 },
      g: { min: 250, max: 255 },
      b: { min: 225, max: 235 }
    },
    officialLabel: 'Espèce absente, n\'ayant jamais été trouvée',
    extractionStatus: 'absente',
    description: 'Aucune donnée d\'observation de l\'espèce sur ce territoire'
  },
  {
    officialColor: '#fefefe',
    rgbRange: {
      r: { min: 250, max: 255 },
      g: { min: 250, max: 255 },
      b: { min: 250, max: 255 }
    },
    officialLabel: 'Espèce absente (variante blanche)',
    extractionStatus: 'absente',
    description: 'Aucune donnée d\'observation de l\'espèce sur ce territoire (fond blanc pur)'
  }
];

/**
 * Utilitaires pour la correspondance des couleurs
 */
export class ColorLegendUtils {
  /**
   * Trouve le statut de distribution correspondant à une couleur RGB
   */
  static getDistributionStatus(r: number, g: number, b: number): string {
    for (const entry of COLOR_LEGEND_MAPPING) {
      const { rgbRange } = entry;
      if (
        r >= rgbRange.r.min && r <= rgbRange.r.max &&
        g >= rgbRange.g.min && g <= rgbRange.g.max &&
        b >= rgbRange.b.min && b <= rgbRange.b.max
      ) {
        return entry.extractionStatus;
      }
    }
    return 'statut à déterminer';
  }

  /**
   * Trouve l'entrée de légende correspondant à une couleur RGB
   */
  static getLegendEntry(r: number, g: number, b: number): ColorLegendEntry | null {
    for (const entry of COLOR_LEGEND_MAPPING) {
      const { rgbRange } = entry;
      if (
        r >= rgbRange.r.min && r <= rgbRange.r.max &&
        g >= rgbRange.g.min && g <= rgbRange.g.max &&
        b >= rgbRange.b.min && b <= rgbRange.b.max
      ) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Retourne tous les statuts possibles
   */
  static getAllStatuses(): string[] {
    const statusSet = new Set(COLOR_LEGEND_MAPPING.map(entry => entry.extractionStatus));
    return Array.from(statusSet);
  }

  /**
   * Retourne le mapping sous forme de dictionnaire couleur -> statut
   */
  static getColorToStatusMap(): Record<string, string> {
    const map: Record<string, string> = {};
    COLOR_LEGEND_MAPPING.forEach(entry => {
      map[entry.officialColor] = entry.extractionStatus;
    });
    return map;
  }

  /**
   * Vérifie si une couleur RGB correspond à une absence d'espèce
   */
  static isAbsentStatus(r: number, g: number, b: number): boolean {
    const status = this.getDistributionStatus(r, g, b);
    return status === 'absente' || status === 'disparue ou non retrouvée';
  }

  /**
   * Vérifie si une couleur RGB correspond à une présence confirmée
   */
  static isPresenceConfirmed(r: number, g: number, b: number): boolean {
    const status = this.getDistributionStatus(r, g, b);
    return ![
      'absente',
      'disparue ou non retrouvée',
      'statut à déterminer'
    ].includes(status);
  }
}

/**
 * Export des constantes pour faciliter l'utilisation
 */
export const OFFICIAL_COLORS = COLOR_LEGEND_MAPPING.map(entry => entry.officialColor);
export const EXTRACTION_STATUSES = Array.from(new Set(COLOR_LEGEND_MAPPING.map(entry => entry.extractionStatus)));

/**
 * Correspondance inverse : statut -> couleur officielle (pour la première occurrence)
 */
export const STATUS_TO_COLOR_MAP = COLOR_LEGEND_MAPPING.reduce((map, entry) => {
  if (!map[entry.extractionStatus]) {
    map[entry.extractionStatus] = entry.officialColor;
  }
  return map;
}, {} as Record<string, string>);
