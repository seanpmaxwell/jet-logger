import { Formats, Modes } from './enums';

import type { Level } from './constants/levels';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

export type Labels = 'INFO' | 'WARNING' | 'ERROR' | 'IMPORTANT';

// Options that exists when the optional API options are combined with the
// defaults. NOTE, if `customTransport` is not set, then the mode cannot be
// custom.
export type IOptions = {
  format: Formats;
  showTime: boolean;
  prependTimeToFilename: boolean;
  filepath: string;
} & (
  | {
      mode: Exclude<Modes, 'custom'>;
      customTransport: null;
    }
  | {
      mode: Modes;
      customTransport: CustomTransportFn;
    }
);

// One call to a log method
export interface LogEntry {
  level: Level;
  args: unknown[];
}

// ============================= Top Api Layer ============================= //

export interface CustomTransportContext {
  time: string;
  // `null` for `out()` and `line()`, which have no level
  level: Labels | null;
  msg: string;
}

// May be async: rejections are reported on stderr instead of crashing
export interface CustomTransportFn {
  (context: CustomTransportContext): void | Promise<void>;
}

export type APIOptions = Partial<IOptions>;
