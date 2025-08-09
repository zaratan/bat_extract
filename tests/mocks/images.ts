import * as sharp from 'sharp';

/**
 * Génère une image de test simple avec des couleurs spécifiques pour les tests
 * Cette image simule une carte de distribution avec des départements colorés
 */
export async function createMockMapImage(): Promise<Buffer> {
  // Créer une image 2048x1271 (format des vraies cartes)
  const width = 2048;
  const height = 1271;

  // Créer une image de base blanche
  const baseImage = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  });

  // Ajouter quelques rectangles colorés pour simuler des départements
  // Ces couleurs correspondent à notre légende
  const overlays = [
    // Département "01" - Vert foncé (assez commune à très commune)
    {
      input: sharp({
        create: {
          width: 50,
          height: 50,
          channels: 4,
          background: { r: 149, g: 203, b: 155, alpha: 1 } // #95cb9b
        }
      }).png().toBuffer(),
      left: 100,
      top: 200
    },
    // Département "02" - Orange (rare ou assez rare)
    {
      input: sharp({
        create: {
          width: 50,
          height: 50,
          channels: 4,
          background: { r: 247, g: 169, b: 35, alpha: 1 } // #f7a923
        }
      }).png().toBuffer(),
      left: 200,
      top: 300
    },
    // Département "03" - Rouge (très rarement inventoriée)
    {
      input: sharp({
        create: {
          width: 50,
          height: 50,
          channels: 4,
          background: { r: 234, g: 82, b: 87, alpha: 1 } // #ea5257
        }
      }).png().toBuffer(),
      left: 300,
      top: 400
    }
  ];

  // Créer les buffers pour les overlays
  const overlayBuffers = await Promise.all(
    overlays.map(async (overlay) => ({
      input: await overlay.input,
      left: overlay.left,
      top: overlay.top
    }))
  );

  // Composer l'image finale
  return baseImage
    .composite(overlayBuffers)
    .png()
    .toBuffer();
}

/**
 * Données mockées des coordonnées de test (sous-ensemble pour les tests)
 */
export const mockDepartmentCoordinates = [
  { code: '01', name: 'Ain', x: 125, y: 225 },
  { code: '02', name: 'Aisne', x: 225, y: 325 },
  { code: '03', name: 'Allier', x: 325, y: 425 }
];
