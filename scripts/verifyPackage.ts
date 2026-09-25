import assert from 'assert/strict';
import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';

import logger, { type CustomTransportContext } from '@src/index';

import onInit from '../dev-tools/onInit';
import shell from '../dev-tools/shell';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const LIB_ENTRY = path.resolve('lib/index.js');
const LIB_TYPES = path.resolve('lib/index.d.ts');

const PACKED_FILES = [
  'LICENSE',
  'README.md',
  'lib/index.d.ts',
  'lib/index.js',
  'package.json',
] as const;

const PUBLIC_EXPORTS = [
  'CustomTransportContext',
  'CustomTransportFn',
  'InvalidOptionError',
  'JetLogger',
  'JetLoggerInstance',
  'JetLoggerOptions',
  'default',
] as const;

const LOGGER_METHODS = [
  'catch',
  'close',
  'err',
  'flush',
  'imp',
  'info',
  'line',
  'out',
  'warn',
] as const;

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

// Checks the built package (run `npm run build` first), not the source
await onInit(async () => {
  await checkPackedFiles();
  await checkEsmEntry();
  checkCommonJsEntry();
  await checkTypeExports();
  logger.info('Package verified.');
}, 'verifyPackage');

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Exactly the built files and docs get published.
 */
async function checkPackedFiles(): Promise<void> {
  const json = await shell('npm', [
    'pack',
    '--dry-run',
    '--json',
    '--ignore-scripts',
  ]);
  const [{ files }] = JSON.parse(json) as [{ files: { path: string }[] }];
  const packed = files.map((file) => file.path).sort();
  assert.deepEqual(packed, PACKED_FILES, 'unexpected files in the package');
}

/**
 * The ES module works end to end.
 */
async function checkEsmEntry(): Promise<void> {
  const lib = await import(pathToFileURL(LIB_ENTRY).href);
  assert.deepEqual(Object.keys(lib.default).sort(), LOGGER_METHODS);
  assert.equal(lib.JetLogger.Modes.CUSTOM, 'custom');
  assert.equal(typeof lib.InvalidOptionError, 'function');
  const received: string[] = [];
  const log = lib.JetLogger({
    mode: 'custom',
    customTransport: ({ level, msg }: CustomTransportContext) => {
      received.push(`${level}: ${msg}`);
    },
  });
  log.info('hello', 1);
  assert.deepEqual(received, ['INFO: hello 1']);
}

/**
 * CommonJS projects can `require()` the package on Node versions that
 * support loading ES modules that way (20.19+ and 22.12+).
 */
function checkCommonJsEntry(): void {
  if (!process.features.require_module) return;
  const lib = createRequire(import.meta.url)(LIB_ENTRY);
  assert.equal(typeof lib.JetLogger, 'function');
}

/**
 * Only the intended names are public in the type declarations.
 */
async function checkTypeExports(): Promise<void> {
  const dts = await fs.readFile(LIB_TYPES, 'utf8');
  const declared = [
    ...dts.matchAll(/^export (?:type|interface|declare \w+) (\w+)/gm),
  ].map((match) => match[1]);
  const exportBlock = /^export \{([^}]*)\};/m.exec(dts)?.[1] ?? '';
  const reexported = exportBlock
    .split(',')
    .map(
      (name) =>
        name
          .trim()
          .split(/\s+as\s+/)
          .pop() ?? '',
    )
    .filter((name) => name !== '');
  const exported = [...declared, ...reexported].sort();
  assert.deepEqual(exported, PUBLIC_EXPORTS, 'unexpected type exports');
}
