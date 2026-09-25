import InvalidOptionErr from '@cmn/classes/InvalidOptionErr';
import schema from '@cmn/utils/modules/schema';

import { DefaultOptions } from '../constants/misc';
import { Formats, Modes } from '../enums';
import { IOptions } from '../types';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const CUSTOM_TRANSPORT_ERROR_MESSAGE =
  'The mode is set to "custom". The "customTransport" must be a valid function type.';

const OPTION_KEYS = Object.keys(DefaultOptions());
const OPTION_KEYS_SET = new Set(OPTION_KEYS);

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Validate that `options` is a valid `IOptions` object. Throws an
 * `InvalidOptionError` naming the first invalid property and its value.
 */
function validateOptions(options: unknown): asserts options is IOptions {
  // ---- Check option arg type
  if (typeof options !== 'object' || options === null) {
    throw InvalidOptionErr.of('options', options);
  }

  // ---- Unknown properties
  for (const [key, value] of Object.entries(options)) {
    if (OPTION_KEYS_SET.has(key)) continue;
    throw InvalidOptionErr.of(key, value, 'Unknown option');
  }

  // ---- Extra properties
  const {
    mode,
    format,
    showTime,
    prependTimeToFilename,
    filepath,
    customTransport,
  } = options as Record<keyof IOptions, unknown>;

  // ---- Run basic validation
  if (!Modes.is(mode)) {
    throw InvalidOptionErr.of('mode', mode);
  }
  if (!Formats.is(format)) {
    throw InvalidOptionErr.of('format', format);
  }
  if (!schema.is.bool(showTime)) {
    throw InvalidOptionErr.of('showTime', showTime);
  }
  if (!schema.is.bool(prependTimeToFilename)) {
    throw InvalidOptionErr.of('prependTimeToFilename', prependTimeToFilename);
  }
  if (!schema.is.neStr(filepath)) {
    throw InvalidOptionErr.of('filepath', filepath);
  }

  // ---- `CustomTransport` stuff
  if (!schema.is.nul.fn(customTransport)) {
    throw InvalidOptionErr.of('customTransport', customTransport);
  }
  if (mode === Modes.CUSTOM && !schema.is.fn(customTransport)) {
    throw InvalidOptionErr.of(
      'customTransport',
      customTransport,
      CUSTOM_TRANSPORT_ERROR_MESSAGE,
    );
  }
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default validateOptions;
