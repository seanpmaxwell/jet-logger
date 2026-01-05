/* eslint-disable no-console */
/* eslint-disable no-process-env */
import util from 'util';
import colors from 'colors';
import fs from 'fs';

/******************************************************************************
                                 Constants
******************************************************************************/

// Options for printing a log.
export const LOGGER_MODES = {
  Console: 'CONSOLE',
  File: 'FILE',
  Custom: 'CUSTOM',
  Off: 'OFF',
} as const;

// Log formats
export const FORMATS = {
  Line: 'LINE',
  Json: 'JSON',
} as const;

// Note colors here need be a color from
// the colors library above.
const Levels = {
  Info: {
    Color: 'green',
    Prefix: 'INFO',
  },
  Important: {
    Color: 'magenta',
    Prefix: 'IMPORTANT',
  },
  Warning: {
    Color: 'yellow',
    Prefix: 'WARNING',
  },
  Error: {
    Color: 'red',
    Prefix: 'ERROR',
  },
} as const;

const DEFAULTS = {
  mode: LOGGER_MODES.Console,
  filePath: 'jet-logger.log',
  timestamp: true,
  format: FORMATS.Line,
  customLogFn: () => ({}),
} as const;

// Errors
const Errors = {
  CustomLogFn:
    'Custom logger mode set to true, but no custom logger was ' + 'provided.',
  Mode:
    'The correct logger mode was not specified: Must be "CUSTOM", ' +
    '"FILE", "OFF", or "CONSOLE".',
} as const;

/******************************************************************************
                                  Types
******************************************************************************/

type LoggerModes = (typeof LOGGER_MODES)[keyof typeof LOGGER_MODES];
type Formats = (typeof FORMATS)[keyof typeof FORMATS];
type LevelProp = (typeof Levels)[keyof typeof Levels];
type FormatterFunction = (content: string, level: LevelProp) => string;
type LogFunction = (content: unknown, printFull?: boolean) => void;

export type CustomLogger = (
  timestamp: Date,
  prefix: string,
  content: unknown,
) => void;

interface Options {
  mode?: LoggerModes;
  filepath?: string;
  filepathDatetimeParam?: boolean;
  timestamp?: boolean;
  format?: Formats;
  customLogFn?: CustomLogger;
}

/******************************************************************************
                                Classes
******************************************************************************/

/**
 * Default function
 */
