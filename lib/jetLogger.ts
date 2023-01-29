/**
 * Structure/function based 
 */

import util from 'util';
import colors from 'colors';
import fs from 'fs';


// **** Variables **** //

// Options for printing a log.
export enum LoggerModes {
  Console = 'CONSOLE',
  File = 'FILE',
  Custom = 'CUSTOM',
  Off = 'OFF',
}

// Log formats
export enum Formats {
  Line = 'LINE',
  Json = 'JSON',
}

// Note colors here need be a color from 
// the colors library above.
const Levels = {
  Info: {
    Color: 'green',
    Prefix: 'INFO',
  },
  Imp: {
    Color: 'magenta',
    Prefix: 'IMPORTANT',
  },
  Warn: {
    Color: 'yellow',
    Prefix: 'WARNING',
  },
  Err: {
    Color: 'red',
    Prefix: 'ERROR',
  }
} as const;

// Errors
const Errors = {
  customLogFn: 'Custom logger mode set to true, but no custom logger was ' + 
    'provided.',
  Mode: 'The correct logger mode was not specified: Must be "CUSTOM", ' +
    '"FILE", "OFF", or "CONSOLE".'
} as const;

// If there are no manual or env settings
const Defaults = {
  Filepath: 'jet-logger.log',
  Mode: LoggerModes.Console,
  Timestamp: true,
  FilepathDatetime: true,
  Format: Formats.Line,
} as const;


// **** Types **** //

type TLevelProp = typeof Levels[keyof typeof Levels];
type TLogFn = (content: any, printFull?: boolean) => void;

export type TCustomLogFn = (
  timestamp: Date,
  prefix: string, 
  content: unknown,
) => void;

interface IJsonFormat {
  timestamp?: string;
  level: TLevelProp['Prefix'];
  message: string;
}

export interface ILogger {
  settings: ISettings;
  info: TLogFn;
  imp: TLogFn;
  warn: TLogFn;
  err: TLogFn;
}

interface ISettings {
  mode: LoggerModes,
  filepath: string,
  filepathDatetime: boolean,
  timestamp: boolean,
  format: Formats,
  customLogFn?: TCustomLogFn,
}


// **** Functions **** //

/**
 * Main function of Jet-Logger.
 */
export function jetLogger(
  mode?: LoggerModes,
  filepath?: string,
  filepathDatetime?: boolean,
  timestamp?: boolean,
  format?: Formats,
  customLogFn?: TCustomLogFn,
): ILogger {
  // Get settings
  const settings = getSettings(mode, filepath, timestamp, filepathDatetime, 
    format, customLogFn);
  // Return
  return { settings, info, imp, warn, err } as const;
}

/**
 * Get settings manually if truthy or from the env variables.
 */
function getSettings(
  mode?: LoggerModes,
  filepath?: string,
  filepathDatetime?: boolean,
  timestamp?: boolean,
  format?: Formats,
  customLogFn?: TCustomLogFn,
): ISettings {
  // Setup the mode
  if (!mode) {
    if (!!process.env.JET_LOGGER_MODE) {
      mode = process.env.JET_LOGGER_MODE.toUpperCase() as LoggerModes;
    } else {
      mode = Defaults.Mode;
    }
  }
  // Filepath
  if (!filepath) {
    if (!!process.env.JET_LOGGER_FILEPATH) {
      filepath = process.env.JET_LOGGER_FILEPATH;
    } else {
      filepath = Defaults.Filepath;
    }
  }
  // FilePath dateTime
  if (filepathDatetime === undefined || filepathDatetime === null) {
    const envVar = process.env.JET_LOGGER_FILEPATH_DATETIME;
    if (!!envVar) {
      filepathDatetime = (envVar.toUpperCase() === 'TRUE');
    } else {
      filepathDatetime = Defaults.FilepathDatetime;
    }
  }
  // Timestamp
  if (timestamp === undefined || timestamp === null) {
    if (!!process.env.JET_LOGGER_TIMESTAMP) {
      timestamp = (process.env.JET_LOGGER_TIMESTAMP.toUpperCase() === 'TRUE');
    } else {
      timestamp = Defaults.Timestamp;
    }
  }
  // Format
  if (!format) {
    if (!!process.env.JET_LOGGER_FORMAT) {
      format = process.env.JET_LOGGER_FORMAT.toUpperCase() as Formats;
    } else {
      format = Defaults.Format;
    }
  }
  // Modify filepath if filepath datetime is true
  if (filepathDatetime) {
    filepath = addDatetimeToFileName(filepath);
  }
  // Return
  return {
    mode,
    filepath,
    filepathDatetime,
    timestamp,
    format,
    customLogFn,
  } as const;
}

