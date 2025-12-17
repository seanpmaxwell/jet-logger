/* eslint-disable no-process-env */
import util from 'util';
import colors from 'colors';
import fs from 'fs';
/******************************************************************************
                                   Variables
******************************************************************************/
// Options for printing a log.
export const LoggerModes = {
    Console: 'CONSOLE',
    File: 'FILE',
    Custom: 'CUSTOM',
    Off: 'OFF',
};
// Log formats
export const Formats = {
    Line: 'LINE',
    Json: 'JSON',
};
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
};
// Errors
const Errors = {
    CustomLogFn: 'Custom logger mode set to true, but no custom logger was ' + 'provided.',
    Mode: 'The correct logger mode was not specified: Must be "CUSTOM", ' +
        '"FILE", "OFF", or "CONSOLE".',
};
/******************************************************************************
                                Classes
******************************************************************************/
export class JetLogger {
    mode = LoggerModes.Console;
    filePath = 'jet-logger.log';
    timestamp = true;
    format = Formats.Line;
    customLogFn = () => ({});
    /**
     * Constructor
     */
    constructor(mode, filepath, filepathDatetimeParam, timestamp, format, customLogFn) {
        // Setup the mode
        if (mode !== undefined) {
            this.mode = mode;
        }
        else if (!!process.env.JET_LOGGER_MODE) {
            this.mode = process.env.JET_LOGGER_MODE.toUpperCase();
        }
        // Filepath
        if (filepath !== undefined) {
            this.filePath = filepath;
        }
        else if (!!process.env.JET_LOGGER_FILEPATH) {
            this.filePath = process.env.JET_LOGGER_FILEPATH;
        }
        // FilePath dateTime
        let filePathDatetime = true;
        if (filepathDatetimeParam !== undefined) {
            filePathDatetime = filepathDatetimeParam;
        }
        else if (!!process.env.JET_LOGGER_FILEPATH_DATETIME) {
            const envVar = process.env.JET_LOGGER_FILEPATH_DATETIME;
            filePathDatetime = envVar.toUpperCase() === 'TRUE';
        }
        // Timestamp
        if (timestamp !== undefined) {
            this.timestamp = timestamp;
        }
        else if (!!process.env.JET_LOGGER_TIMESTAMP) {
            const envVar = process.env.JET_LOGGER_TIMESTAMP;
            this.timestamp = envVar.toUpperCase() === 'TRUE';
        }
        // Format
        if (format !== undefined) {
            this.format = format;
        }
        else if (!!process.env.JET_LOGGER_FORMAT) {
            this.format = process.env.JET_LOGGER_FORMAT.toUpperCase();
        }
        // Modify filepath if filepath datetime is true
        if (filePathDatetime) {
            this.filePath = this.addDatetimeToFileName(this.filePath);
        }
        // Custom Logger Function
        if (customLogFn !== undefined) {
            this.customLogFn = customLogFn;
        }
    }
    /**
     * Prepend the filename in the file path with a timestamp.
     * i.e. '/home/jet-logger.log' => '/home/20220805T033709_jet-logger.log'
     */
    addDatetimeToFileName(filePath) {
        // Get the date string
        const dateStr = new Date()
            .toISOString()
            .split('-')
            .join('')
            .split(':')
            .join('')
            .slice(0, 15);
        // Setup new file name
        const filePathArr = filePath.split('/'), lastIdx = filePathArr.length - 1, fileName = filePathArr[lastIdx], fileNameNew = dateStr + '_' + fileName;
        // Setup new file path
        filePathArr[lastIdx] = fileNameNew;
        return filePathArr.join('/');
    }
    /**
     * Print information.
     */
    info(content, printFull) {
        this.printLog(content, !!printFull, Levels.Info);
    }
    /**
     * Print important information.
     */
    imp(content, printFull) {
        this.printLog(content, !!printFull, Levels.Important);
    }
    /**
     * Print important information.
     */
    warn(content, printFull) {
        this.printLog(content, !!printFull, Levels.Warning);
    }
    /**
     * Print important information.
     */
    err(content, printFull) {
        this.printLog(content, !!printFull, Levels.Error);
    }
    /**
     * Print the log using the provided settings.
     */
    printLog(contentParam, printFull, level) {
        // Do nothing if turned off
        if (this.mode === LoggerModes.Off) {
            return;
        }
        // Print full
        let content;
        if (printFull) {
            content = util.inspect(contentParam);
        }
        else {
            content = String(contentParam);
        }
        // Fire the custom logger if that's the option
        if (this.mode === LoggerModes.Custom) {
            if (!!this.customLogFn) {
                return this.customLogFn(new Date(), level.Prefix, content);
            }
            else {
                throw Error(Errors.CustomLogFn);
            }
        }
        // Print line or json
        if (this.format === Formats.Line) {
            content = this.setupLineFormat(content, level);
        }
        else if (this.format === Formats.Json) {
            content = this.setupJsonFormat(content, level);
        }
        // Print Console
        if (this.mode === LoggerModes.Console) {
            const colorFn = colors[level.Color];
            // eslint-disable-next-line no-console
            console.log(colorFn(content));
            // Print File
        }
        else if (this.mode === LoggerModes.File) {
            this.writeToFile(content + '\n');
            // If reach this point, mode setting was bad
        }
        else {
            throw Error(Errors.Mode);
        }
    }
    /**
     * Setup line format.
     */
    setupLineFormat(content, level) {
        // Format
        content = level.Prefix + ': ' + content;
        if (this.timestamp) {
            const time = '[' + new Date().toISOString() + '] ';
            return time + content;
        }
        // Return
        return content;
    }
    /**
     * Setup json format.
     */
    setupJsonFormat(content, level) {
        // Format
        const json = {
            level: level.Prefix,
            message: content,
        };
        if (this.timestamp) {
            json.timestamp = new Date().toISOString();
        }
        // Return
        return JSON.stringify(json);
    }
    /**
     * Write to file.
     */
    writeToFile(content) {
        fs.appendFile(this.filePath, content, (err) => {
            if (!!err) {
                // eslint-disable-next-line no-console
                console.error(err);
            }
        });
    }
}
/******************************************************************************
                                  Export
******************************************************************************/
export default new JetLogger();
