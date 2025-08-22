import React from 'react';
export interface BlockProps {
    blockId: string;
    props?: any;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    fallback?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    validateProps?: boolean;
    dataMextyId?: string;
}
declare const Block: React.FC<BlockProps>;
export default Block;
//# sourceMappingURL=Block.d.ts.map