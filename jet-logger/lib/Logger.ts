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


export interface ICustomLogger {
    sendLog(timestamp: Date, prefix: string, content: any): void;
}



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
    private static _customLogger: ICustomLogger | null = null;

    private _mode: LoggerModes;
    private _filePath: string;
    private _timestamp: boolean;
    private _customLogger: ICustomLogger | null;


    constructor(
        mode?: LoggerModes,
        filePath?: string,
        timestamp?: boolean,
        customLogger?: ICustomLogger,
    ) {
        this._mode = mode || Logger.mode;
        this._filePath = filePath || Logger.filePath;
        this._timestamp = (timestamp !== undefined ? timestamp : Logger.timestamp);
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
        Logger.PrintLog(content, printFull, level, Logger.mode, Logger.timestamp,
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
        Logger.PrintLog(content, printFull, level, this.mode, this.timestamp, this.filePath,
            this.customLogger);
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
        filePath: string,
        customLogger: ICustomLogger | null,
    ): void {
        // Do nothing if turned off
        if (mode === LoggerModes.Off) {
            return;
        }
        // Print full
        if (printFull) {
            content = util.inspect(content);
        }
        // Append prefix
        if (mode !== LoggerModes.Custom) {
            content = level.prefix + ': ' + content;
        }
        // Prepend timestamp
        if (timestamp) {
            const time = '[' + new Date().toISOString() + '] ';
            content = time + content;
        }
        // Print Console
        if (mode === LoggerModes.Console) {
            content = (colors as any)[level.color](content);
            // tslint:disable-next-line
            console.log(content);
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
            // tslint:disable-next-line
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
