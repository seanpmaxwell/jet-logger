import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import logger, { JetLogger, type JetLoggerInstance } from '@src/index';

import onInit from '../dev-tools/onInit';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const LINES = 100_000;

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

// Rough throughput in lines per second. Console output is left out so the
// numbers aren't limited by the terminal.
await onInit(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jet-logger-bench-'));
  try {
    const filepath = (name: string) => path.join(dir, name);
    await measure(
      'file, line format',
      JetLogger({ mode: 'file', filepath: filepath('line.log') }),
    );
    await measure(
      'file, json format',
      JetLogger({ mode: 'file', format: 'json', filepath: filepath('j.log') }),
    );
    await measure(
      'custom transport (formatting only)',
      JetLogger({ mode: 'custom', customTransport: () => undefined }),
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}, 'benchmark');

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Log `LINES` lines and wait until they are all written.
 */
async function measure(name: string, log: JetLoggerInstance): Promise<void> {
  const start = performance.now();
  for (let i = 0; i < LINES; i++) {
    log.info('request handled', i, { status: 200, path: '/api/users' });
  }
  await log.flush();
  const seconds = (performance.now() - start) / 1000;
  const perSecond = Math.round(LINES / seconds).toLocaleString('en-US');
  logger.info(`${name}: ${perSecond} lines/sec`);
  await log.close();
}
