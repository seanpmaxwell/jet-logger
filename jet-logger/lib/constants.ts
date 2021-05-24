export interface ICustomLogger {
    sendLog(timestamp: Date, prefix: string, content: any): void;
}


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
