import { LogEntry } from '@src/JetLogger/_local/types';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

export interface LogWriter {
  // A labeled log line
  writeLog(entry: LogEntry): void;
  // `args` as their own line, without a label or timestamp
  writeRaw(args: unknown[]): void;
  // Resolves once everything written so far has been output
  flush(): Promise<void>;
  // Flush, then release anything the writer holds open
  close(): Promise<void>;
}
