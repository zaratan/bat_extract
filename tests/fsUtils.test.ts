import { readJson } from '../src/utils/fsUtils.js';
import { access, readFile } from 'fs/promises';

jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn()
}));

const mockAccess = access as unknown as jest.Mock;
const mockReadFile = readFile as unknown as jest.Mock;

describe('utils/readJson', () => {
  beforeEach(() => {
    mockAccess.mockReset();
    mockReadFile.mockReset();
  });

  it('retourne le JSON parsé en cas de succès', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue('{"a":1,"b":"test"}');

    const data = await readJson<{ a: number; b: string }>('file.json');
    expect(data).toEqual({ a: 1, b: 'test' });
  });

  it('retourne undefined si fichier manquant et option optional', async () => {
    mockAccess.mockRejectedValue({ code: 'ENOENT' });
    const data = await readJson('missing.json', { optional: true });
    expect(data).toBeUndefined();
  });

  it('jette une erreur si fichier manquant sans optional', async () => {
    mockAccess.mockRejectedValue({ code: 'ENOENT', message: 'no file' });
    await expect(readJson('absent.json')).rejects.toThrow(/missing file absent\.json/i);
  });

  it('jette une erreur de parse si JSON invalide', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue('{ invalid');
    await expect(readJson('corrupt.json')).rejects.toThrow(/parse failed.*corrupt\.json/i);
  });
});
