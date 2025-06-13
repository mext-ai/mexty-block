import React, { useState, useEffect, useRef, Suspense } from 'react';
import { blockRegistry } from '../utils/blockRegistry';
import { federationLoader } from '../utils/federationLoader';
import type { BlockMetadata } from '../utils/federationLoader';

export interface AuthorBlockProps {
  author: string;
  component: string;
  [key: string]: any; // Allow any props to be passed through
}

/**
 * AuthorBlock component that loads components from specific authors
 * Usage: <AuthorBlock author="johnsmith" component="Chart" data={chartData} />
 */
const AuthorBlock: React.FC<AuthorBlockProps> = ({ author, component, ...props }) => {
  const [BlockComponent, setBlockComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<BlockMetadata | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAuthorComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔄 Loading component ${author}/${component}...`);

        // Get block ID for the author's component
        const blockId = await blockRegistry.getAuthorBlockId(author, component);
        
        if (!blockId) {
          throw new Error(`Component "${component}" not found for author "${author}"`);
        }

        console.log(`📦 Found block ID: ${blockId} for ${author}/${component}`);

        // Load the federated module
        const module = await federationLoader.loadModule(blockId);
        
        if (!isMounted) return;

        // Get the mount function
        const mountFunction = module.mount || module.default?.mount;
        
        if (!mountFunction || typeof mountFunction !== 'function') {
          throw new Error(`Block ${blockId} does not export a mount function`);
        }

        // Create a React wrapper component for the mount function
        const WrapperComponent: React.FC<any> = (wrapperProps) => {
          const containerRef = useRef<HTMLDivElement>(null);
          const cleanupRef = useRef<(() => void) | null>(null);

          useEffect(() => {
            if (containerRef.current) {
              console.log(`🔄 Mounting ${author}/${component} with props:`, wrapperProps);
              
              try {
                const cleanup = mountFunction(containerRef.current, wrapperProps);
                if (typeof cleanup === 'function') {
                  cleanupRef.current = cleanup;
                }
                console.log(`✅ Successfully mounted ${author}/${component}`);
              } catch (err: any) {
                console.error(`❌ Failed to mount ${author}/${component}:`, err);
              }
            }

            return () => {
              if (cleanupRef.current) {
                console.log(`🧹 Cleaning up ${author}/${component}`);
                cleanupRef.current();
                cleanupRef.current = null;
              }
            };
          }, [wrapperProps]);

          return <div ref={containerRef} className="mext-federation-container" />;
        };

        WrapperComponent.displayName = `FederatedComponent(${author}/${component})`;

        // Get metadata for debugging
        const blockMetadata = await federationLoader.getBlockMetadata(blockId);
        
        setBlockComponent(() => WrapperComponent);
        setMetadata(blockMetadata);
        console.log(`✅ Successfully loaded ${author}/${component}`);

      } catch (err: any) {
        console.error(`❌ Failed to load ${author}/${component}:`, err);
        if (isMounted) {
          setError(err.message || 'Failed to load component');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAuthorComponent();

    return () => {
      isMounted = false;
    };
  }, [author, component]);

  if (loading) {
    return (
      <div className="mext-block-loading" style={{ 
        padding: '20px', 
        textAlign: 'center',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        color: '#666'
      }}>
        <div>Loading {author}/{component}...</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          Fetching federated component
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mext-block-error" style={{ 
        padding: '20px', 
        textAlign: 'center',
        border: '1px solid #ff6b6b',
        borderRadius: '4px',
        backgroundColor: '#ffe0e0',
        color: '#d63031'
      }}>
        <div><strong>Error loading {author}/{component}</strong></div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          {error}
        </div>
        <div style={{ fontSize: '11px', marginTop: '8px', color: '#666' }}>
          Make sure the component exists and is published
        </div>
      </div>
    );
  }

  if (!BlockComponent) {
    return (
      <div className="mext-block-not-found" style={{ 
        padding: '20px', 
        textAlign: 'center',
        border: '1px dashed #ffa500',
        borderRadius: '4px',
        backgroundColor: '#fff8e1',
        color: '#f57c00'
      }}>
        <div>Component {author}/{component} not available</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          The component may not be built or published yet
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="mext-block-suspense" style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#666'
      }}>
        Initializing {author}/{component}...
      </div>
    }>
      <div className="mext-author-block" data-author={author} data-component={component}>
        <BlockComponent {...props} />
        {metadata && (
          <div className="mext-block-metadata" style={{ display: 'none' }}>
            {JSON.stringify(metadata)}
          </div>
        )}
      </div>
    </Suspense>
  );
};

export default AuthorBlock;

/**
 * Create a typed author block component
 */
export function createAuthorBlock<T = any>(author: string, component: string) {
  const AuthorBlockComponent: React.FC<T> = (props) => (
    <AuthorBlock author={author} component={component} {...props} />
  );
  
  AuthorBlockComponent.displayName = `AuthorBlock(${author}/${component})`;
  
  return AuthorBlockComponent;
}

/**
 * Create author namespace object with all components
 */
export async function createAuthorNamespace(author: string): Promise<{ [componentName: string]: React.ComponentType<any> }> {
  try {
    const components = await blockRegistry.getAuthorComponents(author);
    
    if (!components) {
      console.warn(`No components found for author: ${author}`);
      return {};
    }

    const namespace: { [componentName: string]: React.ComponentType<any> } = {};

    for (const [componentName] of Object.entries(components)) {
      namespace[componentName] = createAuthorBlock(author, componentName);
    }

    return namespace;
  } catch (error: any) {
    console.error(`Failed to create author namespace for ${author}:`, error);
    return {};
  }
} 