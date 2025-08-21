import React from 'react';
export interface AuthorBlockProps {
    author: string;
    component: string;
    [key: string]: any;
}
/**
 * AuthorBlock component that loads components from specific authors
 * Usage: <AuthorBlock author="johnsmith" component="Chart" data={chartData} />
 */
declare const AuthorBlock: React.FC<AuthorBlockProps>;
export default AuthorBlock;
/**
 * Create a typed author block component
 */
export declare function createAuthorBlock<T = any>(author: string, component: string): React.FC<T>;
/**
 * Create author namespace object with all components
 */
export declare function createAuthorNamespace(author: string): Promise<{
    [componentName: string]: React.ComponentType<any>;
}>;
//# sourceMappingURL=AuthorBlock.d.ts.map