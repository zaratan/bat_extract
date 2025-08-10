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
  let originalSetTimeout: typeof globalThis.setTimeout;

  beforeEach(() => {
    generator = new SpeciesDataGenerator();
    mockWriteFile.mockClear();
    mockExit.mockClear();
    
    // Sauvegarder et mocker fetch
    originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;
    // IMPORTANT: reset (impl + calls) pour vider la file des réponses entre tests
    mockFetch.mockReset();
    
    // Mock setTimeout pour éviter les délais dans les tests
    originalSetTimeout = globalThis.setTimeout;
    (globalThis as any).setTimeout = jest.fn((callback: any) => {
      // Exécuter immédiatement le callback pour éviter les délais
      if (typeof callback === 'function') {
        callback();
      }
      return 0 as any;
    });
  });

  afterEach(() => {
    // Restaurer fetch et setTimeout originaux
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
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
          <p>La <em>Barbastella barbastellus</em> est une espèce de chauve-souris...</p>
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
      expect(barbastelle.isPriority).toBe(true); // Barbastelle est prioritaire
      // Le nom latin n'est pas automatiquement enrichi par generateSpeciesData
      expect(barbastelle.latinName).toBeUndefined();
    });

    it('should handle HTTP errors gracefully', async () => {
      // Mock qui simule une erreur réseau
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(generator.generateSpeciesData()).rejects.toThrow();
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
        isPriority: false, // extractSpeciesFromHtml retourne false par défaut
      });
      expect(species[1]).toEqual({
        name: 'Murin à oreilles échancrées',
        slug: 'murin-a-oreilles-echancrees',
        pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-a-oreilles-echancrees/',
        isPriority: false, // extractSpeciesFromHtml retourne false par défaut
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

  describe('enrichWithLatinNames', () => {
    it('should enrich species with latin names successfully', async () => {
      const mockSpecies = [
        {
          name: 'Barbastelle d\'Europe',
          slug: 'barbastelle-deurope',
          pageUrl: 'https://plan-actions-chiropteres.fr/barbastelle-deurope/',
          isPriority: true,
        }
      ];
      
      const htmlWithLatinName = `
        <div class="entry-content">
          <p>Description de l'espèce <em>Barbastella barbastellus</em> avec d'autres informations.</p>
        </div>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(htmlWithLatinName),
      } as Response);

      const enrichedSpecies = await generator.enrichWithLatinNames(mockSpecies);
      expect(enrichedSpecies).toHaveLength(1);
      expect(enrichedSpecies[0].latinName).toBe('Barbastella barbastellus');
    });

    it('should handle pages without latin name', async () => {
      const mockSpecies = [
        {
          name: 'Test Species',
          slug: 'test-species',
          pageUrl: 'https://plan-actions-chiropteres.fr/test-species/',
          isPriority: false,
        }
      ];
      
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

      const enrichedSpecies = await generator.enrichWithLatinNames(mockSpecies);
      expect(enrichedSpecies).toHaveLength(1);
      expect(enrichedSpecies[0].latinName).toBeUndefined();
    });

    it('should handle HTTP errors when fetching latin name', async () => {
      const mockSpecies = [
        {
          name: 'Test Species',
          slug: 'test-species',
          pageUrl: 'https://plan-actions-chiropteres.fr/test-species/',
          isPriority: false,
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const enrichedSpecies = await generator.enrichWithLatinNames(mockSpecies);
      expect(enrichedSpecies).toHaveLength(1);
      expect(enrichedSpecies[0].latinName).toBeUndefined();
    });

    it('should partially enrich with latin names (mix success, no name, http error)', async () => {
      const mockSpecies = [
        { name: 'Espèce A', slug: 'espece-a', pageUrl: 'https://plan-actions-chiropteres.fr/espece-a/', isPriority: false },
        { name: 'Espèce B', slug: 'espece-b', pageUrl: 'https://plan-actions-chiropteres.fr/espece-b/', isPriority: false },
        { name: 'Espèce C', slug: 'espece-c', pageUrl: 'https://plan-actions-chiropteres.fr/espece-c/', isPriority: false },
      ];

      // A: succès avec nom latin
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('<p><em>Genus species</em></p>') } as Response);
      // B: page sans nom latin
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('<p>Aucun nom latin ici</p>') } as Response);
      // C: erreur HTTP
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' } as Response);

      const enriched = await generator.enrichWithLatinNames(mockSpecies as any);
      expect(enriched).toHaveLength(3);
      expect(enriched[0].latinName).toBe('Genus species');
      expect(enriched[1].latinName).toBeUndefined();
      expect(enriched[2].latinName).toBeUndefined();
    });
  });

  describe('metadata priority count', () => {
    it('should compute correct prioritySpecies count in generated file', async () => {
      const listHtml = `
        <div>
          <a href="/les-chauves-souris/les-especes/barbastelle-deurope/">Barbastelle d'Europe</a>
          <a href="/les-chauves-souris/les-especes/grand-murin/">Grand murin</a>
          <a href="/les-chauves-souris/les-especes/espece-non-prioritaire/">Espèce Non Prioritaire</a>
        </div>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(listHtml)
      } as Response);

      await generator.generateSpeciesData();
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const [, content] = mockWriteFile.mock.calls[0];
      const parsed = JSON.parse(content as string);
      expect(parsed.metadata.totalSpecies).toBe(3);
      // barbastelle + grand murin sont dans la liste prioritaire
      expect(parsed.metadata.prioritySpecies).toBe(2);
    });
  });

  describe('latin name pattern detection', () => {
    const patterns = [
      {
        html: `<div class="entry-content"><p>Texte <em>Myotis myotis</em> fin.</p></div>`,
        expected: 'Myotis myotis'
      },
      {
        html: `<div class="entry-content"><p>Texte <i>Plecotus auritus</i> fin.</p></div>`,
        expected: 'Plecotus auritus'
      },
      {
        html: `<div class="entry-content"><p>Le Murin (Rhinolophus ferrumequinum) est présent...</p></div>`,
        expected: 'Rhinolophus ferrumequinum'
      },
      {
        html: `<div class="entry-content"><span class="latin">Miniopterus schreibersii</span></div>`,
        expected: 'Miniopterus schreibersii'
      }
    ];

    for (const { html, expected } of patterns) {
      it(`should extract latin name pattern: ${expected}`, async () => {
        const species = [{
          name: 'Test',
            slug: 'test',
            pageUrl: 'https://plan-actions-chiropteres.fr/test/',
            isPriority: false,
        }];
        mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(html) } as Response);
        const enriched = await generator.enrichWithLatinNames(species as any);
        expect(enriched[0].latinName).toBe(expected);
      });
    }
  });
});