export function jetLogger(options?: Options) {
  let mode: LoggerModes = DEFAULTS.mode,
    filePath: string = DEFAULTS.filePath,
    timestamp: boolean = DEFAULTS.timestamp,
    format: Formats = DEFAULTS.format,
    customLogFn: CustomLogger = DEFAULTS.customLogFn;

  // Setup the mode
  if (options?.mode !== undefined) {
    mode = options.mode;
  } else if (!!process.env.JET_LOGGER_MODE) {
    mode = process.env.JET_LOGGER_MODE.toUpperCase() as LoggerModes;
  }

  // ** Logger Mode Off ** //
  if (mode === LOGGER_MODES.Off) {
    return {
      info: (_: unknown, __?: boolean) => ({}),
      imp: (_: unknown, __?: boolean) => ({}),
      warn: (_: unknown, __?: boolean) => ({}),
      err: (_: unknown, __?: boolean) => ({}),
    } as const;
  }

  // ** Custom Logger Function ** //
  if (mode === LOGGER_MODES.Custom) {
    if (options?.customLogFn !== undefined) {
      customLogFn = options.customLogFn;
    }
    if (!customLogFn) {
      throw Error(Errors.CustomLogFn);
    }
    return {
      info: printWithCustomLogger(Levels.Info, customLogFn),
      imp: printWithCustomLogger(Levels.Important, customLogFn),
      warn: printWithCustomLogger(Levels.Warning, customLogFn),
      err: printWithCustomLogger(Levels.Error, customLogFn),
    } as const;
  }

  // Filepath
  if (options?.filepath !== undefined) {
    filePath = options.filepath;
  } else if (!!process.env.JET_LOGGER_FILEPATH) {
    filePath = process.env.JET_LOGGER_FILEPATH;
  }

  // Timestamp
  if (options?.timestamp !== undefined) {
    timestamp = options.timestamp;
  } else if (!!process.env.JET_LOGGER_TIMESTAMP) {
    const envVar = process.env.JET_LOGGER_TIMESTAMP;
    timestamp = envVar.toUpperCase() === 'TRUE';
  }

  // Format
  if (options?.format !== undefined) {
    format = options.format;
  } else if (!!process.env.JET_LOGGER_FORMAT) {
    format = process.env.JET_LOGGER_FORMAT.toUpperCase() as Formats;
  }

  // Print line or json
  let formatter: FormatterFunction;
  if (format === FORMATS.Line) {
    formatter = setupLineFormat;
  } else if (format === FORMATS.Json) {
    formatter = setupJsonFormat;
  }

  // ** Print to File ** //
  if (mode === LOGGER_MODES.File) {
    // FilePath dateTime
    let filePathDatetime = true;
    if (options?.filepathDatetimeParam !== undefined) {
      filePathDatetime = options.filepathDatetimeParam;
    } else if (!!process.env.JET_LOGGER_FILEPATH_DATETIME) {
      const envVar = process.env.JET_LOGGER_FILEPATH_DATETIME;
      filePathDatetime = envVar.toUpperCase() === 'TRUE';
    }

    // Modify filepath if filepath datetime is true
    if (filePathDatetime) {
      filePath = addDatetimeToFileName(filePath);
    }

    // Return
    return {
      info: printToFile(Levels.Info, formatter, filePath),
      imp: printToFile(Levels.Important, formatter, filePath),
      warn: printToFile(Levels.Warning, formatter, filePath),
      err: printToFile(Levels.Error, formatter, filePath),
    } as const;
  }

  // Console (Default)
  return {
    info: printToConsole(Levels.Info, formatter),
    imp: printToConsole(Levels.Important, formatter),
    warn: printToConsole(Levels.Warning, formatter),
    err: printToConsole(Levels.Error, formatter),
  } as const;
}

// **** Print Custom Functions **** //

/**
 * Print a log with a custom logger function.
 */
function printWithCustomLogger(
  level: LevelProp,
  customLogFn: CustomLogger,
): LogFunction {
  return (content: unknown, printFull?: boolean) => {
    let contentNew;
    if (printFull) {
      contentNew = util.inspect(content);
    } else {
      contentNew = String(content);
    }
    return customLogFn(new Date(), level.Prefix, contentNew);
  };
}

/**
 * Write to file.
 */
function printToFile(
  level: LevelProp,
  formatter: FormatterFunction,
  filePath: string,
): LogFunction {
  return (content: unknown, printFull?: boolean) => {
    let contentNew;
    if (!!printFull) {
      contentNew = util.inspect(content);
    } else {
      contentNew = String(content);
    }
    contentNew = formatter(contentNew, level);
    fs.appendFile(filePath, contentNew, (err) => {
      if (!!err) {
        console.error(err);
      }
    });
  };
}

/**
 * Print a log to the console.
 */
function printToConsole(
  level: LevelProp,
  formatter: FormatterFunction,
): LogFunction {
  return (content: unknown, printFull?: boolean) => {
    let contentNew;
    if (!!printFull) {
      contentNew = util.inspect(content);
    } else {
      contentNew = String(content);
    }
    const colorFn = colors[level.Color];
    contentNew = formatter(contentNew, level);
    console.log(colorFn(contentNew));
  };
}

/**
 * Setup line format.
 */
function setupLineFormat(content: string, level: LevelProp): string {
  // pick up here, return different functions depending on whether timestamp
  // is truthy so we don't have to check at JIT

  content = level.Prefix + ': ' + content;
  if (timestamp) {
    const time = '[' + new Date().toISOString() + '] ';
    return time + content;
  }
  return content;
}

/**
 * Setup json format.
 */
function setupJsonFormat(content: string, level: LevelProp): string {
  const json: Record<string, unknown> = {
    level: level.Prefix,
    message: content,
  };
  if (timestamp) {
    json.timestamp = new Date().toISOString();
  }
  return JSON.stringify(json);
}

/******************************************************************************
                                  Export
******************************************************************************/

export default new JetLogger();
