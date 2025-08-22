import React, { useEffect, useRef, useState, useCallback } from 'react';
import { federationLoader } from '../utils/federationLoader';
import { blockRegistry } from '../utils/blockRegistry';

export interface BlockProps {
  blockId: string;
  props?: any;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  // Enable type checking for props
  validateProps?: boolean;
  // Data attribute for block identification
  dataMextyId?: string;
}

interface BlockPropsSchema {
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
}

const Block: React.FC<BlockProps> = ({
  blockId,
  props: blockProps,
  onLoad,
  onError,
  fallback,
  className,
  style,
  validateProps = false,
  dataMextyId
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [MountedComponent, setMountedComponent] = useState<React.ComponentType | null>(null);
  const [propsSchema, setPropsSchema] = useState<BlockPropsSchema | null>(null);
  const [validatedProps, setValidatedProps] = useState<any>(blockProps);

  // Validate props against schema
  const validatePropsAgainstSchema = useCallback((props: any, schema: BlockPropsSchema) => {
    if (!validateProps || !schema || !props) {
      return props;
    }

    console.log(`🔍 Validating props for block ${blockId}:`, props);
    console.log(`🔍 Against schema:`, schema);

    const validated: any = {};
    const warnings: string[] = [];

    // Apply defaults and validate required props
    Object.entries(schema.properties || {}).forEach(([propName, propDef]) => {
      const propValue = props[propName];
      
      // Check if required prop is missing
      if (schema.required?.includes(propName) && (propValue === undefined || propValue === null)) {
        if (propDef.default !== undefined) {
          validated[propName] = propDef.default;
          console.log(`🔧 Applied default value for required prop ${propName}:`, propDef.default);
        } else {
          warnings.push(`Required prop "${propName}" is missing`);
        }
      } else if (propValue !== undefined) {
        // Validate prop type (basic validation)
        const isValidType = validatePropType(propValue, propDef);
        if (isValidType) {
          validated[propName] = propValue;
        } else {
          warnings.push(`Prop "${propName}" has invalid type. Expected ${propDef.type}, got ${typeof propValue}`);
          // Use default if available
          if (propDef.default !== undefined) {
            validated[propName] = propDef.default;
            console.log(`🔧 Used default value for invalid prop ${propName}:`, propDef.default);
          }
        }
      } else if (propDef.default !== undefined) {
        // Apply default for optional props
        validated[propName] = propDef.default;
        console.log(`🔧 Applied default value for optional prop ${propName}:`, propDef.default);
      }
    });

    // Add additional properties if allowed
    if (schema.additionalProperties !== false) {
      Object.entries(props).forEach(([propName, propValue]) => {
        if (!schema.properties?.[propName]) {
          validated[propName] = propValue;
        }
      });
    }

    if (warnings.length > 0) {
      console.warn(`⚠️ Props validation warnings for block ${blockId}:`, warnings);
    }

    console.log(`✅ Validated props for block ${blockId}:`, validated);
    return validated;
  }, [blockId, validateProps]);

  // Basic type validation helper
  const validatePropType = (value: any, propDef: any): boolean => {
    const { type, enum: enumValues } = propDef;

    // Check enum values first
    if (enumValues && Array.isArray(enumValues)) {
      return enumValues.includes(value);
    }

    // Check basic types
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null;
      default:
        return true; // Allow unknown types
    }
  };

  // Fetch props schema when component mounts
  useEffect(() => {
    const fetchPropsSchema = async () => {
      if (!validateProps) return;

      try {
        console.log(`🔍 Fetching props schema for block: ${blockId}`);
        const metadata = await federationLoader.getBlockMetadata(blockId);
        
        if (metadata?.blockProps) {
          setPropsSchema(metadata.blockProps);
          console.log(`✅ Props schema loaded for block ${blockId}:`, metadata.blockProps);
        } else {
          console.log(`ℹ️ No props schema found for block ${blockId}`);
        }
      } catch (err: any) {
        console.warn(`⚠️ Failed to fetch props schema for block ${blockId}:`, err.message);
      }
    };

    fetchPropsSchema();
  }, [blockId, validateProps]);

  // Validate props when they change or schema is loaded
  useEffect(() => {
    if (propsSchema && blockProps) {
      const validated = validatePropsAgainstSchema(blockProps, propsSchema);
      setValidatedProps(validated);
    } else {
      setValidatedProps(blockProps);
    }
  }, [blockProps, propsSchema, validatePropsAgainstSchema]);

  // Load and create the mounted component
  useEffect(() => {
    console.log(`🔄 Block useEffect triggered - blockId: ${blockId}`);
    
    if (!blockId) {
      console.error(`❌ Block ID is required but got: ${blockId}`);
      setError(new Error('Block ID is required'));
      setIsLoading(false);
      return;
    }

    const loadAndMount = async () => {
      setIsLoading(true);
      setError(null);
      setMountedComponent(null);

      // Retry logic with exponential backoff
      const maxRetries = 3;
      const baseDelay = 500; // 500ms base delay
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Loading federation module: ${blockId} (attempt ${attempt}/${maxRetries})`);
          
          // Load the federation module
          const module = await federationLoader.loadModule(blockId);
          console.log(`✅ Module loaded:`, module);
          console.log(`🔍 Module keys:`, Object.keys(module || {}));
          
          // Get the mount function
          const mountFunction = module.mount || module.default?.mount;
          console.log(`🔍 Mount function found:`, !!mountFunction, typeof mountFunction);
          
          if (!mountFunction || typeof mountFunction !== 'function') {
            const errorMsg = `Block ${blockId} does not export a mount function. Available exports: ${Object.keys(module || {})}`;
            console.error(`❌ ${errorMsg}`);
            throw new Error(errorMsg);
          }

          // Create a wrapper component that handles mounting (like FederationTestPage)
          const WrapperComponent: React.FC = () => {
            const mountRef = useRef<HTMLDivElement>(null);
            const [mounted, setMounted] = useState(false);
            
            useEffect(() => {
              if (mountRef.current && !mounted) {
                try {
                  console.log(`🔧 Mounting block: ${blockId} with validated props:`, validatedProps);
                  mountFunction(mountRef.current, validatedProps);
                  setMounted(true);
                  console.log(`✅ Block mounted successfully: ${blockId}`);
                  onLoad?.();
                } catch (err: any) {
                  console.error(`❌ Failed to mount block ${blockId}:`, err);
                  onError?.(err);
                }
              }
            }, [mounted]);
            
            return (
              <div 
                ref={mountRef} 
                style={{ width: '100%', height: '100%' }}
              />
            );
          };

          setMountedComponent(() => WrapperComponent);
          setIsLoading(false);
          console.log(`✅ Block ${blockId} loaded successfully on attempt ${attempt}`);
          return; // Success - exit the retry loop
          
        } catch (err: any) {
          console.error(`❌ Failed to load block ${blockId} on attempt ${attempt}:`, err);
          
          // Check if this is a federation container error that might resolve with retry
          const isFederationError = err.message?.includes('Federation container not found') || 
                                  err.message?.includes('container not found') ||
                                  err.message?.includes('is not a function');
          
          if (isFederationError && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`⏳ Retrying block ${blockId} in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Try again
          }
          
          // If this was the last attempt or not a retryable error, fail
          console.error(`❌ Final failure loading block ${blockId}:`, err);
          console.error(`❌ Error stack:`, err.stack);
          console.error(`❌ Error details:`, {
            name: err.name,
            message: err.message,
            cause: err.cause,
            attempts: attempt
          });
          setError(err);
          setIsLoading(false);
          onError?.(err);
          return;
        }
      }
    };

    loadAndMount();
  }, [blockId, validatedProps, onLoad, onError]); // Include validatedProps in deps

  // Render loading state
  if (isLoading) {
    return (
      <div 
        className={className} 
        style={{ width: '100%', height: '100%', ...style }}
        data-mexty-id={dataMextyId}
      >
        {fallback || (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '2rem',
            color: '#666',
            height: '100%',
            width: '100%'
          }}>
            <div style={{ marginRight: '0.5rem' }}>⏳</div>
            Loading block {blockId}...
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div 
        className={className} 
        style={{ width: '100%', height: '100%', ...style }}
        data-mexty-id={dataMextyId}
      >
        <div style={{
          padding: '1rem',
          border: '1px solid #fee',
          borderRadius: '4px',
          backgroundColor: '#fef2f2',
          color: '#dc2626'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            ❌ Failed to load block
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Block ID: {blockId}
          </div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Error: {error.message}
          </div>
        </div>
      </div>
    );
  }

  // Render the mounted component
  if (MountedComponent) {
    return (
      <div 
        className={className} 
        style={{ width: '100%', height: '100%', ...style }}
        data-mexty-id={dataMextyId}
      >
        <MountedComponent />
      </div>
    );
  }

  return null;
};

export default Block; 