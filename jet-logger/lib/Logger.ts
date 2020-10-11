/**
 * Logging class for the Overnight project. Can print logs to the console
 * or to a file. If you want to print to a file you must specify the full
 * path. If you want to print to a file but no path is specified it will
 * print to /HOME_DIR/overnight.log
 *
 * created by Sean Maxwell Oct 10, 2020
 */

import colors from 'colors';
import fs from 'fs';
import util from 'util';



export const enum LoggerModes {
    Console = 'CONSOLE',
    File = 'FILE',
    Custom = 'CUSTOM',
    Off = 'OFF',
}


export const enum Formats {
    Line = 'LINE',
    Json = 'JSON',
}


interface IJsonFormat {
    timestamp?: string;
    level?: string;
    message?: string;
}


export interface ICustomLogger {
    sendLog(timestamp: Date, prefix: string, content: any): void;
}


// Note colors here need be a color from 
// the colors library above.
const Levels = {
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
}

type TLevelProp = typeof Levels[keyof typeof Levels];



export class Logger {

    public static readonly DEFAULT_LOG_FILE_NAME = 'jet-logger.log';
    public static readonly CUSTOM_LOGGER_ERR = 'Custom logger mode set to true, but no ' +
        'custom logger was provided.';

    private static _mode: LoggerModes = Logger.initMode();
    private static _filePath: string = Logger.initFilePath();
    private static _timestamp: boolean = Logger.initTimestamp();
    private static _format: Formats = Logger.initFormat();
    private static _customLogger: ICustomLogger | null = null;

    private _mode: LoggerModes;
    private _filePath: string;
    private _timestamp: boolean;
    private _format: Formats;
    private _customLogger: ICustomLogger | null;


    constructor(
        mode?: LoggerModes,
        filePath?: string,
        timestamp?: boolean,
        format?: Formats,
        customLogger?: ICustomLogger,
    ) {
        this._mode = mode || Logger.initMode();
        this._filePath = filePath || Logger.initFilePath();
        this._timestamp = (timestamp !== undefined ? timestamp : Logger.initTimestamp());
        this._format = format || Logger.initFormat();
        this._customLogger = customLogger || Logger.customLogger;
    }


    private static initMode(): LoggerModes {
        if (!!process.env.JET_LOGGER_MODE) {
            return process.env.JET_LOGGER_MODE.toLocaleUpperCase() as LoggerModes;
        } else {
            return LoggerModes.Console;
        }
    }


    private static initFilePath(): string {
        if (!!process.env.JET_LOGGER_FILEPATH) {
            return process.env.JET_LOGGER_FILEPATH;
        } else {
            return Logger.DEFAULT_LOG_FILE_NAME;
        }
    }


    private static initTimestamp(): boolean {
        if (!!process.env.JET_LOGGER_TIMESTAMP) {
            return (process.env.JET_LOGGER_TIMESTAMP.toLocaleUpperCase() === 'TRUE');
        } else {
            return true;
        }
    }


    private static initFormat(): Formats {
        if (!!process.env.JET_LOGGER_FORMAT) {
            return process.env.JET_LOGGER_FORMAT.toLocaleUpperCase() as Formats;
        } else {
            return Formats.Line;
        }
    }


    /********************************************************************************************
     *                                 Getters/Setters
     ********************************************************************************************/

    // Mode

    public static get mode(): LoggerModes {
        return Logger._mode;
    }

    public static set mode(mode: LoggerModes) {
        Logger._mode = mode;
    }

    public get mode(): LoggerModes {
        return this._mode;
    }

    public set mode(mode: LoggerModes) {
        this._mode = mode;
    }

    // File Path

    public static get filePath(): string {
        return Logger._filePath;
    }

    public static set filePath(filePath: string) {
        Logger._filePath = filePath;
    }

    public get filePath(): string {
        return this._filePath;
    }

    public set filePath(filePath: string) {
        this._filePath = filePath;
    }

    // Timestamp

    public static get timestamp(): boolean {
        return Logger._timestamp;
    }

    public static set timestamp(timestamp: boolean) {
        Logger._timestamp = timestamp;
    }

    public get timestamp(): boolean {
        return this._timestamp;
    }

