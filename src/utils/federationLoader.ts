import axios from 'axios';

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
  (container: HTMLElement, props?: any): void | (() => void); // Returns optional cleanup function
}

export interface FederationModule {
  mount?: MountFunction;
  default?: {
    mount?: MountFunction;
  };
}

class FederationLoader {
  public cache: FederationModuleCache = {};
  public loadingPromises: { [blockId: string]: Promise<any> } = {};
  public serverUrl: string;

  constructor(serverUrl: string = 'https://api.v2.mext.app') {
    this.serverUrl = serverUrl;
  }

  setServerUrl(url: string): void {
    this.serverUrl = url;
  }

  /**
   * Get block metadata from server
   */
  async getBlockMetadata(blockId: string): Promise<BlockMetadata> {
    console.log(`🔄 Fetching metadata for block: ${blockId} from ${this.serverUrl}`);
    try {
      const url = `${this.serverUrl}/api/blocks/${blockId}`;
      console.log(`📡 Making request to: ${url}`);
      const response = await axios.get(url);
      console.log(`✅ Block metadata received:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to fetch block metadata for ${blockId}:`, error);
      console.error(`❌ Request URL: ${this.serverUrl}/api/blocks/${blockId}`);
      console.error(`❌ Error details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to fetch block metadata: ${error.message}`);
    }
  }

  /**
   * Load federation module dynamically
   */
  async loadModule(blockId: string): Promise<FederationModule> {
    console.log(`🔄 loadModule called for block: ${blockId}`);
    
    // Return cached module if available and not too old (5 minutes)
    const cached = this.cache[blockId];
    if (cached && Date.now() - cached.loadedAt < 5 * 60 * 1000) {
      console.log(`💾 Returning cached module for block: ${blockId}`);
      return cached.component;
    } else if (cached) {
      console.log(`⏰ Cached module expired for block: ${blockId}, reloading`);
    } else {
      console.log(`🆕 No cached module found for block: ${blockId}`);
    }

    // Return existing loading promise if already loading
    if (blockId in this.loadingPromises) {
      console.log(`⏳ Already loading block: ${blockId}, returning existing promise`);
      return this.loadingPromises[blockId];
    }

    console.log(`🚀 Starting fresh load for block: ${blockId}`);
    // Start loading process
    this.loadingPromises[blockId] = this._loadModuleInternal(blockId);
    
    try {
      const module = await this.loadingPromises[blockId];
      console.log(`✅ loadModule completed for block: ${blockId}`);
      return module;
    } catch (error) {
      console.error(`❌ loadModule failed for block: ${blockId}:`, error);
      throw error;
    } finally {
      console.log(`🧹 Cleaning up loading promise for block: ${blockId}`);
      delete this.loadingPromises[blockId];
    }
  }

  public async _loadModuleInternal(blockId: string): Promise<FederationModule> {
    try {
      // Get block metadata to find federation URL
      const metadata = await this.getBlockMetadata(blockId);
      
      if (!metadata.federationUrl) {
        throw new Error(`Block ${blockId} does not have a federation URL`);
      }

      if (metadata.buildStatus !== 'success') {
        throw new Error(`Block ${blockId} build status is ${metadata.buildStatus}`);
      }

      // Use federation URL as-is if it's already a complete URL, otherwise prefix with server URL
      const federationUrl = metadata.federationUrl.startsWith('http') 
        ? metadata.federationUrl 
        : `${this.serverUrl}${metadata.federationUrl}`;
      
      console.log(`🔄 Loading federation module: ${federationUrl}`);

      // Load the federation script
      await this._loadScript(federationUrl);

      // Try to find the federation container
      const module = await this._extractModule(blockId);

      // Cache the loaded module
      this.cache[blockId] = {
        component: module,
        loadedAt: Date.now(),
        federationUrl: metadata.federationUrl
      };

      console.log(`✅ Successfully loaded federation module: ${blockId}`);
      return module;

    } catch (error: any) {
      console.error(`❌ Failed to load federation module ${blockId}:`, error);
      throw error;
    }
  }

  public _loadScript(url: string): Promise<void> {
    console.log(`📜 Loading script: ${url}`);
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (existingScript) {
        console.log(`♻️ Script already loaded: ${url}`);
        resolve();
        return;
      }

      console.log(`🆕 Creating new script element for: ${url}`);
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        console.log(`✅ Script loaded successfully: ${url}`);
        resolve();
      };
      script.onerror = (event) => {
        console.error(`❌ Script failed to load: ${url}`, event);
        reject(new Error(`Failed to load script: ${url}`));
      };
      
      console.log(`➕ Appending script to document head: ${url}`);
      document.head.appendChild(script);
    });
  }

  public async _extractModule(blockId: string): Promise<FederationModule> {
    // Try different possible module names
    const possibleNames = [
      blockId,
      blockId.replace(/[^a-zA-Z0-9]/g, ''),
      `block${blockId.replace(/[^a-zA-Z0-9]/g, '')}`,
      'threescene', // default name from webpack template
    ];

    console.log(`🔍 Trying federation container names:`, possibleNames);

    for (const name of possibleNames) {
      const container = (window as any)[name];
      if (container && container.get) {
        console.log(`✅ Found federation container: ${name}`);
        
        try {
          const factory = await container.get('./Block');
          const module = factory();
          
          // Validate that the module has a mount function
          const mountFunction = module.mount || module.default?.mount;
          if (typeof mountFunction === 'function') {
            return module;
          } else {
            console.warn(`⚠️ Module ${name} does not export a mount function`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get module from container ${name}:`, error);
        }
      }
    }

    // Show what's actually available for debugging
    const federationLike = Object.keys(window).filter(key => {
      const obj = (window as any)[key];
      return obj && typeof obj === 'object' && 'get' in obj;
    });
    console.log(`🔍 Available federation containers:`, federationLike);

    throw new Error(`Federation container not found for block ${blockId}. Tried: ${possibleNames.join(', ')}`);
  }

  /**
   * Clear cache for a specific block or all blocks
   */
  clearCache(blockId?: string): void {
    if (blockId) {
      delete this.cache[blockId];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): FederationModuleCache {
    return { ...this.cache };
  }
}

// Global instance
export const federationLoader = new FederationLoader(); 