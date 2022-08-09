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
const levels = {
    info: {
        color: 'green',
        prefix: 'INFO',
    },
    imp: {
        color: 'magenta',
        prefix: 'IMPORTANT',
    },
    warn: {
        color: 'yellow',
        prefix: 'WARNING',
    },
    err: {
        color: 'red',
        prefix: 'ERROR',
    }
} as const;

// Errors
const errors = {
    customLoggerErr: 'Custom logger mode set to true, but no custom logger was provided.',
    modeErr: 'The correct logger mode was not specified: Must be "CUSTOM", "FILE", ' +
        '"OFF", or "CONSOLE".'
} as const;

// If there are no manual or env settings
const defaults = {
    filepath: 'jet-logger.log',
    mode: LoggerModes.Console,
    timestamp: true,
    filepathDatetime: true,
    format: Formats.Line,
} as const;


// **** Types **** //

type TLevelProp = typeof levels[keyof typeof levels];
type TJetLogger = ReturnType<typeof JetLogger>;
type TSettings = ReturnType<typeof getSettings>;
export type TCustomLogger = (timestamp: Date, prefix: string, content: any) => void;

interface IJsonFormat {
    timestamp?: string;
    level?: TLevelProp['prefix'];
    message?: string;
}


// **** Functions **** //

/**
 * Main function of Jet-Logger.
 * 
 * @param mode 
 * @param filepath 
 * @param timestamp
 * @param filepathDatetime
 * @param format 
 * @param customLogger 
 * @returns 
 */
export function JetLogger (
    mode?: LoggerModes,
    filepath?: string,
    filepathDatetime?: boolean,
    timestamp?: boolean,
    format?: Formats,
    customLogger?: TCustomLogger,
) {
    const settings = getSettings(mode, filepath, timestamp, filepathDatetime, format,
        customLogger);
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
    customLogger?: TCustomLogger,
) {
    // Setup the mode
    if (!mode) {
        if (!!process.env.JET_LOGGER_MODE) {
            mode = process.env.JET_LOGGER_MODE.toUpperCase() as LoggerModes;
        } else {
            mode = defaults.mode;
        }
    }
    // Filepath
    if (!filepath) {
        if (!!process.env.JET_LOGGER_FILEPATH) {
            filepath = process.env.JET_LOGGER_FILEPATH;
        } else {
            filepath = defaults.filepath;
        }
    }
    // FilePath dateTime
    if (filepathDatetime === undefined || filepathDatetime === null) {
        const envVar = process.env.JET_LOGGER_FILEPATH_DATETIME;
        if (!!envVar) {
            filepathDatetime = (envVar.toUpperCase() === 'TRUE');
        } else {
            filepathDatetime = defaults.filepathDatetime;
        }
    }
    // Timestamp
    if (timestamp === undefined || timestamp === null) {
        if (!!process.env.JET_LOGGER_TIMESTAMP) {
            timestamp = (process.env.JET_LOGGER_TIMESTAMP.toUpperCase() === 'TRUE');
        } else {
            timestamp = defaults.timestamp;
        }
    }
    // Format
    if (!format) {
        if (!!process.env.JET_LOGGER_FORMAT) {
            format = process.env.JET_LOGGER_FORMAT.toUpperCase() as Formats;
        } else {
            format = defaults.format;
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
        customLogger,
    } as const;
}

/**
 * Print information.
 * 
 * @param this the jet-logger instance.
 * @param content the content to be printed.
 * @param printFull print full object (use util.inspect())
 * @returns 
 */
function info(this: TJetLogger, content: any, printFull?: boolean): void {
    return printLog(content, printFull ?? false, levels.info, this.settings);
}

/**
 * Print important.
 * 
 * @param this the jet-logger instance.
 * @param content the content to be printed.
 * @param printFull print full object (use util.inspect())
 * @returns 
 */
function imp(this: TJetLogger, content: any, printFull?: boolean): void {
    return printLog(content, printFull ?? false, levels.imp, this.settings);
}

/**
 * Print warning.
 * 
 * @param this the jet-logger instance.
 * @param content the content to be printed.
 * @param printFull print full object (use util.inspect())
 * @returns 
 */
function warn(this: TJetLogger, content: any, printFull?: boolean): void {
    return printLog(content, printFull ?? false, levels.warn, this.settings);
}

/**
 * Print error.
 * 
 * @param this the jet-logger instance.
 * @param content the content to be printed.
 * @param printFull print full object (use util.inspect())
 * @returns 
 */
function err(this: TJetLogger, content: any, printFull?: boolean): void {
    return printLog(content, printFull ?? false, levels.err, this.settings);
}

/**
 * Print the log using the provided settings.
 */
function printLog(
    content: any,
    printFull: boolean,
    level: TLevelProp,
    settings: TSettings,
): void {
    // Settings
    const {
        mode,
        format,
        timestamp,
        filepath,
        customLogger,
    } = settings;
    // Do nothing if turned off
    if (mode === LoggerModes.Off) {
        return;
    }
    // Init Json Object
    const jsonContent: IJsonFormat = {}
    // Print full
    if (printFull) {
        content = util.inspect(content);
    }
    // Setup JSON string
    if (format === Formats.Json) {
        jsonContent.message = content;
    }
    // Append prefix
    if (mode !== LoggerModes.Custom) {
        if (format === Formats.Line) {
            content = level.prefix + ': ' + content;
        } else if (format === Formats.Json) {
            jsonContent.level = level.prefix;
        }
    }
    // Prepend timestamp
    if (timestamp) {
        if (format === Formats.Line) {
            const time = '[' + new Date().toISOString() + '] ';
            content = (time + content);
        } else if (format === Formats.Json) {
            jsonContent.timestamp = new Date().toISOString();
        }
    }
    // Set content to json object if that's the format
    if (format === Formats.Json) {
        content = JSON.stringify(jsonContent);
    }
    // Print Console
    if (mode === LoggerModes.Console) {
        const colorFn = (colors as any)[level.color];
        console.log(colorFn(content));
    // Print File
    } else if (mode === LoggerModes.File) {
        writeToFile(content + '\n', filepath)
            .catch((err) => console.log(err));
    // Print with Custom logger
    } else if (mode === LoggerModes.Custom) {
        if (!!customLogger) {
            customLogger(new Date(), level.prefix, content);
        } else {
            throw Error(errors.customLoggerErr);
        }
    } else {
        throw Error(errors.modeErr);
    }
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
 * Write logs a file instead of the console.
 */
function writeToFile(content: string, filePath: string): Promise<void> {
    return new Promise((res, rej) => {
        const fn = ((err: NodeJS.ErrnoException | null) => !!err ? rej(err) : res());
        return fs.appendFile(filePath, content, fn);
    });
}


// **** Export default **** //

// Default is logger with no manual settings
export default JetLogger();
