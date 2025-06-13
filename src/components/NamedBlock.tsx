import React, { useState, useEffect } from 'react';
import Block, { BlockProps } from './Block';
import { blockRegistry } from '../utils/blockRegistry';

export interface NamedBlockProps {
  props?: any;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  // Enable type checking for props
  validateProps?: boolean;
}

/**
 * Factory function to create named block components
 */
export function createNamedBlock(componentName: string, options: {
  validateProps?: boolean;
  enableTypedProps?: boolean;
} = {}): React.FC<NamedBlockProps> {
  const NamedBlockComponent: React.FC<NamedBlockProps> = (componentProps) => {
    const [blockId, setBlockId] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const loadBlockId = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const foundBlockId = await blockRegistry.getBlockId(componentName);
          
          if (!foundBlockId) {
            throw new Error(`Component "${componentName}" not found in registry. Available components: ${(await blockRegistry.getAvailableComponents()).join(', ')}`);
          }
          
          setBlockId(foundBlockId);
        } catch (err: any) {
          console.error(`❌ Failed to resolve component "${componentName}":`, err);
          setError(err);
        } finally {
          setIsLoading(false);
        }
      };

      loadBlockId();
    }, [componentName]);

    // Show loading state while resolving component name
    if (isLoading) {
      return (
        <div className={componentProps.className} style={componentProps.style}>
          {componentProps.fallback || (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '2rem',
              color: '#666'
            }}>
              <div style={{ marginRight: '0.5rem' }}>🔍</div>
              Resolving component {componentName}...
            </div>
          )}
        </div>
      );
    }

    // Show error if component name couldn't be resolved
    if (error || !blockId) {
      return (
        <div className={componentProps.className} style={componentProps.style}>
          <div style={{
            padding: '1rem',
            border: '1px solid #fee',
            borderRadius: '4px',
            backgroundColor: '#fef2f2',
            color: '#dc2626'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ❌ Component not found
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              Component: {componentName}
            </div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Error: {error?.message || 'Unknown error'}
            </div>
          </div>
        </div>
      );
    }

    // Determine if props validation should be enabled
    const shouldValidateProps = componentProps.validateProps ?? options.validateProps ?? options.enableTypedProps ?? false;

    // Render the actual Block component with resolved blockId
    return (
      <Block
        blockId={blockId}
        props={componentProps.props}
        onLoad={componentProps.onLoad}
        onError={componentProps.onError}
        fallback={componentProps.fallback}
        className={componentProps.className}
        style={componentProps.style}
        validateProps={shouldValidateProps}
      />
    );
  };

  // Set display name for debugging
  NamedBlockComponent.displayName = `NamedBlock(${componentName})`;

  return NamedBlockComponent;
}

/**
 * Factory function to create strongly typed named block components
 * Uses the props schema from the server to provide proper TypeScript types
 */
export function createTypedBlock<T = any>(componentName: string, options: {
  defaultProps?: Partial<T>;
  validateProps?: boolean;
} = {}): React.FC<Omit<NamedBlockProps, 'props'> & { props?: T }> {
  
  const TypedBlockComponent: React.FC<Omit<NamedBlockProps, 'props'> & { props?: T }> = (componentProps) => {
    // Create the named block with validation enabled by default for typed blocks
    const NamedBlock = createNamedBlock(componentName, { 
      validateProps: options.validateProps ?? true,
      enableTypedProps: true 
    });
    
    // Merge with default props if provided
    const mergedProps = options.defaultProps 
      ? { ...options.defaultProps, ...componentProps.props }
      : componentProps.props;

    return (
      <NamedBlock
        {...componentProps}
        props={mergedProps}
      />
    );
  };

  TypedBlockComponent.displayName = `TypedBlock(${componentName})`;
  
  return TypedBlockComponent;
}

/**
 * Higher-order component for creating named blocks with additional metadata
 */
export function withBlockMetadata<P extends NamedBlockProps>(
  componentName: string,
  metadata: {
    displayName?: string;
    description?: string;
    defaultProps?: Partial<P>;
    validateProps?: boolean;
  } = {}
) {
  return function(Component: React.ComponentType<P>) {
    const WithMetadata: React.FC<P> = (props) => {
      const mergedProps = { ...metadata.defaultProps, ...props } as P;
      return <Component {...mergedProps} />;
    };

    WithMetadata.displayName = metadata.displayName || `WithBlockMetadata(${componentName})`;
    
    return WithMetadata;
  };
} 