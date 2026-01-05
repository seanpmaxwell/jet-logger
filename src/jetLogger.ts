/* eslint-disable no-console */
/* eslint-disable no-process-env */
import colors from 'colors';
import fs from 'fs';
import util from 'util';

/******************************************************************************
                                 Constants
******************************************************************************/

// Options for printing a log.
const LOGGER_MODES = {
  Console: 'CONSOLE',
  File: 'FILE',
  Custom: 'CUSTOM',
  Off: 'OFF',
} as const;

// Log formats
const FORMATS = {
  Line: 'LINE',
  Json: 'JSON',
} as const;

// Note colors here need be a color from
// the colors library above.
const LEVELS = {
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
  CustomLogger:
    'Custom logger mode set to true, but no custom logger was provided.',
  Mode:
    'The correct logger mode was not specified: Must be "CUSTOM", "FILE", ' +
    '"OFF", or "CONSOLE".',
} as const;

export const JetLogger = {
  Modes: LOGGER_MODES,
  Formats: FORMATS,
  instanceOf,
} as const;

const kJetLogger = Symbol('k-jet-logger');

/******************************************************************************
                                  Types
******************************************************************************/

type LoggerModes = (typeof LOGGER_MODES)[keyof typeof LOGGER_MODES];
type Formats = (typeof FORMATS)[keyof typeof FORMATS];
type LevelProp = (typeof LEVELS)[keyof typeof LEVELS];
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
  customLogger?: CustomLogger;
}

interface JetLogger {
  info: (content: unknown, print?: boolean) => void;
  imp: (content: unknown, print?: boolean) => void;
  warn: (content: unknown, print?: boolean) => void;
  err: (content: unknown, print?: boolean) => void;
}

/******************************************************************************
                               Functions
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
      [kJetLogger]: true,
    } as const;
  }

  // ** Custom Logger Function ** //
  if (mode === LOGGER_MODES.Custom) {
    if (options?.customLogger !== undefined) {
      customLogFn = options.customLogger;
    }
    if (!customLogFn) {
      throw Error(Errors.CustomLogger);
    }
    return {
      info: setupPrintWithCustomLogger(LEVELS.Info, customLogFn),
      imp: setupPrintWithCustomLogger(LEVELS.Important, customLogFn),
      warn: setupPrintWithCustomLogger(LEVELS.Warning, customLogFn),
      err: setupPrintWithCustomLogger(LEVELS.Error, customLogFn),
      [kJetLogger]: true,
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

  // Setup the formatter
  let formatter: FormatterFunction = () => '';
  if (format === FORMATS.Line) {
    formatter = setupLineFormatter(timestamp);
  } else if (format === FORMATS.Json) {
    formatter = setupJsonFormatter(timestamp);
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
      info: setupPrintToFile(LEVELS.Info, formatter, filePath),
      imp: setupPrintToFile(LEVELS.Important, formatter, filePath),
      warn: setupPrintToFile(LEVELS.Warning, formatter, filePath),
      err: setupPrintToFile(LEVELS.Error, formatter, filePath),
      [kJetLogger]: true,
    } as const;
  }

  // Console (Default)
  return {
    info: setupPrintToConsole(LEVELS.Info, formatter),
    imp: setupPrintToConsole(LEVELS.Important, formatter),
    warn: setupPrintToConsole(LEVELS.Warning, formatter),
    err: setupPrintToConsole(LEVELS.Error, formatter),
    [kJetLogger]: true,
  } as const;
}

/**
 * Print a log with a custom logger function.
 */
function setupPrintWithCustomLogger(
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
 * Setup line format.
 */
function setupLineFormatter(timestamp: boolean): FormatterFunction {
  if (timestamp) {
    return (content: string, level: LevelProp) => {
      const contentNew = level.Prefix + ': ' + content,
        time = '[' + new Date().toISOString() + '] ';
      return time + contentNew;
    };
  } else {
    return (content: string, level: LevelProp) => {
      return level.Prefix + ': ' + content;
    };
  }
}

/**
 * Setup json format.
 */
function setupJsonFormatter(timestamp: boolean): FormatterFunction {
  if (timestamp) {
    return (content: string, level: LevelProp) => {
      const json: Record<string, unknown> = {
        level: level.Prefix,
        message: content,
      };
      json.timestamp = new Date().toISOString();
      return JSON.stringify(json);
    };
  } else {
    return (content: string, level: LevelProp) => {
      const json: Record<string, unknown> = {
        level: level.Prefix,
        message: content,
      };
      return JSON.stringify(json);
    };
  }
}

/**
 * Write to file.
 */
function setupPrintToFile(
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
function setupPrintToConsole(
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
 * Prepend the filename in the file path with a timestamp.
 * i.e. '/home/jet-logger.log' => '/home/20220805T033709_jet-logger.log'
 */
function addDatetimeToFileName(filePath: string): string {
  // Get the date string
  const dateStr = new Date()
    .toISOString()
    .split('-')
    .join('')
    .split(':')
    .join('')
    .slice(0, 15);
  // Setup new file name
  const filePathArr = filePath.split('/'),
    lastIdx = filePathArr.length - 1,
    fileName = filePathArr[lastIdx],
    fileNameNew = dateStr + '_' + fileName;
  // Setup new file path
  filePathArr[lastIdx] = fileNameNew;
  return filePathArr.join('/');
}

/**
 * Check if an object is an instance of jetLogger
 */
function instanceOf(arg: unknown): arg is JetLogger {
  return (
    typeof arg === 'object' &&
    (arg as Record<symbol, unknown>)[kJetLogger] === true
  );
}

/******************************************************************************
                                  Export
******************************************************************************/

export default jetLogger();
