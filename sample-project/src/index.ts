/**
 * Sample project to test out jet-logger.
 * 
 * created by Sean Maxwell, 10/10/2020
 */

import { Logger, LoggerModes } from 'jet-logger';
import CustomLogger from './CustomLogger';


const logger = new Logger();


// Test out logger instance, console
logger.info('hello jet-logger');
logger.imp('hello jet-logger');
logger.warn('hello jet-logger');
logger.err('hello jet-logger \n');

// Test out logger instance, console
logger.mode = LoggerModes.File;
logger.info('hello jet-logger');
logger.imp('hello jet-logger');
logger.warn('hello jet-logger');
logger.err('hello jet-logger \n');

// Test out logger instance, console
logger.mode = LoggerModes.Off;
logger.info('This line shouldn\'t print \n');

// Test custom logging
logger.customLogger = new CustomLogger();
logger.mode = LoggerModes.Custom;
logger.timestamp = false;
logger.info('hello jet-logger');
logger.imp('hello jet-logger');
logger.warn('hello jet-logger');
logger.err('hello jet-logger \n');
