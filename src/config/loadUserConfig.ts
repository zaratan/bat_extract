// Utility to load optional local user configuration file (batExtract.config.json)
// Returns a DeepPartial<DefaultConfig> or undefined if file absent or unreadable.
// No validation here; mergeConfig will perform key checking.

import { readFile } from 'fs/promises';
import type { DeepPartial, DefaultConfig } from './defaultConfig.js';

const DEFAULT_USER_CONFIG_FILENAME = 'batExtract.config.json';

export async function loadUserConfig(
  path: string = DEFAULT_USER_CONFIG_FILENAME
): Promise<DeepPartial<DefaultConfig> | undefined> {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as DeepPartial<DefaultConfig>;
  } catch {
    return undefined; // silent: file optional
  }
}

export async function resolveUserConfigFromProcess(
  args: string[]
): Promise<DeepPartial<DefaultConfig> | undefined> {
  // Precedence: --config <json> > env CONFIG > file
  // 1. CLI argument
  const idx = args.indexOf('--config');
  if (idx !== -1) {
    const raw = args[idx + 1];
    if (!raw) {
      console.error('⚠️  Argument --config fourni sans payload JSON.');
      process.exit(1);
    }
    try {
      return JSON.parse(raw) as DeepPartial<DefaultConfig>;
    } catch (e) {
      console.error('⚠️  JSON invalide pour --config:', (e as Error).message);
      process.exit(1);
    }
  }
  // 2. ENV
  if (process.env.CONFIG) {
    try {
      return JSON.parse(process.env.CONFIG) as DeepPartial<DefaultConfig>;
    } catch (e) {
      console.error(
        "⚠️  JSON invalide dans variable d'environnement CONFIG:",
        (e as Error).message
      );
      process.exit(1);
    }
  }
  // 3. File (optional)
  return loadUserConfig();
}
