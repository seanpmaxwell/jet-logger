import { EFormats, EModes, Formats, Modes } from './JetLogger/_local/enums';
import JetLoggerRaw, {
  JetLoggerInstance,
  JetLoggerOptions,
} from './JetLogger/JetLogger';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

interface JetLogger {
  (options?: JetLoggerOptions): JetLoggerInstance;
  readonly Modes: EModes;
  readonly Formats: EFormats;
}

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

// Make the enums public readonly
const JetLoggerInit: JetLogger = Object.assign(JetLoggerRaw, {
  Modes: Modes.enum(),
  Formats: Formats.enum(),
});

// The default logger is created on first use, not on import, so importing
// has no side effects and environment variables set after the import (e.g.
// by a `.env` loader) still apply.
let defaultLogger: JetLoggerInstance | undefined;
const getDefaultLogger = () => (defaultLogger ??= JetLoggerRaw());

const DefaultLogger: JetLoggerInstance = Object.freeze({
  info: (...args: unknown[]) => getDefaultLogger().info(...args),
  warn: (...args: unknown[]) => getDefaultLogger().warn(...args),
  err: (...args: unknown[]) => getDefaultLogger().err(...args),
  imp: (...args: unknown[]) => getDefaultLogger().imp(...args),
  line: () => getDefaultLogger().line(),
  out: (...args: unknown[]) => getDefaultLogger().out(...args),
  catch: (cb: () => unknown) => getDefaultLogger().catch(cb),
  flush: () => getDefaultLogger().flush(),
  close: () => getDefaultLogger().close(),
});

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export type { JetLoggerInstance, JetLoggerOptions };
export type {
  CustomTransportFn,
  CustomTransportContext,
} from './JetLogger/_local/types';
export { default as InvalidOptionError } from './_common/classes/InvalidOptionErr';

export const JetLogger = JetLoggerInit;
export default DefaultLogger;
