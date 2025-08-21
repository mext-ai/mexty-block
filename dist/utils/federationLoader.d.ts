export interface BlockMetadata {
    blockId: string;
    title: string;
    description: string;
    federationUrl: string;
    buildStatus: 'pending' | 'building' | 'success' | 'failed';
    lastBuilt?: string;
    blockProps?: {
        type: 'object';
        properties: {
            [propName: string]: {
                type: 'string' | 'number' | 'boolean' | 'array' | 'object';
                description?: string;
                required?: boolean;
                default?: any;
                enum?: any[];
                items?: any;
                properties?: any;
            };
        };
        required?: string[];
        additionalProperties?: boolean;
    };
    propsLastParsed?: string;
}
export interface FederationModuleCache {
    [blockId: string]: {
        component: any;
        loadedAt: number;
        federationUrl: string;
    };
}
export interface MountFunction {
    (container: HTMLElement, props?: any): void | (() => void);
}
export interface FederationModule {
    mount?: MountFunction;
    default?: {
        mount?: MountFunction;
    };
}
declare class FederationLoader {
    cache: FederationModuleCache;
    loadingPromises: {
        [blockId: string]: Promise<any>;
    };
    serverUrl: string;
    constructor(serverUrl?: string);
    setServerUrl(url: string): void;
    /**
     * Get block metadata from server
     */
    getBlockMetadata(blockId: string): Promise<BlockMetadata>;
    /**
     * Load federation module dynamically
     */
    loadModule(blockId: string): Promise<FederationModule>;
    _loadModuleInternal(blockId: string): Promise<FederationModule>;
    _loadScript(url: string): Promise<void>;
    _extractModule(blockId: string): Promise<FederationModule>;
    /**
     * Clear cache for a specific block or all blocks
     */
    clearCache(blockId?: string): void;
    /**
     * Get cache info for debugging
     */
    getCacheInfo(): FederationModuleCache;
}
export declare const federationLoader: FederationLoader;
export {};
//# sourceMappingURL=federationLoader.d.ts.map