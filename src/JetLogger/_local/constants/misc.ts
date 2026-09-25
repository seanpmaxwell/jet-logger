import { IOptions } from '@src/JetLogger/_local/types';

import { Formats, Modes } from '../enums';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

export const DEFAULT_LOG_FILE_NAME = 'jet-logger.log';

// ======================== Value-factory-functions ======================== //

export const DefaultOptions = (): IOptions => ({
  mode: Modes.CONSOLE,
  format: Formats.LINE,
  filepath: DEFAULT_LOG_FILE_NAME,
  prependTimeToFilename: false,
  showTime: true,
  customTransport: null,
});
