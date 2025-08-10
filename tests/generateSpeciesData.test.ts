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
    it('should generate species data successfully (dynamic priority)', async () => {
      // Mock du HTML de la page des espèces (liste)
      const mockHtml = `
        <div class="content">
          <figure class="wp-block-image"><a href="/les-chauves-souris/les-especes/barbastelle-deurope/"><img src="x.jpg" /></a></figure>
          <h4 class="wp-block-heading has-orange-background-color"><a href="/les-chauves-souris/les-especes/barbastelle-deurope/">Barbastelle d'Europe</a></h4>
          <h4 class="wp-block-heading"><a href="/les-chauves-souris/les-especes/grand-murin/">Grand murin</a></h4>
        </div>
      `;

      // Barbastelle page (contient marqueur priorité)
      const mockDetailHtmlPriority = `
        <div class="entry-content">
          <p>La <em>Barbastella barbastellus</em> est une espèce prioritaire pour la conservation.</p>
        </div>
      `;
      // Grand murin page (pas prioritaire dans ce test)
      const mockDetailHtmlNonPriority = `
        <div class="entry-content">
          <p>Le <em>Myotis myotis</em> est décrit ici sans marqueur.</p>
        </div>
      `;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockHtml),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockDetailHtmlPriority),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockDetailHtmlNonPriority),
        } as Response);

      await generator.generateSpeciesData();

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const [, content] = mockWriteFile.mock.calls[0];
      const parsedContent = JSON.parse(content as string);
      expect(parsedContent.metadata.totalSpecies).toBe(2);
      const barbastelle = parsedContent.species.find((s: any) => s.slug === 'barbastelle-deurope');
      const grandMurin = parsedContent.species.find((s: any) => s.slug === 'grand-murin');
      expect(barbastelle.isPriority).toBe(true);
      expect(grandMurin.isPriority).toBe(false);
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

  describe('metadata priority count', () => {
    it('should compute correct prioritySpecies count dynamically', async () => {
      const listHtml = `
        <div>
          <h4 class='wp-block-heading has-orange-background-color'><a href="/les-chauves-souris/les-especes/barbastelle-deurope/">Barbastelle d'Europe</a></h4>
          <h4 class='wp-block-heading has-orange-background-color'><a href="/les-chauves-souris/les-especes/grand-murin/">Grand murin</a></h4>
          <h4 class='wp-block-heading'><a href="/les-chauves-souris/les-especes/espece-non-prioritaire/">Espèce Non Prioritaire</a></h4>
        </div>`;
      const priorityDetail1 = `<div class='entry-content'><p>Texte espèce prioritaire avec <em>Barbastella barbastellus</em>.</p></div>`;
      const priorityDetail2 = `<div class='entry-content'><p>Plan national d'action et <em>Myotis myotis</em>.</p></div>`;
      const nonPriorityDetail = `<div class='entry-content'><p>Description sans marqueur.</p></div>`;

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(listHtml) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(priorityDetail1) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(priorityDetail2) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(nonPriorityDetail) } as Response);

      await generator.generateSpeciesData();
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const [, content] = mockWriteFile.mock.calls[0];
      const parsed = JSON.parse(content as string);
      expect(parsed.metadata.totalSpecies).toBe(3);
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

  describe('priority detection configuration', () => {
    it('should detect priority via inline style fallback when class is absent', async () => {
      generator = new SpeciesDataGenerator({
        priorityDetection: {
          headingClassNames: ['has-orange-background-color'],
          enableInlineStyleFallback: true,
          fallbackInlineStyleColors: ['#f7a923'],
          fallbackStyleColorKeyword: 'orange',
          searchWindowChars: 600,
        }
      } as any);

      const listHtml = `
        <div>
          <h4 class='wp-block-heading' style="background-color:#f7a923; padding:4px"><a href="/les-chauves-souris/les-especes/barbastelle-deurope/">Barbastelle d'Europe</a></h4>
          <h4 class='wp-block-heading'><a href="/les-chauves-souris/les-especes/grand-murin/">Grand murin</a></h4>
        </div>`;

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(listHtml) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('<div></div>') } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('<div></div>') } as Response);

      await generator.generateSpeciesData();
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const [, content] = mockWriteFile.mock.calls[0];
      const parsed = JSON.parse(content as string);
      const barbastelle = parsed.species.find((s: any) => s.slug === 'barbastelle-deurope');
      const grandMurin = parsed.species.find((s: any) => s.slug === 'grand-murin');
      expect(barbastelle.isPriority).toBe(true); // détecté via style inline
      expect(grandMurin.isPriority).toBe(false);
      expect(parsed.metadata.prioritySpecies).toBe(1);
    });

    it('should NOT detect priority via inline style when fallback disabled', async () => {
      generator = new SpeciesDataGenerator({
        priorityDetection: {
          headingClassNames: ['has-orange-background-color'],
          enableInlineStyleFallback: false,
          fallbackInlineStyleColors: ['#f7a923'],
          fallbackStyleColorKeyword: 'orange'
        }
      } as any);

      const listHtml = `
        <div>
          <h4 class='wp-block-heading' style="background-color:#f7a923"><a href="/les-chauves-souris/les-especes/barbastelle-deurope/">Barbastelle d'Europe</a></h4>
        </div>`;

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(listHtml) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('<div></div>') } as Response);

      await generator.generateSpeciesData();
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const [, content] = mockWriteFile.mock.calls[0];
      const parsed = JSON.parse(content as string);
      const barbastelle = parsed.species.find((s: any) => s.slug === 'barbastelle-deurope');
      expect(barbastelle.isPriority).toBe(false); // fallback désactivé
      expect(parsed.metadata.prioritySpecies).toBe(0);
    });

    it('should respect a smaller searchWindowChars (no heading found)', async () => {
      generator = new SpeciesDataGenerator({
        priorityDetection: {
          headingClassNames: ['has-orange-background-color'],
          enableInlineStyleFallback: false,
          fallbackInlineStyleColors: ['#f7a923'],
          fallbackStyleColorKeyword: 'orange',
          searchWindowChars: 10, // trop petit pour atteindre le heading
        }
      } as any);
      const listHtml = `\n        <div>\n          <!-- beaucoup de padding -->${' '.repeat(50)}<h4 class='wp-block-heading has-orange-background-color'><a href="/les-chauves-souris/les-especes/barbastelle-deurope/">Barbastelle d'Europe</a></h4>\n        </div>`;
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(listHtml) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('<div></div>') } as Response);
      await generator.generateSpeciesData();
      const [, content] = mockWriteFile.mock.calls[0];
      const parsed = JSON.parse(content as string);
      const barbastelle = parsed.species.find((s: any) => s.slug === 'barbastelle-deurope');
      expect(barbastelle.isPriority).toBe(false); // heading hors fenêtre
    });
  });
});
