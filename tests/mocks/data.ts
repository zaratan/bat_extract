/**
 * Données mockées pour les tests - HTML d'une page d'espèce
 */
export const mockSpeciesPageHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Barbastelle d'Europe - Plan Actions Chiroptères</title>
</head>
<body>
    <div class="species-content">
        <h1>Barbastelle d'Europe</h1>
        <div class="carte-container">
            <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/2024/11/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-1024x636.png" 
                 alt="Carte de distribution de la Barbastelle d'Europe" 
                 class="carte-distribution">
        </div>
    </div>
</body>
</html>
`;

/**
 * Données mockées pour les tests - HTML de la page principale des espèces
 */
export const mockMainPageHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Les espèces - Plan Actions Chiroptères</title>
</head>
<body>
    <div class="species-list">
        <article class="species-item" data-priority="true">
            <h3><a href="/barbastelle-deurope/">Barbastelle d'Europe</a></h3>
            <span class="priority-indicator">Espèce prioritaire</span>
        </article>
        <article class="species-item" data-priority="false">
            <h3><a href="/pipistrelle-commune/">Pipistrelle commune</a></h3>
        </article>
        <article class="species-item" data-priority="true">
            <h3><a href="/grand-murin/">Grand Murin</a></h3>
            <span class="priority-indicator">Espèce prioritaire</span>
        </article>
    </div>
</body>
</html>
`;

/**
 * Données mockées pour les tests - Données d'espèces générées
 */
export const mockGeneratedSpeciesData = {
  metadata: {
    generationDate: '2025-08-09T12:00:00.000Z',
    sourceUrl: 'https://plan-actions-chiropteres.fr/les-especes/',
    totalSpecies: 3,
    prioritySpecies: 2,
    nonPrioritySpecies: 1,
    priorityPercentage: 67
  },
  species: [
    {
      name: "Barbastelle d'Europe",
      slug: 'barbastelle-deurope',
      url: 'https://plan-actions-chiropteres.fr/barbastelle-deurope/',
      isPriority: true
    },
    {
      name: 'Pipistrelle commune',
      slug: 'pipistrelle-commune', 
      url: 'https://plan-actions-chiropteres.fr/pipistrelle-commune/',
      isPriority: false
    },
    {
      name: 'Grand Murin',
      slug: 'grand-murin',
      url: 'https://plan-actions-chiropteres.fr/grand-murin/',
      isPriority: true
    }
  ]
};

/**
 * Données mockées pour les tests - URLs d'images découvertes
 */
export const mockDiscoveredImageUrls = {
  metadata: {
    discoveryDate: '2025-08-09T12:30:00.000Z',
    totalSpecies: 3,
    successfulDiscoveries: 2,
    failedDiscoveries: 1,
    successRate: 67
  },
  discoveries: [
    {
      speciesName: "Barbastelle d'Europe",
      slug: 'barbastelle-deurope',
      url: 'https://plan-actions-chiropteres.fr/barbastelle-deurope/',
      imageUrl: 'https://plan-actions-chiropteres.fr/wp-content/uploads/2024/11/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-1024x636.png',
      success: true
    },
    {
      speciesName: 'Grand Murin',
      slug: 'grand-murin',
      url: 'https://plan-actions-chiropteres.fr/grand-murin/',
      imageUrl: 'https://plan-actions-chiropteres.fr/wp-content/uploads/2024/12/plan-actions-chiropteres.fr-grand-murin-carte-grand-murin-1024x636.png',
      success: true
    },
    {
      speciesName: 'Pipistrelle commune',
      slug: 'pipistrelle-commune',
      url: 'https://plan-actions-chiropteres.fr/pipistrelle-commune/',
      imageUrl: null,
      success: false,
      error: 'Aucune image trouvée'
    }
  ]
};
