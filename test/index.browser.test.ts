import { afterEach, describe, expect, it, vi } from 'vitest';

import logger, { type CustomTransportFn, JetLogger } from '@src/index';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const Css = {
  TIMESTAMP: 'color: #006B00',
  INFO: 'color: #008000',
  IMPORTANT: 'color: #FF00FF; font-weight: bold; text-decoration: underline',
  WARN: 'color: #DAA520',
  ERROR: 'color: #FF0000',
  CONTENT: 'color: #808080',
} as const;

// Format string for a line without a timestamp: "%c" (CSS) and "%s" (text)
// for the label and for the content
const LINE_FORMAT = '%c%s: %c%s';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

// Only the parts of the browser's `Worker` these tests use
declare const Worker: new (
  url: URL,
  options: { type: 'module' },
) => {
  onmessage: ((event: { data: string }) => void) | null;
  onerror: ((event: { message: string }) => void) | null;
  terminate(): void;
};

// ========================================================================= //
//                                  HELPERS                                  //
// ========================================================================= //

/**
 * Capture the console output for testing.
 */
function captureConsole() {
  return {
    info: vi.spyOn(console, 'info').mockImplementation(() => undefined),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
    error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
  };
}

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //

describe('jet-logger browser mode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // =============================== Default =============================== //

  describe('browser mode (default)', () => {
    it('uses the right console method and CSS for each level', () => {
      const output = captureConsole();
      const log = JetLogger({ showTime: false });

      log.info('client connected');
      log.imp('app ready');
      log.warn('retrying request');
      log.err('request failed');

      expect(output.info.mock.calls).toEqual([
        [LINE_FORMAT, Css.INFO, 'INFO', Css.CONTENT, 'client connected'],
        [LINE_FORMAT, Css.IMPORTANT, 'IMPORTANT', Css.CONTENT, 'app ready'],
      ]);
      expect(output.warn).toHaveBeenCalledWith(
        LINE_FORMAT,
        Css.WARN,
        'WARNING',
        Css.CONTENT,
        'retrying request',
      );
      expect(output.error).toHaveBeenCalledWith(
        LINE_FORMAT,
        Css.ERROR,
        'ERROR',
        Css.CONTENT,
        'request failed',
      );
    });

    it('prefixes each line with the local time, without the date', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 8, 24, 14, 3, 21, 45));
      const output = captureConsole();
      JetLogger().info('hello');
      expect(output.info).toHaveBeenCalledWith(
        '%c%s %c%s: %c%s',
        Css.TIMESTAMP,
        '[14:03:21.045]',
        Css.INFO,
        'INFO',
        Css.CONTENT,
        'hello',
      );
    });

    it('prints "%" sequences in messages as-is', () => {
      const output = captureConsole();
      JetLogger({ showTime: false }).info('50%off %c %s %o');
      expect(output.info).toHaveBeenCalledWith(
        LINE_FORMAT,
        Css.INFO,
        'INFO',
        Css.CONTENT,
        '50%off %c %s %o',
      );
    });

    it('falls back to the console when file mode is requested in a browser', () => {
      const output = captureConsole();
      const log = JetLogger({ mode: 'file', showTime: false });
      log.info('not a file');
      expect(output.info).toHaveBeenCalledWith(
        LINE_FORMAT,
        Css.INFO,
        'INFO',
        Css.CONTENT,
        'not a file',
      );
    });

    it('prints objects as JSON', () => {
      const output = captureConsole();
      JetLogger({ showTime: false }).info({ userId: 42 });
      expect(output.info.mock.calls[0][4]).toBe('{\n  "userId": 42\n}');
    });

    it('prints errors with their message and stack', () => {
      const output = captureConsole();
      JetLogger({ showTime: false }).err(new Error('boom'));
      const content: string = output.error.mock.calls[0][4];
      const [header, ...stack] = content.split('\n');
      expect(header).toBe('Error: boom');
      expect(stack.length).toBeGreaterThan(0);
    });

    it('prints sets, maps, and circular objects without throwing', () => {
      const output = captureConsole();
      const state: Record<string, unknown> = {
        tags: new Set(['a']),
        byId: new Map([[1, 'one']]),
      };
      state.self = state;
      JetLogger({ showTime: false }).info(state);
      expect(JSON.parse(output.info.mock.calls[0][4])).toEqual({
        tags: ['a'],
        byId: [[1, 'one']],
        self: '[Circular]',
      });
    });

    it('writes JSON without CSS formatting', () => {
      const output = captureConsole();
      const log = JetLogger({ format: 'json', showTime: false });
      log.warn('careful');
      expect(output.warn).toHaveBeenCalledWith(
        '%s',
        '{"level":"WARNING","msg":"careful"}',
      );
    });

    it('keeps every stack frame of an error in JSON', () => {
      const output = captureConsole();
      const log = JetLogger({ format: 'json', showTime: false });
      log.err(new Error('boom'));
      const entry = JSON.parse(output.error.mock.calls[0][1]);
      expect(entry.msg).toBe('boom');
      expect(entry.stack.length).toBeGreaterThan(0);
      entry.stack.forEach((frame: string) =>
        expect(frame).not.toBe('Error: boom'),
      );
    });

    it('prints out() and line() as their own lines, unformatted', () => {
      const output = captureConsole();
      const log = JetLogger();
      log.out('raw', 1);
      log.line();
      expect(output.info.mock.calls).toEqual([
        ['%s', 'raw 1'],
        ['%s', ''],
      ]);
    });

    it('works through the default logger', () => {
      const output = captureConsole();
      logger.info('default');
      expect(output.info.mock.calls[0].at(-1)).toBe('default');
    });

    it('works in a web worker', async () => {
      const worker = new Worker(
        new URL('./fixtures/worker.ts', import.meta.url),
        { type: 'module' },
      );
      const reply = await new Promise((resolve, reject) => {
        worker.onmessage = (event) => resolve(event.data);
        worker.onerror = (event) => reject(new Error(event.message));
      });
      worker.terminate();
      expect(reply).toBe('ok');
    });
  });

  // ============================= Other Modes ============================= //
  // We want to test these other modes when running in a browser

  describe('other modes', () => {
    it('prints nothing in off mode', () => {
      const output = captureConsole();
      JetLogger({ mode: 'off' }).info('hidden');
      expect(output.info).not.toHaveBeenCalled();
    });

    it('sends logs to a custom transport', () => {
      const transport = vi.fn<CustomTransportFn>();
      JetLogger({ mode: 'custom', customTransport: transport }).imp('sent');
      expect(transport).toHaveBeenCalledWith({
        time: expect.any(String),
        level: 'IMPORTANT',
        msg: 'sent',
      });
    });

    it('reports a failing async transport on the console', async () => {
      const output = captureConsole();
      const log = JetLogger({
        mode: 'custom',
        customTransport: async () => {
          throw new Error('HTTP 503');
        },
      });
      log.info('hello');
      await log.flush();
      expect(output.error.mock.calls[0][0]).toMatch(
        /^jet-logger: customTransport failed: Error: HTTP 503/,
      );
    });
  });
});
