/**
 * Demostrate custom logging with jet-logger.
 * 
 * created by Sean Maxwell, 10/10/2020
 */

import colors from 'colors';
import { ICustomLogger } from 'jet-logger';


class CustomLogger implements ICustomLogger {

    public sendLog(timestamp: Date, level: string, content: any): void {
        const logStr = timestamp.toISOString() + ' ' + level + ': ' + content;
        // eslint-disable-next-line no-console
        console.log(colors.america(logStr));
    }
}

export default CustomLogger;
