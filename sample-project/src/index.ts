/**
 * Sample project to test out jet-logger.
 * 
 * created by Sean Maxwell, 10/10/2020
 */

import Logger, { Formats, LoggerModes } from 'jet-logger';
import CustomLogger from './CustomLogger';



/* Dynamic Values */

const logger = new Logger();


// Test out logger instance, console
logger.info('hello jet-logger');
logger.imp('hello jet-logger');
logger.warn('hello jet-logger');
logger.err('hello jet-logger');
logger.err(new Error('Demo print full error object'), true)
// eslint-disable-next-line no-console
console.log('\n')

// Test out logger instance, file
logger.mode = LoggerModes.File;
logger.info('hello jet-logger');
logger.imp('hello jet-logger');
logger.warn('hello jet-logger');
logger.err('hello jet-logger \n');

// Test out logger instance, off
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

// Test out static logger, console
Logger.Info('hello jet-logger');
Logger.Imp('hello jet-logger');
Logger.Warn('hello jet-logger');
Logger.Err('hello jet-logger \n');

// Test out static logger, file
Logger.mode = LoggerModes.File;
Logger.Info('hello jet-logger');
Logger.Imp('hello jet-logger');
Logger.Warn('hello jet-logger');
Logger.Err('hello jet-logger \n');

// Test out static logger, off
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
const logger2 = new Logger(LoggerModes.File, 'jet-logger-alt.log', false);
logger2.info('hello jet-logger');
logger2.imp('hello jet-logger');
logger2.warn('hello jet-logger');
logger2.err('hello jet-logger');
logger2.err(new Error('Demo print full error object'), true)


/* Test env variables */
process.env.JET_LOGGER_MODE = LoggerModes.File;
process.env.JET_LOGGER_FILEPATH = 'jet-logger-alt2.log';
process.env.JET_LOGGER_TIMESTAMP = 'true';
const logger3 = new Logger();
logger3.info('hello jet-logger');
logger3.imp('hello jet-logger');
logger3.warn('hello jet-logger');
logger3.err('hello jet-logger');
logger3.err(new Error('Demo print full error object'), true)


/* Test json format */
process.env.JET_LOGGER_MODE = LoggerModes.File;
process.env.JET_LOGGER_FILEPATH = 'jet-logger-json.log';
process.env.JET_LOGGER_TIMESTAMP = 'true';
process.env.JET_LOGGER_FORMAT = Formats.Json;
const logger4 = new Logger();
logger4.info('hello jet-logger');
logger4.imp('hello jet-logger');
logger4.warn('hello jet-logger');
logger4.err('hello jet-logger');
logger4.err(new Error('Demo print full error object'), true)


/* Debug env OFF issue */
process.env.JET_LOGGER_MODE = 'OFF';
const logger5 = new Logger();
logger5.err('string');
