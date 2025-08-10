/**
 * Utilitaire de parallélisation limitée (pool simple)\n * Lance jusqu'à `limit` promesses simultanément tout en conservant\n * l'ordre des résultats (index d'origine).\n *\n * Idempotent / sans état externe : pure sur ses paramètres.\n */
export async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (limit <= 1 || items.length <= 1) {
    const sequential: R[] = [];
    for (let i = 0; i < items.length; i++) {
      sequential.push(await worker(items[i], i));
    }
    return sequential;
  }
  const results: (R | Error)[] = new Array(items.length);
  let nextIndex = 0;
  let active = 0;
  return new Promise<R[]>(resolve => {
    const launch = (): void => {
      if (nextIndex >= items.length) {
        if (active === 0) {
          // On cast: le type externe attend R[], l'appelant peut filtrer/inspecter les erreurs si besoin
          resolve(results as R[]);
        }
        return;
      }
      const current = nextIndex++;
      active++;
      Promise.resolve(worker(items[current], current))
        .then(res => {
          results[current] = res;
        })
        .catch(err => {
          results[current] =
            err instanceof Error ? err : new Error(String(err));
        })
        .finally(() => {
          active--;
          launch();
          if (active === 0 && nextIndex >= items.length) {
            resolve(results as R[]);
          }
        });
      if (active < limit) launch();
    };
    launch();
  });
}