    public set timestamp(timestamp: boolean) {
        this._timestamp = timestamp;
    }

    // Format

    public static get format(): Formats {
        return Logger._format;
    }

    public static set format(format: Formats) {
        Logger._format = format;
    }

    public get format(): Formats {
        return this._format;
    }

    public set format(format: Formats) {
        this._format = format;
    }

    // Custom Logger

    public static set customLogger(customLogger: ICustomLogger | null) {
        Logger._customLogger = customLogger;
    }

    public static get customLogger(): ICustomLogger | null {
        return Logger._customLogger;
    }

    public set customLogger(customLogger: ICustomLogger | null) {
        this._customLogger = customLogger;
    }

    public get customLogger(): ICustomLogger | null {
        return this._customLogger;
    }


    /********************************************************************************************
     *                                 Static Methods
     ********************************************************************************************/

    public static Info(content: any, printFull?: boolean) {
        Logger.PrintLogHelper(content, printFull || false, Levels.info);
    }


    public static Imp(content: any, printFull?: boolean) {
        Logger.PrintLogHelper(content, printFull || false, Levels.imp);
    }


    public static Warn(content: any, printFull?: boolean) {
        Logger.PrintLogHelper(content, printFull || false, Levels.warn);
    }


    public static Err(content: any, printFull?: boolean) {
        Logger.PrintLogHelper(content, printFull || false, Levels.err);
    }


    private static PrintLogHelper(content: any, printFull: boolean, level: TLevelProp): void {
        Logger.PrintLog(content, printFull, level, Logger.mode, Logger.timestamp, Logger.format,
            Logger.filePath, Logger.customLogger);
    }


    /********************************************************************************************
     *                                 Non-static Methods
     ********************************************************************************************/

    public info(content: any, printFull?: boolean): void {
        this.printLogHelper(content, printFull || false, Levels.info);
    }


    public imp(content: any, printFull?: boolean): void {
        this.printLogHelper(content, printFull || false, Levels.imp);
    }


    public warn(content: any, printFull?: boolean): void {
        this.printLogHelper(content, printFull || false, Levels.warn);
    }


    public err(content: any, printFull?: boolean): void {
        this.printLogHelper(content, printFull || false, Levels.err);
    }


    private printLogHelper(content: any, printFull: boolean, level: TLevelProp): void {
        Logger.PrintLog(content, printFull, level, this.mode, this.timestamp, this.format,
            this.filePath, this.customLogger);
    }


    /********************************************************************************************
     *                                   Helpers
     ********************************************************************************************/

    /**
     * Print the actual log using the provided settings.
     * 
     * @param content
     * @param printFull
     * @param level
     * @param mode
     * @param timestamp
     * @param filePath
     * @param customLogger
     */
    private static PrintLog(
        content: any,
        printFull: boolean,
        level: TLevelProp,
        mode: LoggerModes,
        timestamp: boolean,
        format: Formats,
        filePath: string,
        customLogger: ICustomLogger | null,
    ): void {
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
        // Setup line or JSON string
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
            Logger.WriteToFile(content + '\n', filePath);
        // Print with Custom logger
        } else if (mode === LoggerModes.Custom) {
            if (!!customLogger) {
                customLogger.sendLog(new Date(), level.prefix, content);
            } else {
                throw Error(Logger.CUSTOM_LOGGER_ERR);
            }
        } else {
            throw Error('The correct logger mode was not specified: Must be "CUSTOM", "FILE", ' +
                '"OFF", or "CONSOLE".')
        }
    }


    /**
     * Write logs a file instead of the console.
     * 
     * @param content
     * @param filePath
     */
    private static WriteToFile(content: string, filePath: string): void {
        try {
            const fileExists = Logger.CheckExists(filePath);
            if (fileExists) {
                fs.appendFileSync(filePath, content);
            } else {
                fs.writeFileSync(filePath, content);
            }
        } catch (err) {
            console.error(err);
        }
    }


    /**
     * Check if a file exists at the file path.
     * 
     * @param filePath
     */
    private static CheckExists(filePath: string): boolean {
        try {
            fs.accessSync(filePath);
            return true;
        } catch (e) {
            return false;
        }
    }
}
