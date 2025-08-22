import * as react from 'react';
import react__default from 'react';

interface BlockMetadata {
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
interface FederationModuleCache {
    [blockId: string]: {
        component: any;
        loadedAt: number;
        federationUrl: string;
    };
}
interface MountFunction {
    (container: HTMLElement, props?: any): void | (() => void);
}
interface FederationModule {
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
declare const federationLoader: FederationLoader;

interface BlockRegistryEntry {
    blockId: string;
    componentName: string;
    author?: string;
    title: string;
    description: string;
    version?: string;
    tags?: string[];
    lastUpdated: string;
}
interface BlockRegistry {
    [componentName: string]: BlockRegistryEntry;
}
interface AuthorNamespaceRegistry {
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
declare const blockRegistry: BlockRegistryManager;
/**
 * Helper function to create a registry entry
 */
declare function createRegistryEntry(blockId: string, componentName: string, title: string, description: string, options?: {
    version?: string;
    tags?: string[];
}): BlockRegistryEntry;

interface BlockProps {
    blockId: string;
    props?: any;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    fallback?: react__default.ReactNode;
    className?: string;
    style?: react__default.CSSProperties;
    validateProps?: boolean;
    'data-mexty-id'?: string;
}
declare const Block: react__default.FC<BlockProps>;

interface NamedBlockProps {
    props?: any;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    fallback?: react__default.ReactNode;
    className?: string;
    style?: react__default.CSSProperties;
    validateProps?: boolean;
}
/**
 * Factory function to create named block components
 */
declare function createNamedBlock(componentName: string, options?: {
    validateProps?: boolean;
    enableTypedProps?: boolean;
}): react__default.FC<NamedBlockProps>;
/**
 * Factory function to create strongly typed named block components
 * Uses the props schema from the server to provide proper TypeScript types
 */
declare function createTypedBlock<T = any>(componentName: string, options?: {
    defaultProps?: Partial<T>;
    validateProps?: boolean;
}): react__default.FC<Omit<NamedBlockProps, 'props'> & {
    props?: T;
}>;
/**
 * Higher-order component for creating named blocks with additional metadata
 */
declare function withBlockMetadata<P extends NamedBlockProps>(componentName: string, metadata?: {
    displayName?: string;
    description?: string;
    defaultProps?: Partial<P>;
    validateProps?: boolean;
}): (Component: react__default.ComponentType<P>) => react__default.FC<P>;

interface AuthorBlockProps {
    author: string;
    component: string;
    [key: string]: any;
}
/**
 * AuthorBlock component that loads components from specific authors
 * Usage: <AuthorBlock author="johnsmith" component="Chart" data={chartData} />
 */
declare const AuthorBlock: react__default.FC<AuthorBlockProps>;

/**
 * Create a typed author block component
 */
declare function createAuthorBlock<T = any>(author: string, component: string): react__default.FC<T>;
/**
 * Create author namespace object with all components
 */
declare function createAuthorNamespace(author: string): Promise<{
    [componentName: string]: react__default.ComponentType<any>;
}>;

interface MextBlockConfig {
    serverUrl?: string;
    cacheDuration?: number;
    enableLogging?: boolean;
}
/**
 * Configure the mext-block package
 */
declare function configure(config: MextBlockConfig): void;

declare const VirtualGame: react.FC<NamedBlockProps>;
declare const ThreeScene: react.FC<NamedBlockProps>;
declare const Chart: react.FC<NamedBlockProps>;
declare const Form: react.FC<NamedBlockProps>;
declare const VideoPlayer: react.FC<NamedBlockProps>;
declare const CodeEditor: react.FC<NamedBlockProps>;
declare const ImageGallery: react.FC<NamedBlockProps>;
declare const AnalyticsDashboard: react.FC<NamedBlockProps>;
declare const MextBlock: {
    Block: react.FC<BlockProps>;
    VirtualGame: react.FC<NamedBlockProps>;
    ThreeScene: react.FC<NamedBlockProps>;
    Chart: react.FC<NamedBlockProps>;
    Form: react.FC<NamedBlockProps>;
    VideoPlayer: react.FC<NamedBlockProps>;
    CodeEditor: react.FC<NamedBlockProps>;
    ImageGallery: react.FC<NamedBlockProps>;
    AnalyticsDashboard: react.FC<NamedBlockProps>;
    createNamedBlock: typeof createNamedBlock;
    createTypedBlock: typeof createTypedBlock;
    withBlockMetadata: typeof withBlockMetadata;
    blockRegistry: {
        registry: BlockRegistry;
        authorRegistry: AuthorNamespaceRegistry;
        serverUrl: string;
        lastFetched: number;
        cacheDuration: number;
        setServerUrl(url: string): void;
        fetchRegistry(): Promise<{
            registry: BlockRegistry;
            authorRegistry: AuthorNamespaceRegistry;
        }>;
        getRegistry(): Promise<BlockRegistry>;
        getAuthorRegistry(): Promise<AuthorNamespaceRegistry>;
        getBlockId(componentName: string): Promise<string | null>;
        getAuthorBlockId(author: string, componentName: string): Promise<string | null>;
        getAvailableComponents(): Promise<string[]>;
        getComponentInfo(componentName: string): Promise<BlockRegistryEntry | null>;
        getAuthorComponentInfo(author: string, componentName: string): Promise<BlockRegistryEntry | null>;
        getAuthorComponents(author: string): Promise<{
            [componentName: string]: BlockRegistryEntry;
        } | null>;
        getAvailableAuthors(): Promise<string[]>;
        addComponent(componentName: string, entry: BlockRegistryEntry): void;
        clearCache(): void;
        getLocalRegistry(): BlockRegistry;
        getLocalAuthorRegistry(): AuthorNamespaceRegistry;
    };
    federationLoader: {
        cache: FederationModuleCache;
        loadingPromises: {
            [blockId: string]: Promise<any>;
        };
        serverUrl: string;
        setServerUrl(url: string): void;
        getBlockMetadata(blockId: string): Promise<BlockMetadata>;
        loadModule(blockId: string): Promise<FederationModule>;
        _loadModuleInternal(blockId: string): Promise<FederationModule>;
        _loadScript(url: string): Promise<void>;
        _extractModule(blockId: string): Promise<FederationModule>;
        clearCache(blockId?: string): void;
        getCacheInfo(): FederationModuleCache;
    };
    configure: typeof configure;
};

export { AnalyticsDashboard, AuthorBlock, Block, Chart, CodeEditor, Form, ImageGallery, ThreeScene, VideoPlayer, VirtualGame, blockRegistry, configure, createAuthorBlock, createAuthorNamespace, createNamedBlock, createRegistryEntry, createTypedBlock, MextBlock as default, federationLoader, withBlockMetadata };
export type { AuthorBlockProps, AuthorNamespaceRegistry, BlockMetadata, BlockProps, BlockRegistry, BlockRegistryEntry, FederationModule, MextBlockConfig, MountFunction, NamedBlockProps };
