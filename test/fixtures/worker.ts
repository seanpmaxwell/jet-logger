import { JetLogger } from '@src/index';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //
// Loaded as a web worker by the browser tests. Workers have neither `window`
// nor `process`, which used to crash jet-logger on import.

declare function postMessage(message: string): void;

try {
  JetLogger({ showTime: false }).info('hello from a worker');
  postMessage('ok');
} catch (err) {
  postMessage(`failed: ${String(err)}`);
}
