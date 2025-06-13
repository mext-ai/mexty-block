# @mexty/block

React components for MEXT federation modules with author namespace support.

## Installation

```bash
npm install @mexty/block @mexty/cli
mext sync
```

## Quick Start


### Author-Specific

```tsx
// Import specific components from different authors
import { Fps, GameEngine } from '@mexty/block/fabiensabatie';
import { Chart as JohnChart } from '@mexty/block/johnsmith';
import { Dashboard } from '@mexty/block/alicejohnson';

function MyApp() {
  return (
    <div>
      <Fps config={fpsConfig} />
      <GameEngine settings={gameSettings} />
      <JohnChart data={chartData} />
      <Dashboard metrics={dashboardData} />
    </div>
  );
}
```


## How It Works

1. **Federation Loading**: Components are loaded as federated modules from the MEXT server
2. **Author Namespaces**: Each user gets a unique namespace for their components
3. **Direct Imports**: Import components directly using `@mexty/block/authorname`
4. **Type Safety**: Full TypeScript support with proper type definitions

## CLI Integration

Use `mexty sync` to update available components:

```bash
npx @mexty/cli sync
```

This generates:
- Global namespace exports in the main package
- Author-specific entry files for direct imports
- TypeScript definitions for all components

## Available Import Patterns

```tsx
// Global namespace (backward compatible)
import { Chart } from '@mexty/block';

// Author-specific named imports
import { Fps, Chart as FabienChart } from '@mexty/block/fabiensabatie';

// Author-specific default import
import fabiensabatieComponents from '@mexty/block/fabiensabatie';
```

## Benefits

- **No Naming Conflicts**: Multiple authors can create components with the same name
- **Author Attribution**: Clear visibility of who created each component
- **Trusted Sources**: Use components from specific authors you trust
- **Tree Shaking**: Import only the components you need
- **Type Safety**: Full TypeScript support across all patterns

## Learn More

- [Author Namespaces Guide](./AUTHOR_NAMESPACES.md)
- [MEXT Documentation](https://mext.app/documentation)

## License

MIT 