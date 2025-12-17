/* eslint-disable no-process-env */
import colors from 'colors';

import logger, {
  JetLogger,
  LoggerModes,
  Formats,
  type TCustomLoggerFunction,
} from '../src';

// Test out logger instance, console
logger.info('hello jet-logger');
logger.imp('hello jet-logger');
logger.warn('hello jet-logger');
logger.err('hello jet-logger');
logger.err(new Error('Demo print full error object'), true);
// eslint-disable-next-line no-console
console.log('\n');

// Test out logger instance, file
const loggerFile = new JetLogger(LoggerModes.File);
loggerFile.info('hello jet-logger');
loggerFile.imp('hello jet-logger');
loggerFile.warn('hello jet-logger');
loggerFile.err('hello jet-logger \n');

// Test out logger instance, off
process.env.JET_LOGGER_MODE = LoggerModes.Off;
logger.info("This line shouldn't print \n");

// Test custom logging
const sendLog: TCustomLoggerFunction = (
  timestamp: Date,
  level: string,
  content: unknown,
) => {
  const logStr = timestamp.toISOString() + ' ' + level + ': ' + content;
  // eslint-disable-next-line no-console
  console.log(colors.america(logStr));
};

const logger1 = new JetLogger(
  LoggerModes.Custom,
  'jet-logger-alt2.log',
  true,
  true,
  undefined,
  sendLog,
);
logger1.info('hello jet-logger');
logger1.imp('hello jet-logger');
logger1.warn('hello jet-logger');
logger1.err('hello jet-logger \n');

/* Alternate File Name */
const logger2 = new JetLogger(
  LoggerModes.File,
  'jet-logger-alt.log',
  false,
  false,
);
logger2.info('hello jet-logger');
logger2.imp('hello jet-logger');
logger2.warn('hello jet-logger');
logger2.err('hello jet-logger');
logger2.err(new Error('Demo print full error object'), true);

/* Test env variables */
process.env.JET_LOGGER_MODE = LoggerModes.File;
process.env.JET_LOGGER_FILEPATH = 'jet-logger-alt2.log';
process.env.JET_LOGGER_TIMESTAMP = 'true';
const logger3 = new JetLogger();
logger3.info('hello jet-logger');
logger3.imp('hello jet-logger');
logger3.warn('hello jet-logger');
logger3.err('hello jet-logger');
logger3.err(new Error('Demo print full error object'), true);

/* Test json format */
process.env.JET_LOGGER_MODE = LoggerModes.File;
process.env.JET_LOGGER_FILEPATH = 'jet-logger-json.log';
process.env.JET_LOGGER_TIMESTAMP = 'true';
process.env.JET_LOGGER_FORMAT = Formats.Json;
const logger4 = new JetLogger();
logger4.info('hello jet-logger');
logger4.imp('hello jet-logger');
logger4.warn('hello jet-logger');
logger4.err('hello jet-logger');
logger4.err(new Error('Demo print full error object'), true);

/* Debug env OFF issue */
process.env.JET_LOGGER_MODE = 'OFF';
const logger5 = new JetLogger();
logger5.err('string');
