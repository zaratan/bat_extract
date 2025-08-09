/**
 * Données des espèces de chauves-souris françaises
 * Extraites depuis https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/
 */

export interface BatSpecies {
  /** Nom français de l'espèce */
  name: string;
  /** Nom latin de l'espèce */
  latinName?: string;
  /** URL de la page de l'espèce */
  pageUrl: string;
  /** Slug pour identifier l'espèce (dernière partie de l'URL) */
  slug: string;
  /** Indique si l'espèce est prioritaire pour la conservation */
  isPriority: boolean;
}

/**
 * Liste complète des 36 espèces de chauves-souris présentes en France
 *
 * Les espèces marquées comme prioritaires sont celles identifiées par le Comité de suivi
 * comme nécessitant des actions de conservation spécifiques dans le cadre du PNAC.
 */
export const BAT_SPECIES: BatSpecies[] = [
  {
    name: "Barbastelle d'Europe",
    latinName: 'Barbastella barbastellus',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/barbastelle-deurope/',
    slug: 'barbastelle-deurope',
    isPriority: true,
  },
  {
    name: 'Grand Murin',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/grand-murin/',
    slug: 'grand-murin',
    isPriority: true,
  },
  {
    name: 'Grand Rhinolophe',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/grand-rhinolophe/',
    slug: 'grand-rhinolophe',
    isPriority: true,
  },
  {
    name: 'Grande Noctule',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/grande-noctule/',
    slug: 'grande-noctule',
    isPriority: true,
  },
  {
    name: 'Minioptère de Schreibers',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/minioptere-de-schreibers/',
    slug: 'minioptere-de-schreibers',
    isPriority: true,
  },
  {
    name: 'Molosse de Cestoni',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/molosse-de-cestoni/',
    slug: 'molosse-de-cestoni',
    isPriority: true,
  },
  {
    name: 'Murin à moustaches',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-a-moustaches/',
    slug: 'murin-a-moustaches',
    isPriority: false,
  },
  {
    name: 'Murin à oreilles échancrées',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-a-oreilles-echancrees/',
    slug: 'murin-a-oreilles-echancrees',
    isPriority: true,
  },
  {
    name: 'Murin cryptique',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-cryptique/',
    slug: 'murin-cryptique',
    isPriority: false,
  },
  {
    name: "Murin d'Alcathoé",
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-dalcathoe/',
    slug: 'murin-dalcathoe',
    isPriority: false,
  },
  {
    name: "Murin d'Escalera",
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-descalera/',
    slug: 'murin-descalera',
    isPriority: false,
  },
  {
    name: 'Murin de Bechstein',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-de-bechstein/',
    slug: 'murin-de-bechstein',
    isPriority: true,
  },
  {
    name: 'Murin de Brandt',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-de-brandt/',
    slug: 'murin-de-brandt',
    isPriority: false,
  },
  {
    name: 'Murin de Capaccini',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-de-capaccini/',
    slug: 'murin-de-capaccini',
    isPriority: true,
  },
  {
    name: 'Murin de Daubenton',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-de-daubenton/',
    slug: 'murin-de-daubenton',
    isPriority: false,
  },
  {
    name: 'Murin de Natterer',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-de-natterer/',
    slug: 'murin-de-natterer',
    isPriority: false,
  },
  {
    name: 'Murin des marais',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-des-marais/',
    slug: 'murin-des-marais',
    isPriority: true,
  },
  {
    name: 'Murin du Maghreb',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/murin-du-maghreb/',
    slug: 'murin-du-maghreb',
    isPriority: false,
  },
  {
    name: 'Murin de Corse',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/myotis-nustrale/',
    slug: 'myotis-nustrale',
    isPriority: false,
  },
  {
    name: 'Noctule commune',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/noctule-commune/',
    slug: 'noctule-commune',
    isPriority: false,
  },
  {
    name: 'Noctule de Leisler',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/noctule-de-leisler/',
    slug: 'noctule-de-leisler',
    isPriority: false,
  },
  {
    name: 'Oreillard gris',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/oreillard-gris/',
    slug: 'oreillard-gris',
    isPriority: true,
  },
  {
    name: 'Oreillard montagnard',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/oreillard-montagnard/',
    slug: 'oreillard-montagnard',
    isPriority: false,
  },
  {
    name: 'Oreillard roux',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/oreillard-roux/',
    slug: 'oreillard-roux',
    isPriority: false,
  },
  {
    name: 'Petit murin',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/petit-murin/',
    slug: 'petit-murin',
    isPriority: true,
  },
  {
    name: 'Petit Rhinolophe',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/petit-rhinolophe/',
    slug: 'petit-rhinolophe',
    isPriority: true,
  },
  {
    name: 'Pipistrelle commune',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/pipistrelle-commune/',
    slug: 'pipistrelle-commune',
    isPriority: false,
  },
  {
    name: 'Pipistrelle de Kuhl',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/pipistrelle-de-kuhl/',
    slug: 'pipistrelle-de-kuhl',
    isPriority: false,
  },
  {
    name: 'Pipistrelle de Nathusius',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/pipistrelle-de-nathusius/',
    slug: 'pipistrelle-de-nathusius',
    isPriority: false,
  },
  {
    name: 'Pipistrelle pygmée',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/pipistrelle-pygmee/',
    slug: 'pipistrelle-pygmee',
    isPriority: true,
  },
  {
    name: 'Rhinolophe de Méhely',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/rhinolophe-de-mehely/',
    slug: 'rhinolophe-de-mehely',
    isPriority: true,
  },
  {
    name: 'Rhinolophe euryale',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/rhinolophe-euryale/',
    slug: 'rhinolophe-euryale',
    isPriority: true,
  },
  {
    name: 'Sérotine commune',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/serotine-commune/',
    slug: 'serotine-commune',
    isPriority: false,
  },
  {
    name: 'Sérotine de Nilsson',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/serotine-de-nilsson/',
    slug: 'serotine-de-nilsson',
    isPriority: false,
  },
  {
    name: 'Vespère de Savi',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/vespere-de-savi/',
    slug: 'vespere-de-savi',
    isPriority: true,
  },
  {
    name: 'Vespertilion bicolore',
    pageUrl:
      'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/vespertilion-bicolore/',
    slug: 'vespertilion-bicolore',
    isPriority: false,
  },
];

/**
 * Filtre les espèces prioritaires pour la conservation
 */
export const PRIORITY_SPECIES = BAT_SPECIES.filter(
  species => species.isPriority
);

/**
 * Récupère une espèce par son slug
 */
export function getSpeciesBySlug(slug: string): BatSpecies | undefined {
  return BAT_SPECIES.find(species => species.slug === slug);
}

/**
 * Génère l'URL de l'image principale d'une espèce
 * Basé sur le pattern observé sur le site
 */
export function getSpeciesImageUrl(slug: string): string {
  return `https://plan-actions-chiropteres.fr/wp-content/uploads/2024/11/plan-actions-chiropteres.fr-${slug}-carte-${slug}-2048x1271.png`;
}

/**
 * Statistiques sur les espèces
 */
export const SPECIES_STATS = {
  total: BAT_SPECIES.length,
  priority: PRIORITY_SPECIES.length,
  nonPriority: BAT_SPECIES.length - PRIORITY_SPECIES.length,
};
