import React from 'react';
export interface NamedBlockProps {
    props?: any;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    fallback?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    validateProps?: boolean;
}
/**
 * Factory function to create named block components
 */
export declare function createNamedBlock(componentName: string, options?: {
    validateProps?: boolean;
    enableTypedProps?: boolean;
}): React.FC<NamedBlockProps>;
/**
 * Factory function to create strongly typed named block components
 * Uses the props schema from the server to provide proper TypeScript types
 */
export declare function createTypedBlock<T = any>(componentName: string, options?: {
    defaultProps?: Partial<T>;
    validateProps?: boolean;
}): React.FC<Omit<NamedBlockProps, 'props'> & {
    props?: T;
}>;
/**
 * Higher-order component for creating named blocks with additional metadata
 */
export declare function withBlockMetadata<P extends NamedBlockProps>(componentName: string, metadata?: {
    displayName?: string;
    description?: string;
    defaultProps?: Partial<P>;
    validateProps?: boolean;
}): (Component: React.ComponentType<P>) => React.FC<P>;
//# sourceMappingURL=NamedBlock.d.ts.map