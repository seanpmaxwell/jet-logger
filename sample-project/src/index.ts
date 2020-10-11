/**
 * Sample project to test out jet-logger.
 * 
 * created by Sean Maxwell, 10/10/2020
 */

import { Logger, LoggerModes } from 'jet-logger';
import CustomLogger from './CustomLogger';



/* Dynamic Values */

const logger = new Logger();

// Test out logger instance, console
logger.info('hello jet-logger');
logger.imp('hello jet-logger');
logger.warn('hello jet-logger');
logger.err('hello jet-logger');
logger.err(new Error('Demo print full error object'), true)
console.log('\n');

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



/* Static values */

// Test out logger instance, console
Logger.Info('hello jet-logger');
Logger.Imp('hello jet-logger');
Logger.Warn('hello jet-logger');
Logger.Err('hello jet-logger \n');

// Test out logger instance, console
Logger.mode = LoggerModes.File;
Logger.Info('hello jet-logger');
Logger.Imp('hello jet-logger');
Logger.Warn('hello jet-logger');
Logger.Err('hello jet-logger \n');

// Test out logger instance, console
Logger.mode = LoggerModes.Off;
Logger.Info('This line shouldn\'t print \n');

// Test custom logging
Logger.customLogger = new CustomLogger();
Logger.mode = LoggerModes.Custom;
Logger.timestamp = false;
Logger.Info('hello jet-logger');
Logger.Imp('hello jet-logger');
Logger.Warn('hello jet-logger');
Logger.Err('hello jet-logger \n');



/* Alternate File Name */

// Empty constructor
const logger2 = new Logger(LoggerModes.File, 'jet-logger-alt.log', false);
logger2.info('hello jet-logger');
logger2.imp('hello jet-logger');
logger2.warn('hello jet-logger');
logger2.err('hello jet-logger');
logger2.err(new Error('Demo print full error object'), true)
