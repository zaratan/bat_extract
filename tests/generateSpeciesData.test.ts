import { SpeciesDataGenerator } from '../src/generateSpeciesData.js';
import { writeFile } from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
}));

const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

// Mock globalThis.fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof globalThis.fetch>;

// Mock process.exit to prevent test termination
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number) => {
  throw new Error(`Process exit called with code ${code}`);
});

describe('SpeciesDataGenerator', () => {
  let generator: SpeciesDataGenerator;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    generator = new SpeciesDataGenerator();
    mockWriteFile.mockClear();
    
    // Sauvegarder et mocker fetch
    originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;
    mockFetch.mockClear();
    mockExit.mockClear();
  });

  afterEach(() => {
    // Restaurer fetch original
    globalThis.fetch = originalFetch;
  });

  describe('generateSpeciesData', () => {
    it('should generate species data successfully', async () => {
      // Mock du HTML de la page des espèces
      const mockHtml = `
        <div class="content">
          <article>
            <h3><a href="/les-chauves-souris/les-especes/barbastelle-deurope/">Barbastelle d'Europe</a></h3>
          </article>
          <article>
            <h3><a href="/les-chauves-souris/les-especes/grand-murin/">Grand murin</a></h3>
          </article>
        </div>
      `;

      // Mock de la page de détail pour récupérer le nom latin
      const mockDetailHtml = `
        <div class="entry-content">
          <p><strong>Nom latin :</strong> Barbastella barbastellus</p>
        </div>
      `;

      // Mock des appels HTTP avec fetch
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockHtml),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockDetailHtml),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<div class="entry-content"><p>Pas de nom latin</p></div>'),
        } as Response);

      await generator.generateSpeciesData();

      // Vérifier que writeFile a été appelé
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      
      const [filePath, content] = mockWriteFile.mock.calls[0];
      expect(filePath).toContain('generated-species-data.json');
      
      const parsedContent = JSON.parse(content as string);
      expect(parsedContent).toHaveProperty('metadata');
      expect(parsedContent).toHaveProperty('species');
      expect(parsedContent.metadata.totalSpecies).toBe(2);
      expect(parsedContent.species).toHaveLength(2);
      
      const barbastelle = parsedContent.species.find((s: any) => s.slug === 'barbastelle-deurope');
      expect(barbastelle).toBeDefined();
      expect(barbastelle.name).toBe("Barbastelle d'Europe");
      expect(barbastelle.latinName).toBe('Barbastella barbastellus');
    });

    it('should handle HTTP errors gracefully', async () => {
      // Mock d'une erreur HTTP
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: () => Promise.resolve('Server Error'),
      } as Response);

      await expect(generator.generateSpeciesData()).rejects.toThrow('Process exit called with code 1');
    });

    it('should handle empty species list', async () => {
      // Mock d'un HTML sans espèces
      const mockHtml = '<div class="content"></div>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
      } as Response);

      await generator.generateSpeciesData();

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const [, content] = mockWriteFile.mock.calls[0];
      const parsedContent = JSON.parse(content as string);
      expect(parsedContent.metadata.totalSpecies).toBe(0);
      expect(parsedContent.species).toHaveLength(0);
    });
  });

  describe('extractSpeciesFromHtml', () => {
    it('should extract species with various URL formats', () => {
      const html = `
        <div class="content">
          <article>
            <h3><a href="/les-chauves-souris/les-especes/barbastelle-deurope/">Barbastelle d'Europe</a></h3>
          </article>
          <article>
            <h3><a href="/les-chauves-souris/les-especes/murin-a-oreilles-echancrees/">Murin à oreilles échancrées</a></h3>
          </article>
          <article>
            <h3><a href="/autre-lien/">Autre lien non pertinent</a></h3>
          </article>
        </div>
      `;

      const species = (generator as any).extractSpeciesFromHtml(html);
      
      expect(species).toHaveLength(2);
      expect(species[0]).toEqual({
        name: "Barbastelle d'Europe",
        slug: 'barbastelle-deurope',
        pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/barbastelle-deurope/',
        isPriority: true, // Barbastelle est dans la liste prioritaire
      });
      expect(species[1]).toEqual({
        name: 'Murin à oreilles échancrées',
        slug: 'murin-a-oreilles-echancrees',
        pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-a-oreilles-echancrees/',
        isPriority: true, // Murin à oreilles échancrées est dans la liste prioritaire
      });
    });
  });

  describe('addPriorityFlags', () => {
    it('should correctly identify priority species', () => {
      const species = [
        {
          name: 'Barbastelle d\'Europe',
          slug: 'barbastelle-deurope',
          pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/barbastelle-deurope/',
          isPriority: false,
        },
        {
          name: 'Espèce Non Prioritaire',
          slug: 'espece-non-prioritaire',
          pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/espece-non-prioritaire/',
          isPriority: false,
        },
      ];

      const result = (generator as any).addPriorityFlags(species);
      
      expect(result[0].isPriority).toBe(true); // Barbastelle est prioritaire
      expect(result[1].isPriority).toBe(false); // Espèce inconnue n'est pas prioritaire
    });
  });

  describe('extractLatinName', () => {
    it('should extract latin name from various HTML formats', async () => {
      const htmlWithLatinName = `
        <div class="entry-content">
          <p><strong>Nom latin :</strong> Barbastella barbastellus</p>
          <p>Autre contenu</p>
        </div>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(htmlWithLatinName),
      } as Response);

      const latinName = await (generator as any).extractLatinName('https://plan-actions-chiropteres.fr/test-page/');
      expect(latinName).toBe('Barbastella barbastellus');
    });

    it('should handle pages without latin name', async () => {
      const htmlWithoutLatinName = `
        <div class="entry-content">
          <p>Pas de nom latin dans cette page</p>
        </div>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(htmlWithoutLatinName),
      } as Response);

      const latinName = await (generator as any).extractLatinName('https://plan-actions-chiropteres.fr/test-page/');
      expect(latinName).toBeUndefined();
    });

    it('should handle HTTP errors when fetching latin name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Not Found'),
      } as Response);

      const latinName = await (generator as any).extractLatinName('https://plan-actions-chiropteres.fr/test-page/');
      expect(latinName).toBeUndefined();
    });
  });
});
