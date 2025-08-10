import { runWithConcurrency } from '../src/utils/concurrency.js';

describe('runWithConcurrency', () => {
  it('exécute séquentiellement si limit=1', async () => {
    const items = [1,2,3];
    const order: number[] = [];
    const res = await runWithConcurrency(items, 1, async (n) => {
      order.push(n);
      return n * 2;
    });
    expect(res).toEqual([2,4,6]);
    expect(order).toEqual([1,2,3]);
  });

  it('respecte la limite de concurrence', async () => {
    const items = Array.from({length: 5}, (_,i)=>i);
    let active = 0;
    let maxActive = 0;
    const res = await runWithConcurrency(items, 2, async (n) => {
      active++;
      if (active > maxActive) maxActive = active;
      await new Promise(r=>setTimeout(r, 5));
      active--;
      return n;
    });
    expect(res).toEqual(items);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('capture les erreurs et les retourne à leur index', async () => {
    const items = [0,1,2];
    const res = await runWithConcurrency<number, number | string>(items, 3, async (n) => {
      if (n === 1) throw new Error('boom');
      return n;
    });
    expect(res[0]).toBe(0);
    expect((res as any)[1]).toBeInstanceOf(Error);
    expect(res[2]).toBe(2);
  });
});
