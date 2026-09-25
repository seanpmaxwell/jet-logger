import unknownArrToStr from '@cmn/utils/fns/unknownArrToStr';

import { ContentStyle, TimestampStyle } from '../_local/constants/levels';
import { Formats } from '../_local/enums';
import { IOptions, LogEntry } from '../_local/types';

import { getLineTimestamp, toJsonStr } from './utils/fns';
import { LogWriter } from './utils/types';

// ========================================================================= //
//                                  CLASSES                                  //
// ========================================================================= //

/**
 * Write logs with the `console` methods, styled with CSS. Used in browsers
 * and anywhere else Node's modules aren't available.
 *
 * Log text is always passed as a `%s` argument, never as part of the format
 * string, so a "%c" or "%o" inside a message is printed as-is.
 */
class BrowserWriter implements LogWriter {
  readonly #formatter: (entry: LogEntry) => string[];

  private constructor(formatter: (entry: LogEntry) => string[]) {
    this.#formatter = formatter;
  }

  /**
   * Factory-function. Set which formatter to use when initialized.
   */
  public static of(options: IOptions): BrowserWriter {
    const { format, showTime } = options;
    if (format === Formats.JSON) {
      return new BrowserWriter((entry) => ['%s', toJsonStr(entry, showTime)]);
    }
    return new BrowserWriter((entry) => toStyledArgs(entry, showTime));
  }

  /**
   * Print log to the browser's console.
   */
  public writeLog(entry: LogEntry): void {
    const arr = this.#formatter(entry);
    // eslint-disable-next-line no-console
    console[entry.level.consoleFn](...arr);
  }

  /**
   * Print the arguments as their own line, without formatting.
   */
  public writeRaw(args: unknown[]): void {
    const str = unknownArrToStr(args, false);
    // eslint-disable-next-line no-console
    console.info('%s', str);
  }

  /**
   * `console` output isn't buffered.
   */
  public flush(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * For consistency.
   */
  public close(): Promise<void> {
    return Promise.resolve();
  }
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * `console` arguments for a styled line: a format string with a `%c` (the
 * CSS) and a `%s` (the text) for each part, followed by those values.
 *
 * Used by: {@link BrowserWriter.of}
 *
 * @private
 */
function toStyledArgs(entry: LogEntry, showTime: boolean): string[] {
  const { level, args } = entry;
  const content = unknownArrToStr(args, false);
  const line = [level.css, level.label, ContentStyle.css, content];
  if (!showTime) {
    return ['%c%s: %c%s', ...line];
  }
  // The console shows just the time of day
  const timestamp = [TimestampStyle.css, getLineTimestamp(false)];
  return ['%c%s %c%s: %c%s', ...timestamp, ...line];
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default BrowserWriter;
