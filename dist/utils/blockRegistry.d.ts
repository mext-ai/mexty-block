export interface BlockRegistryEntry {
    blockId: string;
    componentName: string;
    author?: string;
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
declare class BlockRegistryManager {
    registry: BlockRegistry;
    authorRegistry: AuthorNamespaceRegistry;
    serverUrl: string;
    lastFetched: number;
    cacheDuration: number;
    constructor(serverUrl?: string);
    setServerUrl(url: string): void;
    /**
     * Fetch the latest registry from server
     */
    fetchRegistry(): Promise<{
        registry: BlockRegistry;
        authorRegistry: AuthorNamespaceRegistry;
    }>;
    /**
     * Get registry, fetching from server if cache is stale
     */
    getRegistry(): Promise<BlockRegistry>;
    /**
     * Get author registry, fetching from server if cache is stale
     */
    getAuthorRegistry(): Promise<AuthorNamespaceRegistry>;
    /**
     * Get block ID for a component name (global namespace)
     */
    getBlockId(componentName: string): Promise<string | null>;
    /**
     * Get block ID for an author's component
     */
    getAuthorBlockId(author: string, componentName: string): Promise<string | null>;
    /**
     * Get all available component names
     */
    getAvailableComponents(): Promise<string[]>;
    /**
     * Get component info (global namespace)
     */
    getComponentInfo(componentName: string): Promise<BlockRegistryEntry | null>;
    /**
     * Get author's component info
     */
    getAuthorComponentInfo(author: string, componentName: string): Promise<BlockRegistryEntry | null>;
    /**
     * Get all components for an author
     */
    getAuthorComponents(author: string): Promise<{
        [componentName: string]: BlockRegistryEntry;
    } | null>;
    /**
     * Get all available authors
     */
    getAvailableAuthors(): Promise<string[]>;
    /**
     * Add a component to the local registry (for development)
     */
    addComponent(componentName: string, entry: BlockRegistryEntry): void;
    /**
     * Clear the registry cache
     */
    clearCache(): void;
    /**
     * Get local registry for debugging
     */
    getLocalRegistry(): BlockRegistry;
    /**
     * Get local author registry for debugging
     */
    getLocalAuthorRegistry(): AuthorNamespaceRegistry;
}
export declare const blockRegistry: BlockRegistryManager;
/**
 * Helper function to create a registry entry
 */
export declare function createRegistryEntry(blockId: string, componentName: string, title: string, description: string, options?: {
    version?: string;
    tags?: string[];
}): BlockRegistryEntry;
export {};
//# sourceMappingURL=blockRegistry.d.ts.map