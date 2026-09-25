import { getErrMsg } from '@src/_common/utils/fns/error-utils';

import safeCall from '@cmn/utils/fns/safeCall';
import unknownArrToStr from '@cmn/utils/fns/unknownArrToStr';
import ProcessHost from '@cmn/utils/modules/ProcessHost';

import BrowserWriter from './_internal/BrowserWriter';
import ConsoleWriter from './_internal/ConsoleWriter';
import FileWriter from './_internal/FileWriter';
import { reportInternalError } from './_internal/utils/fns';
import { LogWriter } from './_internal/utils/types';
import { Level, Levels } from './_local/constants/levels';
import { DefaultOptions } from './_local/constants/misc';
import { Modes } from './_local/enums';
import loadEnvOptions from './_local/fns/loadEnvOptions';
import validateOptions from './_local/fns/validateOptions';
import type {
  APIOptions,
  CustomTransportContext,
  CustomTransportFn,
  IOptions,
  Labels,
} from './_local/types';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

export type JetLoggerOptions = APIOptions;

export type JetLoggerInstance = Readonly<{
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  err(...args: unknown[]): void;
  imp(...args: unknown[]): void;
  line(): void;
  out(...args: unknown[]): void;
  catch(cb: () => unknown): void;
  flush(): Promise<void>;
  close(): Promise<void>;
}>;

type Pending = Set<PromiseLike<unknown>>;

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Factory-Function:
 *
 * Core FF where all instances come from. Options are set once at initalization
 * time.
 */
function JetLogger(options?: JetLoggerOptions): JetLoggerInstance {
  // Initialize/validate Options. Options passed as `undefined` fall back to
  // the environment and the defaults.
  const optionsFin = {
    ...DefaultOptions(),
    ...loadEnvOptions(),
    ...withoutUndefined(options),
  };
  validateOptions(optionsFin);
  // Set instances based on the mode.
  if (optionsFin.mode === Modes.OFF) {
    return getOffModeInstance();
  } else if (optionsFin.mode === Modes.CUSTOM) {
    return setupCustomTransportInstance(optionsFin.customTransport);
  }
  return setupStandardInstance(optionsFin);
}

/**
 * Get a `JetLoggerInstance` which uses one of the 3 main writers:
 * `{File,Console,Browser}Writer`
 *
 * Used by: {@link JetLogger}
 *
 * @private
 */
function setupStandardInstance(options: IOptions): JetLoggerInstance {
  const writer = getWriter(options);
  const pending: Pending = new Set();
  let isClosed = false;
  let closing: Promise<void> | undefined;
  const log = (level: Level, args: unknown[]) => {
    if (!isClosed) writer.writeLog({ level, args });
  };

  // ---- Return
  return {
    info: (...args: unknown[]) => log(Levels.Info, args),
    warn: (...args: unknown[]) => log(Levels.Warning, args),
    imp: (...args: unknown[]) => log(Levels.Important, args),
    err: (...args: unknown[]) => log(Levels.Error, args),
    line: () => {
      if (!isClosed) writer.writeRaw([]);
    },
    out: (...args: unknown[]) => {
      if (!isClosed) writer.writeRaw(args);
    },
    catch: (cb: () => unknown) => {
      const logError = (err: unknown) => log(Levels.Error, [getErrMsg(err)]);
      safeCall(cb, logError, pending);
    },
    flush: async () => {
      await settle(pending);
      await writer.flush();
    },
    close: () =>
      (closing ??= (async () => {
        await settle(pending);
        isClosed = true;
        await writer.close();
      })()),
  };
}

/**
 * Without Node's modules (browsers, web workers), everything goes to the
 * `console` methods.
 *
 * Used by: {@link setupStandardInstance}
 *
 * @private
 */
function getWriter(options: IOptions): LogWriter {
  if (ProcessHost.IS_BROWSER || options.mode === Modes.BROWSER) {
    return BrowserWriter.of(options);
  }
  if (options.mode === Modes.FILE) {
    return FileWriter.of(options);
  }
  return ConsoleWriter.of(options);
}

/**
 * Disable printing. `catch()` still runs its callback, keeping any error
 * quiet.
 *
 * Used by: {@link JetLogger}
 *
 * @private
 */
function getOffModeInstance(): JetLoggerInstance {
  const noop = () => undefined;
  return {
    info: noop,
    warn: noop,
    imp: noop,
    err: noop,
    line: noop,
    out: noop,
    catch: (cb: () => unknown) => safeCall(cb, noop),
    flush: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
}

/**
 * Instead of printing, send a context object to the custom transport set
 * by the user. Errors thrown by the transport, or rejections of a promise it
 * returns, are reported on stderr instead of crashing the app.
 *
 * Used by: {@link JetLogger}
 *
 * @private
 */
function setupCustomTransportInstance(
  customTransport: CustomTransportFn,
): JetLoggerInstance {
  const pending: Pending = new Set();
  let isClosed = false;
  let closing: Promise<void> | undefined;

  // ---- Initialize a function which sends the context object.
  const send = (level: Labels | null, args: unknown[]) => {
    if (isClosed) return;
    const context: CustomTransportContext = {
      time: new Date().toISOString(),
      level,
      msg: unknownArrToStr(args, false),
    };
    const onError = (err: unknown) =>
      reportInternalError('customTransport failed', err);
    safeCall(() => customTransport(context), onError, pending);
  };

  // ---- Return
  return {
    info: (...args: unknown[]) => send('INFO', args),
    warn: (...args: unknown[]) => send('WARNING', args),
    imp: (...args: unknown[]) => send('IMPORTANT', args),
    err: (...args: unknown[]) => send('ERROR', args),
    line: () => send(null, ['\n']),
    out: (...args: unknown[]) => send(null, args),
    catch: (cb: () => unknown) => {
      const sendError = (err: unknown) => send('ERROR', [getErrMsg(err)]);
      safeCall(cb, sendError, pending);
    },
    // Waits for transports that returned a promise
    flush: () => settle(pending),
    close: () =>
      (closing ??= settle(pending).then(() => {
        isClosed = true;
      })),
  };
}

// ============================= Shared Helpers ============================ //

/**
 * Drop options set to `undefined`, e.g. `{ filepath: process.env.LOG_PATH }`
 * when the variable isn't set.
 *
 * Used by: {@link JetLogger}
 *
 * @private
 */
function withoutUndefined(options?: JetLoggerOptions): JetLoggerOptions {
  if (!options) return {};
  const entries = Object.entries(options).filter(
    ([, val]) => val !== undefined,
  );
  return Object.fromEntries(entries) as JetLoggerOptions;
}

/**
 * Wait until every pending callback has settled, including ones started
 * while waiting.
 *
 * Used by:
 *   {@link setupStandardInstance}
 *   {@link setupCustomTransportInstance}
 *
 * @private
 */
async function settle(pending: Pending): Promise<void> {
  while (pending.size > 0) {
    await Promise.all(pending);
  }
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default JetLogger;
