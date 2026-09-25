import { build as esbuild } from 'esbuild';
import fs from 'fs/promises';

import logger from '@src/index';

import onInit from '../dev-tools/onInit';
import shell from '../dev-tools/shell';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

await onInit(build, 'build');

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Build and bundle runtime code and type declarations.
 */
async function build() {
  // --- Delete and recreate the folder to keep things clean
  await fs.rm('./lib', { recursive: true, force: true });

  // ---- Typecheck
  // A type error rejects, so `onInit` exits non-zero before anything is built.
  await shell('tsc', ['-p', 'tsconfig.build.json', '--noEmit']);

  // ---- Bundle types
  // Only what `src/index.ts` exports is public; internal types stay private.
  await shell('dts-bundle-generator', [
    '--project',
    'tsconfig.build.json',
    '--export-referenced-types=false',
    '-o',
    'lib/index.d.ts',
    'src/index.ts',
  ]);

  // ---- Build
  await esbuild({
    entryPoints: {
      index: 'src/index.ts',
    },
    outdir: 'lib',
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'node',
  });

  // ---- Finish
  logger.info('Finished building. Output written to "lib/"');
}
