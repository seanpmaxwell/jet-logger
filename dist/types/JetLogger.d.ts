/******************************************************************************
                                   Variables
******************************************************************************/
export declare const LoggerModes: {
    readonly Console: "CONSOLE";
    readonly File: "FILE";
    readonly Custom: "CUSTOM";
    readonly Off: "OFF";
};
export declare const Formats: {
    readonly Line: "LINE";
    readonly Json: "JSON";
};
/******************************************************************************
                                  Types
******************************************************************************/
type TLoggerModes = (typeof LoggerModes)[keyof typeof LoggerModes];
type TFormats = (typeof Formats)[keyof typeof Formats];
export type TCustomLoggerFunction = (timestamp: Date, prefix: string, content: unknown) => void;
/******************************************************************************
                                Classes
******************************************************************************/
export declare class JetLogger {
    private mode;
    private filePath;
    private timestamp;
    private format;
    private customLogFn;
    /**
     * Constructor
     */
    constructor(mode?: TLoggerModes, filepath?: string, filepathDatetimeParam?: boolean, timestamp?: boolean, format?: TFormats, customLogFn?: TCustomLoggerFunction);
    /**
     * Prepend the filename in the file path with a timestamp.
     * i.e. '/home/jet-logger.log' => '/home/20220805T033709_jet-logger.log'
     */
    private addDatetimeToFileName;
    /**
     * Print information.
     */
    info(content: unknown, printFull?: boolean): void;
    /**
     * Print important information.
     */
    imp(content: unknown, printFull?: boolean): void;
    /**
     * Print important information.
     */
    warn(content: unknown, printFull?: boolean): void;
    /**
     * Print important information.
     */
    err(content: unknown, printFull?: boolean): void;
    /**
     * Print the log using the provided settings.
     */
    private printLog;
    /**
     * Setup line format.
     */
    private setupLineFormat;
    /**
     * Setup json format.
     */
    private setupJsonFormat;
    /**
     * Write to file.
     */
    private writeToFile;
}
/******************************************************************************
                                  Export
******************************************************************************/
declare const _default: JetLogger;
export default _default;