/**
 * Prepend the filename in the file path with a timestamp. 
 * i.e. '/home/jet-logger.log' => '/home/20220805T033709_jet-logger.log'
 */
function addDatetimeToFileName(filePath: string): string {
  // Get the date string
  const dateStr = new Date().toISOString()
    .split('-').join('')
    .split(':').join('')
    .slice(0, 15);
  // Setup new file name
  const filePathArr = filePath.split('/'),
    lastIdx = filePathArr.length - 1,
    fileName = filePathArr[lastIdx],
    fileNameNew = (dateStr + '_' + fileName);
  // Setup new file path
  filePathArr[lastIdx] = fileNameNew;
  return filePathArr.join('/');
}

/**
 * Print information.
 */
function info(this: ILogger, content: any, printFull?: boolean): void {
  return printLog(content, printFull ?? false, Levels.Info, this.settings);
}

/**
 * Print important.
 */
function imp(this: ILogger, content: any, printFull?: boolean): void {
  return printLog(content, printFull ?? false, Levels.Imp, this.settings);
}

/**
 * Print warning.
 */
function warn(this: ILogger, content: any, printFull?: boolean): void {
  return printLog(content, printFull ?? false, Levels.Warn, this.settings);
}

/**
 * Print error.
 */
function err(this: ILogger, content: any, printFull?: boolean): void {
  return printLog(content, printFull ?? false, Levels.Err, this.settings);
}

/**
 * Print the log using the provided settings.
 */
function printLog(
  content: any,
  printFull: boolean,
  level: TLevelProp,
  settings: ISettings,
): void {
  // Settings
  const {
    mode,
    format,
    timestamp,
    filepath,
    customLogFn,
  } = settings;
  // Do nothing if turned off
  if (mode === LoggerModes.Off) {
    return;
  }
  // Print full
  if (printFull) {
    content = util.inspect(content);
  }
  // Fire the custom logger if that's the option
  if (mode === LoggerModes.Custom) {
    if (!!customLogFn) {
      return customLogFn(new Date(), level.Prefix, content);
    } else {
      throw Error(Errors.customLogFn);
    }
  }
  // Print line or json
  if (format === Formats.Line) {
    content = setupLineFormat(content, timestamp, level);
  } else if (format === Formats.Json) {
    content = setupJsonFormat(content, timestamp, level);
  }
  // Print Console
  if (mode === LoggerModes.Console) {
    const colorFn = (colors as any)[level.Color];
    console.log(colorFn(content));
  // Print File
  } else if (mode === LoggerModes.File) {
    writeToFile(content + '\n', filepath)
        .catch((err) => console.log(err));
  // If reach this point, mode setting was bad
  } else {
    throw Error(Errors.Mode);
  }
}

/**
 * Setup line format.
 */
function setupLineFormat(
  content: string,
  timestamp: boolean,
  level: TLevelProp,
): string {
  // Format
  content = (level.Prefix + ': ' + content);
  if (timestamp) {
    const time = '[' + new Date().toISOString() + '] ';
    return (time + content);
  }
  // Return
  return content;
}

/**
 * Setup json format.
 */
function setupJsonFormat(
  content: string,
  timestamp: boolean,
  level: TLevelProp,
): string {
  // Format
  const json: IJsonFormat = {
    level: level.Prefix,
    message: content,
  };
  if (timestamp) {
    json.timestamp = new Date().toISOString();
  }
  // Return
  return JSON.stringify(json);
}

/**
 * Write logs a file instead of the console.
 */
function writeToFile(content: string, filePath: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.appendFile(filePath, content, (err => !!err ? rej(err) : res()));
  });
}


// **** Export default **** //

export default jetLogger();
