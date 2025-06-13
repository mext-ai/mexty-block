import axios from 'axios';

export interface BlockRegistryEntry {
  blockId: string;
  componentName: string;
  author?: string; // Username of the author
  title: string;
  description: string;
  version?: string;
  tags?: string[];
  lastUpdated: string;
}

export interface BlockRegistry {
  [componentName: string]: BlockRegistryEntry;
}

export interface AuthorNamespaceRegistry {
  [author: string]: {
    [componentName: string]: BlockRegistryEntry;
  };
}

class BlockRegistryManager {
  public registry: BlockRegistry = {};
  public authorRegistry: AuthorNamespaceRegistry = {};
  public serverUrl: string;
  public lastFetched: number = 0;
  public cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  constructor(serverUrl: string = 'https://api.v2.mext.app') {
    this.serverUrl = serverUrl;
  }

  setServerUrl(url: string): void {
    this.serverUrl = url;
  }

  /**
   * Fetch the latest registry from server
   */
  async fetchRegistry(): Promise<{ registry: BlockRegistry; authorRegistry: AuthorNamespaceRegistry }> {
    try {
      console.log('🔄 Fetching block registry from server...');
      const response = await axios.get(`${this.serverUrl}/api/blocks/registry`);
      
      this.registry = response.data.registry || {};
      this.authorRegistry = response.data.authorRegistry || {};
      this.lastFetched = Date.now();
      
      console.log(`✅ Block registry loaded with ${Object.keys(this.registry).length} components and ${Object.keys(this.authorRegistry).length} authors`);
      return { registry: this.registry, authorRegistry: this.authorRegistry };
    } catch (error: any) {
      console.error('❌ Failed to fetch block registry:', error.message);
      // Return cached registry if available
      return { registry: this.registry, authorRegistry: this.authorRegistry };
    }
  }

  /**
   * Get registry, fetching from server if cache is stale
   */
  async getRegistry(): Promise<BlockRegistry> {
    const now = Date.now();
    
    // Fetch if cache is stale or empty
    if (now - this.lastFetched > this.cacheDuration || Object.keys(this.registry).length === 0) {
      await this.fetchRegistry();
    }
    
    return this.registry;
  }

  /**
   * Get author registry, fetching from server if cache is stale
   */
  async getAuthorRegistry(): Promise<AuthorNamespaceRegistry> {
    const now = Date.now();
    
    // Fetch if cache is stale or empty
    if (now - this.lastFetched > this.cacheDuration || Object.keys(this.authorRegistry).length === 0) {
      await this.fetchRegistry();
    }
    
    return this.authorRegistry;
  }

  /**
   * Get block ID for a component name (global namespace)
   */
  async getBlockId(componentName: string): Promise<string | null> {
    const registry = await this.getRegistry();
    const entry = registry[componentName];
    return entry ? entry.blockId : null;
  }

  /**
   * Get block ID for an author's component
   */
  async getAuthorBlockId(author: string, componentName: string): Promise<string | null> {
    const authorRegistry = await this.getAuthorRegistry();
    const entry = authorRegistry[author]?.[componentName];
    return entry ? entry.blockId : null;
  }

  /**
   * Get all available component names
   */
  async getAvailableComponents(): Promise<string[]> {
    const registry = await this.getRegistry();
    return Object.keys(registry);
  }

  /**
   * Get component info (global namespace)
   */
  async getComponentInfo(componentName: string): Promise<BlockRegistryEntry | null> {
    const registry = await this.getRegistry();
    return registry[componentName] || null;
  }

  /**
   * Get author's component info
   */
  async getAuthorComponentInfo(author: string, componentName: string): Promise<BlockRegistryEntry | null> {
    const authorRegistry = await this.getAuthorRegistry();
    return authorRegistry[author]?.[componentName] || null;
  }

  /**
   * Get all components for an author
   */
  async getAuthorComponents(author: string): Promise<{ [componentName: string]: BlockRegistryEntry } | null> {
    const authorRegistry = await this.getAuthorRegistry();
    return authorRegistry[author] || null;
  }

  /**
   * Get all available authors
   */
  async getAvailableAuthors(): Promise<string[]> {
    const authorRegistry = await this.getAuthorRegistry();
    return Object.keys(authorRegistry);
  }

  /**
   * Add a component to the local registry (for development)
   */
  addComponent(componentName: string, entry: BlockRegistryEntry): void {
    this.registry[componentName] = entry;
  }

  /**
   * Clear the registry cache
   */
  clearCache(): void {
    this.registry = {};
    this.authorRegistry = {};
    this.lastFetched = 0;
  }

  /**
   * Get local registry for debugging
   */
  getLocalRegistry(): BlockRegistry {
    return { ...this.registry };
  }

  /**
   * Get local author registry for debugging
   */
  getLocalAuthorRegistry(): AuthorNamespaceRegistry {
    return { ...this.authorRegistry };
  }
}

// Global instance
export const blockRegistry = new BlockRegistryManager();

/**
 * Helper function to create a registry entry
 */
export function createRegistryEntry(
  blockId: string,
  componentName: string,
  title: string,
  description: string,
  options: {
    version?: string;
    tags?: string[];
  } = {}
): BlockRegistryEntry {
  return {
    blockId,
    componentName,
    title,
    description,
    version: options.version,
    tags: options.tags,
    lastUpdated: new Date().toISOString()
  };
} 