import chalk from 'chalk';

import deleteLogFiles from '../dev-tools/deleteLogFiles';
import onInit from '../dev-tools/onInit';
import shell from '../dev-tools/shell';
import logger, {
  CustomTransportContext,
  CustomTransportFn,
  JetLogger,
} from '../src';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //
await deleteLogFiles();
await deleteLogFiles('./playground');

// ---- Test out logger instance, console
await onInit(() => {
  logger.info('hello jet-logger');
  logger.imp('hello jet-logger');
  logger.warn('hello jet-logger');
  logger.err('hello jet-logger');
  logger.err(new Error('Demo print full error object'));
}, 'basic__console');

// ---- Test out logger instance, file
await onInit.skip(() => {
  const logm = JetLogger({ mode: JetLogger.Modes.FILE });
  logm.info('hello jet-logger');
  logm.imp('hello jet-logger');
  logm.warn('hello jet-logger');
  logm.err('hello jet-logger');
}, 'basic__file');

// ---- Test out logger instance, off
await onInit.skip(() => {
  process.env.JET_LOGGER_MODE = JetLogger.Modes.OFF;
  const logm = JetLogger();
  logm.info("This line shouldn't print \n");
}, 'off__console');

// ---- Test `customTransport`
await onInit.skip(() => {
  // Initialize `customTransport` function
  const sendLog: CustomTransportFn = (context: CustomTransportContext) => {
    const { time, level, msg } = context;
    let logStr = time + ' ' + level + ': ' + msg;
    if (context.level === 'ERROR') {
      logStr = chalk.rgb(123, 45, 67).underline(logStr);
    }
    // eslint-disable-next-line no-console
    console.log(logStr);
  };

  // Initialize the logger fn
  const logm = JetLogger({
    mode: JetLogger.Modes.CUSTOM,
    customTransport: sendLog,
  });

  // Print logs
  logm.info('hello jet-logger');
  logm.imp('hello jet-logger');
  logm.warn('hello jet-logger');
  logm.err('hello jet-logger \n');
}, 'custom-transport');

// ---- Alternate File Name
await onInit.skip(() => {
  const logm = JetLogger({
    mode: JetLogger.Modes.FILE,
    filepath: 'jet-logger-alternate-something.log',
    showTime: false,
    prependTimeToFilename: false,
  });
  logm.info('hello jet-logger');
  logm.imp('hello jet-logger');
  logm.warn('hello jet-logger');
  logm.err('hello jet-logger');
  logm.err(new Error('Demo print full error object'));
}, 'changing-the-filename');

// ---- Test environment variables + file mode
await onInit.skip(() => {
  process.env.JET_LOGGER_MODE = JetLogger.Modes.FILE;
  process.env.JET_LOGGER_FILEPATH = 'jet-logger-alt2.log';
  process.env.JET_LOGGER_SHOW_TIME = 'true';
  const logm = JetLogger();
  logm.info('hello jet-logger');
  logm.imp('hello jet-logger');
  logm.warn('hello jet-logger');
  logm.err('hello jet-logger');
  logm.err(new Error('Demo print full error object'));
}, 'environment-variables');

// ---- Test `file output` + `json format`
await onInit.skip(() => {
  process.chdir('./playground');
  const logm = JetLogger({
    format: JetLogger.Formats.JSON,
    mode: JetLogger.Modes.FILE,
  });
  logm.info('hello jet-logger');
  logm.imp('hello jet-logger');
  logm.warn('hello jet-logger');
  logm.err('hello jet-logger');
  logm.err(new Error('Demo print full error object'));
  process.chdir('../');
}, 'json__file');

// ---- Test `file output` + `json format` + `custom file name`
await onInit(() => {
  process.env.JET_LOGGER_MODE = JetLogger.Modes.FILE;
  process.env.JET_LOGGER_FILEPATH = './playground/jet-logger-json.jsonl';
  process.env.JET_LOGGER_SHOW_TIME = 'true';
  process.env.JET_LOGGER_FORMAT = JetLogger.Formats.JSON;
  const logm = JetLogger();
  logm.info('hello jet-logger');
  logm.imp('hello jet-logger');
  logm.warn('hello jet-logger');
  logm.err('hello jet-logger');
  logm.err(new Error('Demo print full error object'));
}, 'json__file');

// ---- Test `console output` + `json format`
await onInit(() => {
  const logm = JetLogger({ format: JetLogger.Formats.JSON });
  logm.info('hello jet-logger');
  logm.imp('hello jet-logger');
  logm.warn('hello jet-logger');
  logm.err('hello jet-logger');
  logm.err(new Error('Demo print full error object'));
}, 'json__console');

// ---- Prettify the `.jsonl` files
await shell('bash', ['dev-tools/formatJsonl.sh']);

// Debug env OFF issue
// process.env.JET_LOGGER_MODE = 'OFF';
// const logger5 = JetLogger();
// logger5.err('string');
