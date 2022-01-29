/**
 * Structure/function based 
 */

import util from 'util';
import colors from 'colors';
import fs from 'fs';



/*****************************************************************************************
 *                                     Constants
 ****************************************************************************************/

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
};

const errors = {
    customLoggerErr: 'Custom logger mode set to true, but no custom logger was provided.',
    modeErr: 'The correct logger mode was not specified: Must be "CUSTOM", "FILE", ' +
        '"OFF", or "CONSOLE".'
};

// If there are no manual or env settings
const defaults = {
    fileName: 'jet-logger.log',
    mode: LoggerModes.Console,
    timestamp: true,
    format: Formats.Line,
};

// Default is logger with no manual settings
export default JetLogger();



/*****************************************************************************************
 *                                     Types
 ****************************************************************************************/

type TLevelProp = typeof levels[keyof typeof levels];
type TJetLogger = ReturnType<typeof JetLogger>;
export type TCustomLogger = (timestamp: Date, prefix: string, content: any) => void;

interface IJsonFormat {
    timestamp?: string;
    level?: TLevelProp['prefix'];
    message?: string;
}



/*****************************************************************************************
 *                                     Functions
 ****************************************************************************************/

/**
 * Main function of Jet-Logger.
 * 
 * @param mode 
 * @param filePath 
 * @param timestamp 
 * @param format 
 * @param customLogger 
 * @returns 
 */
export function JetLogger (
    mode?: LoggerModes,
    filePath?: string,
    timestamp?: boolean,
    format?: Formats,
    customLogger?: TCustomLogger,
) {
    return {
        settings: getSettings(mode, filePath, timestamp, format, customLogger),
        info,
        imp,
        warn,
        err,
        printLog,
    } as const;
}


/**
 * Get settings manually if truthy or from the env variables.
 * 
 * @param mode 
 * @param filePath 
 * @param timestamp 
 * @param format 
 * @param customLogger 
 */
function getSettings(
    mode?: LoggerModes,
    filePath?: string,
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
    // FilePath
    if (!filePath) {
        if (!!process.env.JET_LOGGER_FILEPATH) {
            filePath = process.env.JET_LOGGER_FILEPATH;
        } else {
            filePath = defaults.fileName;
        }
    }
    // Timestamp
    if (!timestamp) {
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
    // Return
    return {
        mode,
        filePath,
        timestamp,
        format,
        customLogger,
    } as const;
}


/**
 * Print information.
 * 
 * @param this 
 * @param content 
 * @param printFull 
 * @returns 
 */
function info(this: TJetLogger, content: any, printFull?: boolean): void {
    return this.printLog(content, printFull ?? false, levels.info);
}


/**
 * Print important.
 * 
 * @param this 
 * @param content 
 * @param printFull 
 * @returns 
 */
function imp(this: TJetLogger, content: any, printFull?: boolean): void {
    return this.printLog(content, printFull ?? false, levels.imp);
}


/**
 * Print warning.
 * 
 * @param this 
 * @param content 
 * @param printFull 
 * @returns 
 */
function warn(this: TJetLogger, content: any, printFull?: boolean): void {
    return this.printLog(content, printFull ?? false, levels.warn);
}


/**
 * Print error.
 * 
 * @param this 
 * @param content 
 * @param printFull 
 * @returns 
 */
function err(this: TJetLogger, content: any, printFull?: boolean): void {
    return this.printLog(content, printFull ?? false, levels.err);
}


/**
 * Print the log using the provided settings.
 * 
 * @param content
 * @param printFull
 * @param level
 * @param mode
 * @param timestamp
 * @param filePath
 * @param customLogger
 */
function printLog(
    this: TJetLogger,
    content: any,
    printFull: boolean,
    level: TLevelProp,
): void {
    const { mode, format, timestamp, filePath, customLogger } = this.settings;
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
            content = time + content;
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
        writeToFile(content + '\n', filePath).catch((err) => {
            console.log(err);
        });
    // Print with Custom logger
    } else if (mode === LoggerModes.Custom) {
        if (!!customLogger) {
            customLogger(new Date(), level.prefix, content);
        } else {
            throw Error(errors.customLoggerErr);
        }
    } else {
        throw Error(errors.modeErr)
    }
}


/**
 * Write logs a file instead of the console.
 * 
 * @param content
 * @param filePath
 */
function writeToFile(content: string, filePath: string): Promise<void> {
    return new Promise((res, rej) => {
        return fs.appendFile(filePath, content, (err) => {
            return (!!err ? rej(err) : res());
        })
    });
}
