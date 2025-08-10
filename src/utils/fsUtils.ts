import { access, readFile } from 'fs/promises';

export interface ReadJsonOptions {
  optional?: boolean;
}

/**
 * Lit un fichier JSON avec gestion centralisée des erreurs.
 */
export async function readJson<T>(
  filePath: string,
  options?: ReadJsonOptions
): Promise<T | undefined> {
  try {
    await access(filePath);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (options?.optional && err?.code === 'ENOENT') return undefined;
    throw new Error(
      `readJson: missing file ${filePath}: ${err?.message || String(err)}`
    );
  }
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (e: unknown) {
    const err = e as { message?: string };
    throw new Error(
      `readJson: parse failed for ${filePath}: ${err?.message || String(err)}`
    );
  }
}
