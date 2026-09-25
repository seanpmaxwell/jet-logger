import changeFileExt from '@cmn/utils/fns/changeFileExt';
import prependTimestampToFilename from '@cmn/utils/fns/prependTimestampToFilename';
import unknownArrToStr from '@cmn/utils/fns/unknownArrToStr';
import ProcessHost from '@cmn/utils/modules/ProcessHost';

import { DEFAULT_LOG_FILE_NAME } from '../_local/constants/misc';
import { Formats } from '../_local/enums';
import { IOptions, LogEntry } from '../_local/types';

import BufferedFileWriter from './BufferedFileWriter/BufferedFileWriter';
import { paintPlain, toJsonStr, toLineStr } from './utils/fns';
import { LogWriter } from './utils/types';

// ========================================================================= //
//                                  CLASSES                                  //
// ========================================================================= //

class FileWriter implements LogWriter {
  readonly #file: BufferedFileWriter;
  readonly #formatter: (entry: LogEntry) => string;

  /**
   * Constructor
   */
  private constructor(
    file: BufferedFileWriter,
    formatter: (entry: LogEntry) => string,
  ) {
    this.#file = file;
    this.#formatter = formatter;
  }

  /**
   * Factory-function
   */
  public static of(options: IOptions): FileWriter {
    const { format, showTime } = options;
    const filepath = getFilePath(options);
    const file = BufferedFileWriter.open(filepath);
    if (format === Formats.JSON) {
      return new FileWriter(file, (entry) => toJsonStr(entry, showTime));
    }
    return new FileWriter(file, (entry) =>
      toLineStr(entry, { showTime, showDate: true, paint: paintPlain }),
    );
  }

  /**
   * Write a log to the file path.
   */
  public writeLog(entry: LogEntry): void {
    this.#file.write(this.#formatter(entry) + '\n');
  }

  /**
   * Write the arguments as their own line, without formatting.
   */
  public writeRaw(args: unknown[]): void {
    this.#file.write(unknownArrToStr(args, false) + '\n');
  }

  /**
   *
   */
  public flush(): Promise<void> {
    return this.#file.flush();
  }

  /**
   *
   */
  public close(): Promise<void> {
    return this.#file.release();
  }
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * The path actually written to. JSON logs using the default file name get a
 * ".jsonl" extension.
 *
 * Used by: {@link FileWriter.of}
 *
 * @private
 */
function getFilePath(options: IOptions): string {
  let { filepath } = options;
  if (options.format === Formats.JSON && isDefaultFileName(filepath)) {
    filepath = changeFileExt(filepath, 'jsonl');
  }
  if (options.prependTimeToFilename) {
    filepath = prependTimestampToFilename(filepath);
  }
  return filepath;
}

/**
 * Used by: {@link getFilePath}
 *
 * @private
 */
function isDefaultFileName(filepath: string): boolean {
  const { path } = ProcessHost.nodeModules();
  return path.basename(filepath) === DEFAULT_LOG_FILE_NAME;
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default FileWriter;
