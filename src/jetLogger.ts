/* eslint-disable no-console */
/* eslint-disable no-process-env */
import colors from 'colors';
import fs from 'fs';
import util from 'util';

/******************************************************************************
                                 Constants
******************************************************************************/

// Options for printing a log.
const Modes = {
  CONSOLE: 'console',
  FILE: 'file',
  CUSTOM: 'custom',
  OFF: 'off',
} as const;

// Log formats
const Formats = {
  LINE: 'line',
  JSON: 'json',
} as const;

// Note colors here need be a color from
// the colors library above.
const Levels = {
  Info: {
    COLOR: 'green',
    PREFIX: 'INFO',
  },
  Important: {
    COLOR: 'magenta',
    PREFIX: 'IMPORTANT',
  },
  Warning: {
    COLOR: 'yellow',
    PREFIX: 'WARNING',
  },
  Error: {
    COLOR: 'red',
    PREFIX: 'ERROR',
  },
} as const;

const Defaults = {
  MODE: Modes.CONSOLE,
  FILE_PATH: 'jet-logger.log',
  TIMESTAMP: true,
  FORMAT: Formats.LINE,
  CUSTOM_LOGGER_FUNCTION: () => ({}),
} as const;

// Errors
const Errors = {
  CUSTOM_LOGGER:
    'Custom logger mode set to true, but no custom logger was provided.',
  MODE:
    'The correct logger mode was not specified: Must be "custom", "file", ' +
    '"off", or "console".',
} as const;

export const JetLogger = {
  Modes,
  Formats,
} as const;

/******************************************************************************
                                  Types
******************************************************************************/

type Modes = (typeof Modes)[keyof typeof Modes];
type Formats = (typeof Formats)[keyof typeof Formats];
type LevelProp = (typeof Levels)[keyof typeof Levels];
type FormatterFunction = (content: string, level: LevelProp) => string;
type LogFunction = (content: unknown, printFull?: boolean) => void;

export type CustomLogger = (
  timestamp: Date,
  prefix: string,
  content: unknown,
) => void;

interface Options {
  mode?: Modes;
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
  let mode: Modes = Defaults.MODE,
    filePath: string = Defaults.FILE_PATH,
    timestamp: boolean = Defaults.TIMESTAMP,
    format: Formats = Defaults.FORMAT,
    customLogFn: CustomLogger = Defaults.CUSTOM_LOGGER_FUNCTION;

  // Setup the mode
  if (options?.mode !== undefined) {
    mode = options.mode;
  } else if (!!process.env.JET_LOGGER_MODE) {
    mode = process.env.JET_LOGGER_MODE.toLowerCase() as Modes;
  }

  // ** Logger Mode Off ** //
  if (mode === Modes.OFF) {
    return {
      info: (_: unknown, __?: boolean) => ({}),
      imp: (_: unknown, __?: boolean) => ({}),
      warn: (_: unknown, __?: boolean) => ({}),
      err: (_: unknown, __?: boolean) => ({}),
    } as const;
  }

  // ** Custom Logger Function ** //
  if (mode === Modes.CUSTOM) {
    if (options?.customLogger !== undefined) {
      customLogFn = options.customLogger;
    }
    if (!customLogFn) {
      throw Error(Errors.CUSTOM_LOGGER);
    }
    return {
      info: setupPrintWithCustomLogger(Levels.Info, customLogFn),
      imp: setupPrintWithCustomLogger(Levels.Important, customLogFn),
      warn: setupPrintWithCustomLogger(Levels.Warning, customLogFn),
      err: setupPrintWithCustomLogger(Levels.Error, customLogFn),
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
    timestamp = envVar.toLowerCase() === 'true';
  }

  // Format
  if (options?.format !== undefined) {
    format = options.format;
  } else if (!!process.env.JET_LOGGER_FORMAT) {
    format = process.env.JET_LOGGER_FORMAT.toLowerCase() as Formats;
  }

  // Setup the formatter
  let formatter: FormatterFunction = () => '';
  if (format === Formats.LINE) {
    formatter = setupLineFormatter(timestamp);
  } else if (format === Formats.JSON) {
    formatter = setupJsonFormatter(timestamp);
  }

  // ** Print to File ** //
  if (mode === Modes.FILE) {
    // FilePath dateTime
    let filePathDatetime = true;
    if (options?.filepathDatetimeParam !== undefined) {
      filePathDatetime = options.filepathDatetimeParam;
    } else if (!!process.env.JET_LOGGER_FILEPATH_DATETIME) {
      const envVar = process.env.JET_LOGGER_FILEPATH_DATETIME;
      filePathDatetime = envVar.toLowerCase() === 'true';
    }
    // Modify filepath if filepath datetime is true
    if (filePathDatetime) {
      filePath = addDatetimeToFileName(filePath);
    }
    // Return
    return {
      info: setupPrintToFile(Levels.Info, formatter, filePath),
      imp: setupPrintToFile(Levels.Important, formatter, filePath),
      warn: setupPrintToFile(Levels.Warning, formatter, filePath),
      err: setupPrintToFile(Levels.Error, formatter, filePath),
    } as const;
  }

  // Console (Default)
  return {
    info: setupPrintToConsole(Levels.Info, formatter),
    imp: setupPrintToConsole(Levels.Important, formatter),
    warn: setupPrintToConsole(Levels.Warning, formatter),
    err: setupPrintToConsole(Levels.Error, formatter),
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
    return customLogFn(new Date(), level.PREFIX, contentNew);
  };
}

/**
 * Setup line format.
 */
function setupLineFormatter(timestamp: boolean): FormatterFunction {
  if (timestamp) {
    return (content: string, level: LevelProp) => {
      const contentNew = level.PREFIX + ': ' + content,
        time = '[' + new Date().toISOString() + '] ';
      return time + contentNew;
    };
  } else {
    return (content: string, level: LevelProp) => {
      return level.PREFIX + ': ' + content;
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
        level: level.PREFIX,
        message: content,
      };
      json.timestamp = new Date().toISOString();
      return JSON.stringify(json);
    };
  } else {
    return (content: string, level: LevelProp) => {
      const json: Record<string, unknown> = {
        level: level.PREFIX,
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
    fs.appendFile(filePath, contentNew + '\n', (err) => {
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
    const colorFn = colors[level.COLOR];
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

/******************************************************************************
                                  Export
******************************************************************************/

export default jetLogger();
