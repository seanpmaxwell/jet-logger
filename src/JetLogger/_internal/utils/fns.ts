import { errToStr, getStackFrames } from '@src/_common/utils/fns/error-utils';

import safeStringify from '@cmn/utils/fns/safeStringify';
import unknownArrToStr from '@cmn/utils/fns/unknownArrToStr';
import ProcessHost from '@cmn/utils/modules/ProcessHost';

import {
  ANSI_RESET,
  ContentStyle,
  TextStyle,
  TimestampStyle,
} from '../../_local/constants/levels';
import { LogEntry } from '../../_local/types';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

interface JsonLog {
  time?: string;
  level: string;
  msg: string;
  data?: unknown;
  stack?: string[];
}

// Apply a style to a piece of a log line
export type Paint = (text: string, style: TextStyle) => string;

export interface LineOptions {
  showTime: boolean;
  // Leave the date out where lines are read as they happen (the console)
  showDate: boolean;
  paint: Paint;
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

// =============================== Line Stuff ============================== //

export const paintPlain: Paint = (text) => text;

export const paintAnsi: Paint = (text, style) =>
  `${style.ansi}${text}${ANSI_RESET}`;

/**
 * "[2026-09-24 14:03:21.123] INFO: content", or "[14:03:21.123] INFO: content"
 * without the date, styled with `paint`.
 */
export function toLineStr(entry: LogEntry, options: LineOptions): string {
  const { level, args } = entry;
  const { showTime, showDate, paint } = options;
  const label = paint(level.label, level);
  const content = paint(unknownArrToStr(args, false), ContentStyle);
  if (!showTime) return `${label}: ${content}`;
  const timestamp = paint(getLineTimestamp(showDate), TimestampStyle);
  return `${timestamp} ${label}: ${content}`;
}

/**
 * Local time, 24-hour clock, with milliseconds: [14:03:21.123], or with the
 * date: [2026-09-24 14:03:21.123]
 */
export function getLineTimestamp(withDate: boolean, date = new Date()): string {
  const hrs = pad(date.getHours());
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  const time = `${hrs}:${min}:${sec}.${ms}`;
  if (!withDate) return `[${time}]`;
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `[${year}-${month}-${day} ${time}]`;
}

/**
 * Add leading zeros.
 *
 * Used by: {@link getLineTimestamp}
 *
 * @private
 */
function pad(n: number, length = 2): string {
  return String(n).padStart(length, '0');
}

// =============================== Json Stuff ============================== //

/**
 * One JSON Lines record. Text and other primitive arguments are joined into
 * `msg`. Objects are kept as real JSON in `data` (the object itself when
 * there is one, an array when there are several). The first `Error` adds its
 * message to `msg` and its frames to `stack`. The field names match pino's
 * (`time`, `level`, `msg`).
 */
export function toJsonStr(entry: LogEntry, showTime: boolean): string {
  const text: string[] = [];
  const data: unknown[] = [];
  let error: Error | undefined;
  for (const arg of entry.args) {
    if (arg instanceof Error && !error) {
      error = arg;
      text.push(arg.message);
    } else if (typeof arg === 'object' && arg !== null) {
      data.push(arg);
    } else {
      text.push(String(arg));
    }
  }
  const level = entry.level.label;
  const msg = text.join(' ');
  const record: JsonLog = showTime
    ? { time: new Date().toISOString(), level, msg }
    : { level, msg };
  if (data.length > 0) record.data = data.length === 1 ? data[0] : data;
  if (error) record.stack = getStackFrames(error);
  return safeStringify(record);
}

// ============================ Error Reporting ============================ //

/**
 * Report a problem inside the logger itself (e.g. a failing custom transport)
 * without throwing into the code that was logging.
 */
export function reportInternalError(what: string, err: unknown): void {
  const detail = err instanceof Error ? errToStr(err) : String(err);
  const msg = `jet-logger: ${what}: ${detail}`;
  if (ProcessHost.IS_LOCAL) {
    process.stderr.write(msg + '\n');
  } else {
    // eslint-disable-next-line no-console
    console.error(msg);
  }
}
