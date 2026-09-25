import schema from '@cmn/utils/modules/schema';

import { Formats, Modes } from '../enums';
import { IOptions } from '../types';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type EnvCtx = Partial<Omit<IOptions, 'customTransport'>>;

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Options coming in from `process.env`. Browsers and web workers don't have
 * `process`, so there are no options there.
 */
function loadEnvOptions(): EnvCtx {
  const env = globalThis.process?.env;
  if (!env) return {};
  const {
    JET_LOGGER_MODE,
    JET_LOGGER_FILEPATH,
    JET_LOGGER_PREPEND_TIME_TO_FILENAME,
    JET_LOGGER_SHOW_TIME,
    JET_LOGGER_FORMAT,
  } = env;

  // ---- Check/parse values and validate accordingly
  const retVal: EnvCtx = {};
  // Mode
  const mode = JET_LOGGER_MODE?.toLowerCase();
  if (Modes.is(mode)) retVal.mode = mode;
  // Filepath
  if (schema.is.neStr(JET_LOGGER_FILEPATH))
    retVal.filepath = JET_LOGGER_FILEPATH;
  // Prepend time to filename
  const pefn = schema.parse.bool(JET_LOGGER_PREPEND_TIME_TO_FILENAME);
  if (schema.is.def(pefn)) retVal.prependTimeToFilename = pefn;
  // Show time
  const showTs = schema.parse.bool(JET_LOGGER_SHOW_TIME);
  if (schema.is.def(showTs)) retVal.showTime = showTs;
  // Format
  const format = JET_LOGGER_FORMAT?.toLowerCase();
  if (Formats.is(format)) retVal.format = format;

  // ---- Return
  return retVal;
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default loadEnvOptions;
