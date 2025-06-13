import { federationLoader } from './utils/federationLoader';
import { blockRegistry } from './utils/blockRegistry';

export interface MextBlockConfig {
  serverUrl?: string;
  cacheDuration?: number;
  enableLogging?: boolean;
}

/**
 * Configure the mext-block package
 */
export function configure(config: MextBlockConfig): void {
  if (config.serverUrl) {
    federationLoader.setServerUrl(config.serverUrl);
    blockRegistry.setServerUrl(config.serverUrl);
  }

  if (config.enableLogging !== undefined) {
    // Future: control logging level
    console.log(`🔧 MEXT Block logging ${config.enableLogging ? 'enabled' : 'disabled'}`);
  }

  console.log('🔧 MEXT Block configured:', config);
} 