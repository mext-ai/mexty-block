import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { dts } from 'rollup-plugin-dts';
import fs from 'fs';
import path from 'path';

const packageJson = require('./package.json');

// Function to get all author entry files
function getAuthorEntries() {
  const authorsDir = path.join(__dirname, 'src', 'authors');
  if (!fs.existsSync(authorsDir)) {
    return {};
  }
  
  const entries = {};
  const authors = fs.readdirSync(authorsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  authors.forEach(author => {
    const entryPath = path.join(authorsDir, author, 'index.ts');
    if (fs.existsSync(entryPath)) {
      entries[`authors/${author}/index`] = `src/authors/${author}/index.ts`;
    }
  });
  
  return entries;
}

const authorEntries = getAuthorEntries();

export default [
  // Main package build
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
    external: ['react', 'react-dom'],
  },
  // Author entries build (if any exist)
  ...(Object.keys(authorEntries).length > 0 ? [{
    input: authorEntries,
    output: [
      {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
      },
      {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        entryFileNames: '[name].esm.js',
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
    external: ['react', 'react-dom'],
  }] : []),
  // Type definitions for main package
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
  // Type definitions for author entries (if any exist)
  ...(Object.keys(authorEntries).length > 0 ? [{
    input: Object.fromEntries(
      Object.keys(authorEntries).map(key => [key, `dist/${key}.d.ts`])
    ),
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].d.ts',
    },
    plugins: [dts()],
  }] : []),
]; 