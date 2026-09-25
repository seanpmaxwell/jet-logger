// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

// Signals that end the process by default without emitting 'exit'
const SIGNALS = ['SIGINT', 'SIGTERM'] as const;

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

interface Flushable {
  flushSync(): void;
}

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

let isInstalled = false;
const buffers = new Set<Flushable>();

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Flush `target` when the process exits or is stopped by SIGINT/SIGTERM. One
 * set of handlers covers every writer, so creating many loggers doesn't pile
 * up listeners.
 */
export function flushOnExit(target: Flushable): void {
  buffers.add(target);
  if (isInstalled) return;
  isInstalled = true;
  process.on('exit', flushAll);
  SIGNALS.forEach((signal) => process.on(signal, onSignal));
}

/**
 * Listening for a signal replaces Node's default of exiting, so when no one
 * else is listening, stop listening and re-send the signal. The process then
 * exits just as it would have without jet-logger. When the app has its own
 * handler, shutting down is left to it.
 *
 * Used by: {@link flushOnExit}
 *
 * @private
 */
function onSignal(signal: NodeJS.Signals): void {
  flushAll();
  if (process.listenerCount(signal) > 1) return;
  process.off(signal, onSignal);
  process.kill(process.pid, signal);
}

/**
 * Used by: {@link flushOnExit}, {@link onSignal}
 *
 * @private
 */
function flushAll(): void {
  buffers.forEach((buffer) => buffer.flushSync());
}

// ========================== `cancelFlushOnExit` ========================== //

/**
 * Stop flushing `target`, e.g. once its file is closed.
 */
export function cancelFlushOnExit(target: Flushable): void {
  buffers.delete(target);
}
