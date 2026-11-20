import { build } from 'esbuild';
import { readFile, chmod } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url), 'utf8')
);

await build({
  entryPoints: ['src/presentation/main.ts'],
  outfile: 'dist/main.js',
  platform: 'node',
  target: 'node26',
  format: 'esm',
  bundle: true,
  packages: 'external',
  minify: true,
  treeShaking: true,
  legalComments: 'eof',
  tsconfig: 'tsconfig.build.json',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  sourcemap: true,
  charset: 'utf8',
  metafile: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  logLevel: 'info',
});

await chmod('dist/main.js', 0o755);
