import { JetLogger } from '@src/index';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //
// Logs numbered lines, then ends the process the way the test asks:
//
//   node --import tsx logLines.ts <console|file> <count> <ending> [filepath]
//
// Endings: natural, exit, sigterm, throw, app-sigterm-handler

const [mode, count, ending, filepath] = process.argv.slice(2);

// Most apps print something themselves. On a pipe, that switches stdout to
// non-blocking mode, which is what used to make jet-logger drop lines.
// eslint-disable-next-line no-console
console.log('app started');

const log = JetLogger({
  mode: mode as 'console' | 'file',
  filepath,
  showTime: false,
});
for (let i = 0; i < Number(count); i++) {
  log.info(`line ${i} ${'x'.repeat(60)}`);
}

// A real app is still running when SIGTERM arrives (e.g. a server with open
// connections). Node handles signals on its event loop, so without something
// keeping the process busy it could finish and exit normally before the
// signal is handled. If the signal doesn't end the process, the timer lets
// it exit with code 0 and the test fails.
const keepRunning = () => setTimeout(() => undefined, 10_000);

switch (ending) {
  case 'exit':
    process.exit(0);
    break;
  case 'sigterm':
    keepRunning();
    process.kill(process.pid, 'SIGTERM');
    break;
  case 'throw':
    throw new Error('crash');
  case 'app-sigterm-handler':
    keepRunning();
    process.on('SIGTERM', () => process.exit(7));
    process.kill(process.pid, 'SIGTERM');
    break;
}
