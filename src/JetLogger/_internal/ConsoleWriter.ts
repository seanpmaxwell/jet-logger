import unknownArrToStr from '@cmn/utils/fns/unknownArrToStr';

import { Formats } from '../_local/enums';
import { IOptions, LogEntry } from '../_local/types';

import { paintAnsi, paintPlain, toJsonStr, toLineStr } from './utils/fns';
import { LogWriter } from './utils/types';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type Formatter = (entry: LogEntry, colors: boolean) => string;

// ========================================================================= //
//                                  CLASSES                                  //
// ========================================================================= //

/**
 * Print to stdout (info, imp) and stderr (warn, err) through Node's streams.
 * The streams handle full pipes and keep the output in order with the app's
 * own `console.log` calls. On Linux they write synchronously, so nothing is
 * left in memory if the process is killed.
 */
class ConsoleWriter implements LogWriter {
  readonly #formatter: Formatter;
  // Decided per stream: stdout can be a terminal while stderr is a file
  readonly #colorsOut: boolean;
  readonly #colorsErr: boolean;

  private constructor(formatter: Formatter) {
    this.#formatter = formatter;
    this.#colorsOut = shouldUseColors(process.stdout);
    this.#colorsErr = shouldUseColors(process.stderr);
  }

  /**
   * Factory-function: Set which formatter to use when initialized.
   */
  public static of(options: IOptions): ConsoleWriter {
    const { format, showTime } = options;
    if (format === Formats.JSON) {
      return new ConsoleWriter((entry) => toJsonStr(entry, showTime));
    }
    return new ConsoleWriter((entry, colors) => {
      const paint = colors ? paintAnsi : paintPlain;
      return toLineStr(entry, { showTime, showDate: false, paint });
    });
  }

  /**
   * Print a log to the local console.
   */
  public writeLog(entry: LogEntry): void {
    if (entry.level.consoleFn === 'info') {
      const output = this.#formatter(entry, this.#colorsOut);
      process.stdout.write(output + '\n');
    } else {
      const output = this.#formatter(entry, this.#colorsErr);
      process.stderr.write(output + '\n');
    }
  }

  /**
   * Print the arguments as their own line, without formatting.
   */
  public writeRaw(args: unknown[]): void {
    const output = unknownArrToStr(args, this.#colorsOut);
    process.stdout.write(output + '\n');
  }

  /**
   * Resolves once both streams have written everything queued so far.
   */
  public async flush(): Promise<void> {
    const d1 = drain(process.stdout);
    const d2 = drain(process.stderr);
    await Promise.all([d1, d2]);
  }

  /**
   * The streams belong to the process, so there is nothing to release.
   */
  public close(): Promise<void> {
    return this.flush();
  }
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Colors only when a person is likely watching: the stream is a terminal
 * that supports them. `FORCE_COLOR` and `NO_COLOR` override that.
 *
 * Used by: {@link ConsoleWriter}
 *
 * @private
 */
function shouldUseColors(stream: NodeJS.WriteStream): boolean {
  const { FORCE_COLOR, NO_COLOR } = process.env;
  if (FORCE_COLOR !== undefined) {
    const forceColor = FORCE_COLOR.toLowerCase();
    return !['0', 'false'].includes(forceColor);
  }
  if (NO_COLOR) return false;
  return stream.isTTY === true && (stream.hasColors?.() ?? true);
}

/**
 * The callback of an empty write runs after every earlier write is done.
 *
 * Used by: {@link ConsoleWriter.flush}
 *
 * @private
 */
function drain(stream: NodeJS.WriteStream): Promise<void> {
  return new Promise((resolve) => stream.write('', () => resolve()));
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default ConsoleWriter;
