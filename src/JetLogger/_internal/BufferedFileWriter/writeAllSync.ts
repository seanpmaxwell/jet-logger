import ProcessHost from '@cmn/utils/modules/ProcessHost';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

// Give up on a full file descriptor after ~1s
const MAX_RETRIES = 1000;

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Blocking write that loops until every byte is out, since `writeSync` can
 * also come up short. Waits and retries while a non-blocking descriptor is
 * full. Throws on failure.
 */
function writeAllSync(fd: number, bytes: Buffer): void {
  const { fs } = ProcessHost.nodeModules();
  let retries = 0;
  while (bytes.length > 0) {
    try {
      bytes = bytes.subarray(fs.writeSync(fd, bytes));
      retries = 0;
    } catch (err) {
      const isFull = (err as NodeJS.ErrnoException).code === 'EAGAIN';
      if (!isFull || ++retries > MAX_RETRIES) throw err;
      sleepSync(1);
    }
  }
}

/**
 * Block the thread for `ms` milliseconds.
 *
 * Used by: {@link writeAllSync}
 *
 * @private
 */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default writeAllSync;
