import ProcessHost from '@cmn/utils/modules/ProcessHost';

import { cancelFlushOnExit, flushOnExit } from './flushOnExit';
import writeAllSync from './writeAllSync';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const STDERR_FD = 2;

// Write as soon as this many characters are waiting, so a burst of logging
// can't pile up in memory
const MAX_BUFFER_LENGTH = 64 * 1024;

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

// Files open in this process, by absolute path
const openFiles = new Map<string, BufferedFileWriter>();

// ========================================================================= //
//                                  CLASSES                                  //
// ========================================================================= //

/**
 * Lines logged during the same turn of the event loop are collected and
 * written together in one synchronous write at the end of that turn, or as
 * soon as `MAX_BUFFER_LENGTH` is reached. Writing synchronously means:
 *
 * - Memory stays small: a burst of logging waits for the disk instead of
 *   piling up.
 * - Lines stay in order, since there's never more than one write at a time.
 * - Flushing (on exit, on a signal, or with `flush()`) writes everything:
 *   no write is ever left in progress.
 */
class BufferedFileWriter {
  readonly #filePath: string;
  readonly #fd: number;
  #buf = '';
  #scheduledFlush: NodeJS.Immediate | undefined;
  #users = 0;

  protected constructor(filePath: string, fd: number) {
    this.#filePath = filePath;
    this.#fd = fd;
  }

  /**
   * Get the writer for `filePath`. Loggers writing to the same file share one
   * writer, so their lines stay in order and the file is opened only once.
   * The directory is created if it's missing. 'a' opens with O_APPEND so
   * every write lands at the end of the file. Every `open()` must be
   * matched by a `release()`.
   */
  public static open(filePath: string): BufferedFileWriter {
    const { fs, path } = ProcessHost.nodeModules();
    const absPath = path.resolve(filePath);
    let writer = openFiles.get(absPath);
    if (!writer) {
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      const fd = fs.openSync(absPath, 'a');
      writer = new BufferedFileWriter(absPath, fd);
      openFiles.set(absPath, writer);
      flushOnExit(writer);
    }
    writer.#users++;
    return writer;
  }

  /**
   * Write a log
   */
  public write(value: string): void {
    this.#buf += value;
    if (this.#buf.length >= MAX_BUFFER_LENGTH) {
      this.flushSync();
    } else {
      this.#scheduledFlush ??= setImmediate(() => this.flushSync());
    }
  }

  /**
   * Resolves once everything written so far has reached the file.
   */
  public flush(): Promise<void> {
    this.flushSync();
    return Promise.resolve();
  }

  /**
   * Write whatever is buffered, right now. Also used when the process is
   * about to end.
   */
  public flushSync(): void {
    if (this.#scheduledFlush) {
      clearImmediate(this.#scheduledFlush);
      this.#scheduledFlush = undefined;
    }
    if (this.#buf.length === 0) return;
    const chunk = this.#buf;
    this.#buf = '';
    writeToFile(this.#fd, chunk);
  }

  /**
   * Stop using the file. It's closed once every user has released it.
   */
  public async release(): Promise<void> {
    await this.flush();
    this.#users--;
    if (this.#users > 0) return;
    openFiles.delete(this.#filePath);
    cancelFlushOnExit(this);
    ProcessHost.nodeModules().fs.closeSync(this.#fd);
  }
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Write `chunk` to the file. If that fails there is nowhere left to put the
 * lines, so report it rather than throw into the code that was logging (or
 * into an 'exit' handler).
 *
 * Used by: {@link BufferedFileWriter.flushSync}
 *
 * @private
 */
function writeToFile(fd: number, chunk: string): void {
  try {
    writeAllSync(fd, Buffer.from(chunk, 'utf8'));
  } catch (err) {
    reportWriteFailure(err);
  }
}

/**
 * Last resort: say on stderr that log lines were lost.
 *
 * Used by: {@link writeToFile}
 *
 * @private
 */
function reportWriteFailure(err: unknown): void {
  const detail = err instanceof Error ? err.message : String(err);
  try {
    ProcessHost.nodeModules().fs.writeSync(
      STDERR_FD,
      `jet-logger: file write failed: ${detail}\n`,
    );
  } catch {
    // stderr is gone too
  }
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default BufferedFileWriter;
