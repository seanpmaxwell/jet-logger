import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest';

import logger, {
  type CustomTransportFn,
  InvalidOptionError,
  JetLogger,
} from '@src/index';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const ENV_KEYS = [
  'JET_LOGGER_MODE',
  'JET_LOGGER_FILEPATH',
  'JET_LOGGER_PREPEND_TIME_TO_FILENAME',
  'JET_LOGGER_SHOW_TIME',
  'JET_LOGGER_FORMAT',
  'FORCE_COLOR',
  'NO_COLOR',
] as const;

// A local date keeps the expected timestamp the same in every timezone.
const LOCAL_DATE = new Date(2026, 8, 24, 14, 3, 21, 45);
const LOCAL_TIME = '[14:03:21.045]';
const LOCAL_DATE_TIME = '[2026-09-24 14:03:21.045]';
const UTC_DATE = new Date('2026-09-24T14:03:21.000Z');

// ========================================================================= //
//                                  HELPERS                                  //
// ========================================================================= //

type StreamName = 'stdout' | 'stderr';

/**
 * Record what gets written to stdout and stderr, in order.
 */
function captureOutput() {
  const writes: { stream: StreamName; text: string }[] = [];
  const capture = (stream: StreamName) =>
    vi.spyOn(process[stream], 'write').mockImplementation(((
      chunk: string | Uint8Array,
      ...rest: unknown[]
    ) => {
      writes.push({ stream, text: chunk.toString() });
      const callback = rest.find((arg) => typeof arg === 'function');
      (callback as (() => void) | undefined)?.();
      return true;
    }) as typeof process.stdout.write);
  capture('stdout');
  capture('stderr');
  const read = (stream: StreamName) =>
    writes
      .filter((write) => write.stream === stream)
      .map((write) => write.text)
      .join('');
  return {
    stdout: () => read('stdout'),
    stderr: () => read('stderr'),
    all: () => writes.map((write) => `${write.stream}: ${write.text}`),
  };
}

/**
 * Make stdout and stderr look like a terminal, or not, for this test.
 */
function setIsTTY(isTTY: boolean) {
  for (const stream of [process.stdout, process.stderr]) {
    const original = Object.getOwnPropertyDescriptor(stream, 'isTTY');
    Object.defineProperty(stream, 'isTTY', {
      value: isTTY,
      configurable: true,
    });
    onTestFinished(() => {
      if (original) {
        Object.defineProperty(stream, 'isTTY', original);
      } else {
        delete (stream as { isTTY?: boolean }).isTTY;
      }
    });
  }
}

/**
 * Keep the buffer's flush timers running.
 */
function freezeDate(date: Date) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(date);
}

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //
// Test jet-logger as if it were running on your local-machine

describe('jet-logger local (non-browser mode)', () => {
  let tmpDir = '';

  beforeEach(() => {
    // Don't let the developer's shell settings change the test results.
    ENV_KEYS.forEach((key) => vi.stubEnv(key, undefined));
    setIsTTY(false);
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jet-logger-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const readFile = (name: string) =>
    fs.readFileSync(path.join(tmpDir, name), 'utf8');

  // ========================= Test What's Exported ======================== //

  describe('exports', () => {
    it('provides a default logger with all logging methods', () => {
      expect(logger).toEqual({
        info: expect.any(Function),
        warn: expect.any(Function),
        imp: expect.any(Function),
        err: expect.any(Function),
        line: expect.any(Function),
        out: expect.any(Function),
        catch: expect.any(Function),
        flush: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it('exposes the modes and formats', () => {
      expect(JetLogger.Modes).toEqual({
        CONSOLE: 'console',
        FILE: 'file',
        BROWSER: 'browser',
        CUSTOM: 'custom',
        OFF: 'off',
      });
      expect(JetLogger.Formats).toEqual({ LINE: 'line', JSON: 'json' });
    });

    it('exports the error class thrown for invalid options', () => {
      // @ts-expect-error: testing an invalid value
      expect(() => JetLogger({ mode: 'bogus' })).toThrow(InvalidOptionError);
    });

    it('does nothing on import, even with invalid environment settings', async () => {
      vi.stubEnv('JET_LOGGER_MODE', 'custom');
      const exitListeners = process.listenerCount('exit');
      vi.resetModules();
      await expect(import('@src/index')).resolves.toBeDefined();
      expect(process.listenerCount('exit')).toBe(exitListeners);
    });

    it('creates the default logger on first use', async () => {
      vi.resetModules();
      const { default: freshLogger } = await import('@src/index');
      // Set after the import, e.g. by a `.env` loader
      vi.stubEnv('JET_LOGGER_FORMAT', 'json');
      vi.stubEnv('JET_LOGGER_SHOW_TIME', 'false');
      const output = captureOutput();
      freshLogger.info('configured late');
      expect(JSON.parse(output.stdout())).toEqual({
        level: 'INFO',
        msg: 'configured late',
      });
    });
  });

  // ===================== Test Printing To The Console ==================== //

  describe('console mode', () => {
    it('prints info and imp to stdout, warn and err to stderr', () => {
      const output = captureOutput();
      const log = JetLogger({ showTime: false });
      log.info('info msg');
      log.imp('imp msg');
      log.warn('warn msg');
      log.err('err msg');
      expect(output.stdout()).toBe('INFO: info msg\nIMPORTANT: imp msg\n');
      expect(output.stderr()).toBe('WARNING: warn msg\nERROR: err msg\n');
    });

    it('keeps lines in the order they were logged', () => {
      const output = captureOutput();
      const log = JetLogger({ showTime: false });
      log.info('step 1');
      log.err('step 2');
      log.info('step 3');
      log.warn('step 4');
      expect(output.all()).toEqual([
        'stdout: INFO: step 1\n',
        'stderr: ERROR: step 2\n',
        'stdout: INFO: step 3\n',
        'stderr: WARNING: step 4\n',
      ]);
    });

    it('prefixes each line with the local time, without the date', () => {
      freezeDate(LOCAL_DATE);
      const output = captureOutput();
      JetLogger().info('hello');
      expect(output.stdout()).toBe(`${LOCAL_TIME} INFO: hello\n`);
    });

    it('colors the output in a terminal', () => {
      setIsTTY(true);
      const output = captureOutput();
      JetLogger({ showTime: false }).info('hello');
      expect(output.stdout()).toBe(
        '\x1b[32mINFO\x1b[0m: \x1b[38;5;248mhello\x1b[0m\n',
      );
    });

    it('leaves out colors when the output is not a terminal', () => {
      const output = captureOutput();
      JetLogger({ showTime: false }).info('hello');
      expect(output.stdout()).toBe('INFO: hello\n');
    });

    it('follows FORCE_COLOR and NO_COLOR', () => {
      const output = captureOutput();
      vi.stubEnv('FORCE_COLOR', '1');
      JetLogger({ showTime: false }).info('forced');
      setIsTTY(true);
      vi.stubEnv('FORCE_COLOR', undefined);
      vi.stubEnv('NO_COLOR', '1');
      JetLogger({ showTime: false }).info('disabled');
      expect(output.stdout()).toBe(
        '\x1b[32mINFO\x1b[0m: \x1b[38;5;248mforced\x1b[0m\n' +
          'INFO: disabled\n',
      );
    });

    it('joins arguments with a space and prints objects in full', () => {
      const output = captureOutput();
      JetLogger({ showTime: false }).info('count:', 3, {
        a: { b: { c: { d: 'deep' } } },
      });
      const text = output.stdout();
      expect(text).toMatch(/^INFO: count: 3 \{/);
      expect(text).toContain("d: 'deep'");
      expect(text).not.toContain('[Object]');
    });

    it('prints errors with their stack', () => {
      const output = captureOutput();
      JetLogger({ showTime: false }).err(new Error('boom'));
      expect(output.stderr()).toMatch(/^ERROR: Error: boom\n\s+at /);
    });

    it('prints out() and line() as their own lines, unformatted', () => {
      const output = captureOutput();
      const log = JetLogger({ showTime: false });
      log.out('raw', 1);
      log.line();
      log.info('next');
      expect(output.stdout()).toBe('raw 1\n\nINFO: next\n');
    });

    it('logs the error message when the catch() callback throws', () => {
      const output = captureOutput();
      const log = JetLogger({ showTime: false });
      log.catch(() => {
        throw new Error('caught');
      });
      log.catch(() => {
        throw 'plain string';
      });
      log.catch(() => 'no error');
      expect(output.stderr()).toBe('ERROR: caught\nERROR: plain string\n');
    });

    it('logs async catch() callbacks that reject instead of crashing', async () => {
      const output = captureOutput();
      const log = JetLogger({ showTime: false });
      log.catch(async () => {
        throw new Error('async failure');
      });
      await log.flush();
      expect(output.stderr()).toBe('ERROR: async failure\n');
    });
  });

  // =========================== Test Json Output ========================== //

  describe('json format', () => {
    it('prints JSON with an ISO timestamp and objects under "data"', () => {
      freezeDate(UTC_DATE);
      const output = captureOutput();
      JetLogger({ format: JetLogger.Formats.JSON }).warn('careful', { id: 1 });
      expect(JSON.parse(output.stderr())).toEqual({
        time: '2026-09-24T14:03:21.000Z',
        level: 'WARNING',
        msg: 'careful',
        data: { id: 1 },
      });
    });

    it('puts several objects in a "data" array', () => {
      const output = captureOutput();
      const log = JetLogger({ format: 'json', showTime: false });
      log.info('user', 42, { id: 1 }, ['a']);
      expect(JSON.parse(output.stdout())).toEqual({
        level: 'INFO',
        msg: 'user 42',
        data: [{ id: 1 }, ['a']],
      });
    });

    it('prints errors with the message and the stack frames', () => {
      const output = captureOutput();
      const log = JetLogger({ format: 'json', showTime: false });
      log.err('request failed:', new Error('first line\nsecond line'));
      const entry = JSON.parse(output.stderr());
      expect(entry).toMatchObject({
        level: 'ERROR',
        msg: 'request failed: first line\nsecond line',
      });
      expect(entry.stack.length).toBeGreaterThan(0);
      entry.stack.forEach((frame: string) => expect(frame).toMatch(/^at /));
    });

    it('never throws on values JSON cannot represent', () => {
      const output = captureOutput();
      const state: Record<string, unknown> = {
        count: 10n,
        tags: new Set(['a']),
        byId: new Map([[1, 'one']]),
      };
      state.self = state;
      JetLogger({ format: 'json', showTime: false }).info(state);
      expect(JSON.parse(output.stdout()).data).toEqual({
        count: '10n',
        tags: ['a'],
        byId: [[1, 'one']],
        self: '[Circular]',
      });
    });
  });

  // ======================== Test Printing To Files ======================= //

  describe('file mode', () => {
    it('appends plain-text logs without colors', async () => {
      vi.stubEnv('FORCE_COLOR', '1');
      const filepath = path.join(tmpDir, 'app.log');
      fs.writeFileSync(filepath, 'existing\n');
      const log = JetLogger({
        mode: JetLogger.Modes.FILE,
        filepath,
        showTime: false,
      });
      log.info('one');
      log.err('two');
      log.out('three');
      await log.close();
      expect(readFile('app.log')).toBe(
        'existing\nINFO: one\nERROR: two\nthree\n',
      );
    });

    it('prefixes each line with the local date and time', async () => {
      freezeDate(LOCAL_DATE);
      const filepath = path.join(tmpDir, 'dated.log');
      const log = JetLogger({ mode: 'file', filepath });
      log.info('hello');
      await log.close();
      expect(readFile('dated.log')).toBe(`${LOCAL_DATE_TIME} INFO: hello\n`);
    });

    it('writes to the file name as given by default', async () => {
      const log = JetLogger({
        mode: 'file',
        filepath: path.join(tmpDir, 'app.log'),
      });
      await log.close();
      expect(fs.readdirSync(tmpDir)).toEqual(['app.log']);
    });

    it('can prepend a UTC timestamp to the file name', async () => {
      freezeDate(UTC_DATE);
      const log = JetLogger({
        mode: 'file',
        filepath: path.join(tmpDir, 'app.log'),
        prependTimeToFilename: true,
      });
      await log.close();
      expect(fs.readdirSync(tmpDir)).toEqual(['20260924T140321Z_app.log']);
    });

    it('creates missing directories', async () => {
      const log = JetLogger({
        mode: 'file',
        filepath: path.join(tmpDir, 'a', 'b', 'app.log'),
        showTime: false,
      });
      log.info('nested');
      await log.close();
      expect(readFile('a/b/app.log')).toBe('INFO: nested\n');
    });

    it('uses a .jsonl extension for the default file name in JSON format', async () => {
      const log = JetLogger({
        mode: 'file',
        format: 'json',
        filepath: path.join(tmpDir, 'jet-logger.log'),
        showTime: false,
      });
      log.info('structured');
      await log.close();
      expect(readFile('jet-logger.jsonl')).toBe(
        '{"level":"INFO","msg":"structured"}\n',
      );
    });

    it('keeps other file names that merely end like the default', async () => {
      const log = JetLogger({
        mode: 'file',
        format: 'json',
        filepath: path.join(tmpDir, 'my-jet-logger.log'),
      });
      await log.close();
      expect(fs.readdirSync(tmpDir)).toEqual(['my-jet-logger.log']);
    });

    it('keeps lines in order when loggers share a file', async () => {
      const filepath = path.join(tmpDir, 'shared.log');
      const first = JetLogger({ mode: 'file', filepath, showTime: false });
      const second = JetLogger({
        mode: 'file',
        filepath,
        showTime: false,
      });
      for (let i = 0; i < 100; i++) {
        (i % 2 ? second : first).info(`line ${i}`);
      }
      await Promise.all([first.close(), second.close()]);
      const expected = Array.from({ length: 100 }, (_, i) => `INFO: line ${i}`);
      expect(readFile('shared.log')).toBe(expected.join('\n') + '\n');
    });

    it('has everything on disk once flush() resolves', async () => {
      const log = JetLogger({
        mode: 'file',
        filepath: path.join(tmpDir, 'flush.log'),
        showTime: false,
      });
      for (let i = 0; i < 1000; i++) log.info(`line ${i}`);
      await log.flush();
      expect(readFile('flush.log').split('\n')).toHaveLength(1001);
      await log.close();
    });

    it('ignores logs after close()', async () => {
      const filepath = path.join(tmpDir, 'closed.log');
      const log = JetLogger({ mode: 'file', filepath, showTime: false });
      log.info('before');
      await log.close();
      log.info('after');
      await log.flush();
      expect(readFile('closed.log')).toBe('INFO: before\n');
    });

    it('adds one exit handler no matter how many loggers there are', async () => {
      const listeners = () =>
        process.listenerCount('exit') + process.listenerCount('SIGTERM');
      const before = listeners();
      const logs = Array.from({ length: 20 }, (_, i) =>
        JetLogger({ mode: 'file', filepath: path.join(tmpDir, `${i}.log`) }),
      );
      expect(listeners() - before).toBeLessThanOrEqual(2);
      await Promise.all(logs.map((log) => log.close()));
    });
  });

  // ======================== Test Disabling Logging ======================= //

  describe('off mode', () => {
    it('prints nothing', () => {
      const output = captureOutput();
      const log = JetLogger({ mode: JetLogger.Modes.OFF });
      log.info('info message');
      log.imp('important message');
      log.warn('warning message');
      log.err('error message');
      log.out('raw message');
      log.line();
      expect(output.stdout() + output.stderr()).toBe('');
    });

    it('still runs the catch() callback without printing the error', async () => {
      const output = captureOutput();
      const callback = vi.fn(() => {
        throw new Error('hidden');
      });
      const log = JetLogger({ mode: 'off' });
      log.catch(callback);
      log.catch(async () => {
        throw new Error('hidden too');
      });
      await log.flush();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(output.stdout() + output.stderr()).toBe('');
    });
  });

  // =================== Test Using A `CustomTransportFn` ================== //

  describe('custom mode', () => {
    it('passes the time, level, and msg to the transport', () => {
      freezeDate(UTC_DATE);
      const transport = vi.fn<CustomTransportFn>();
      const log = JetLogger({
        mode: JetLogger.Modes.CUSTOM,
        customTransport: transport,
      });
      log.info('connected clients:', 1);
      log.imp('server ready');
      log.warn('retrying request');
      log.err('request failed');
      const time = '2026-09-24T14:03:21.000Z';
      expect(transport.mock.calls.map(([context]) => context)).toEqual([
        { time, level: 'INFO', msg: 'connected clients: 1' },
        { time, level: 'IMPORTANT', msg: 'server ready' },
        { time, level: 'WARNING', msg: 'retrying request' },
        { time, level: 'ERROR', msg: 'request failed' },
      ]);
    });

    it('gives out() and line() no level and catch() errors "ERROR"', () => {
      const transport = vi.fn<CustomTransportFn>();
      const log = JetLogger({ mode: 'custom', customTransport: transport });
      log.out('raw');
      log.line();
      log.catch(() => {
        throw new Error('caught');
      });
      expect(
        transport.mock.calls.map(([context]) => [context.level, context.msg]),
      ).toEqual([
        [null, 'raw'],
        [null, '\n'],
        ['ERROR', 'caught'],
      ]);
    });

    it('reports a transport that throws instead of throwing to the caller', () => {
      const output = captureOutput();
      const log = JetLogger({
        mode: 'custom',
        customTransport: () => {
          throw new Error('collector down');
        },
      });
      expect(() => log.info('hello')).not.toThrow();
      expect(output.stderr()).toContain(
        'jet-logger: customTransport failed: Error: collector down',
      );
    });

    it('reports a transport that rejects instead of crashing', async () => {
      const output = captureOutput();
      const log = JetLogger({
        mode: 'custom',
        customTransport: async () => {
          throw new Error('HTTP 503');
        },
      });
      log.info('hello');
      await log.flush();
      expect(output.stderr()).toContain(
        'jet-logger: customTransport failed: Error: HTTP 503',
      );
    });

    it('waits for async transports in flush()', async () => {
      const sent: string[] = [];
      const log = JetLogger({
        mode: 'custom',
        customTransport: async ({ msg }) => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          sent.push(msg);
        },
      });
      log.info('one');
      log.info('two');
      await log.flush();
      expect(sent).toEqual(['one', 'two']);
    });

    it('ignores logs after close()', async () => {
      const transport = vi.fn<CustomTransportFn>();
      const log = JetLogger({ mode: 'custom', customTransport: transport });
      await log.close();
      log.info('after');
      expect(transport).not.toHaveBeenCalled();
    });
  });

  // ========== Test Loading "options" From Environment Variables ========== //

  describe('environment variables', () => {
    it('reads settings at creation time, regardless of case', () => {
      vi.stubEnv('JET_LOGGER_FORMAT', 'Json');
      vi.stubEnv('JET_LOGGER_SHOW_TIME', 'FALSE');
      const output = captureOutput();
      JetLogger().info('from env');
      expect(JSON.parse(output.stdout())).toEqual({
        level: 'INFO',
        msg: 'from env',
      });
    });

    it('turns logging off when JET_LOGGER_MODE is OFF', () => {
      vi.stubEnv('JET_LOGGER_MODE', 'OFF');
      const output = captureOutput();
      JetLogger().info('hidden');
      expect(output.stdout()).toBe('');
    });

    it('uses the file path and options from the environment', async () => {
      freezeDate(UTC_DATE);
      vi.stubEnv('JET_LOGGER_MODE', 'File');
      vi.stubEnv('JET_LOGGER_FILEPATH', path.join(tmpDir, 'env.log'));
      vi.stubEnv('JET_LOGGER_PREPEND_TIME_TO_FILENAME', 'true');
      vi.stubEnv('JET_LOGGER_SHOW_TIME', 'false');
      const log = JetLogger();
      log.warn('env file');
      await log.close();
      expect(readFile('20260924T140321Z_env.log')).toBe('WARNING: env file\n');
    });

    it('falls back to defaults for unrecognized values', () => {
      vi.stubEnv('JET_LOGGER_MODE', 'bogus');
      vi.stubEnv('JET_LOGGER_FORMAT', 'xml');
      vi.stubEnv('JET_LOGGER_SHOW_TIME', 'nope');
      freezeDate(LOCAL_DATE);
      const output = captureOutput();
      JetLogger().info('defaults');
      expect(output.stdout()).toBe(`${LOCAL_TIME} INFO: defaults\n`);
    });

    it('prefers explicit options over environment settings', () => {
      vi.stubEnv('JET_LOGGER_FORMAT', 'json');
      vi.stubEnv('JET_LOGGER_SHOW_TIME', 'true');
      const output = captureOutput();
      JetLogger({ format: 'line', showTime: false }).info('code wins');
      expect(output.stdout()).toBe('INFO: code wins\n');
    });
  });

  // =========== Test Validation For Jetlogger's `options` param. ========== //

  describe('validation', () => {
    it('throws an InvalidOptionError for an invalid value', () => {
      // @ts-expect-error: testing an invalid value
      const create = () => JetLogger({ mode: 'bogus' });
      expect(create).toThrow('Invalid option "mode": "bogus"');
      expect(create).toThrow(
        expect.objectContaining({ name: 'InvalidOptionError' }),
      );
    });

    it('throws for a value of the wrong type', () => {
      // @ts-expect-error: testing an invalid value
      const create = () => JetLogger({ showTime: 'yes' });
      expect(create).toThrow('Invalid option "showTime": "yes"');
    });

    it('treats options set to undefined as not set', () => {
      const output = captureOutput();
      const log = JetLogger({
        mode: undefined,
        filepath: undefined,
        showTime: false,
      });
      log.info('defaults');
      expect(output.stdout()).toBe('INFO: defaults\n');
    });

    it('rejects an empty file path', () => {
      const create = () => JetLogger({ mode: 'file', filepath: '' });
      expect(create).toThrow('Invalid option "filepath": ""');
    });

    it('rejects unknown options', () => {
      // @ts-expect-error: testing an invalid value
      const create = () => JetLogger({ colour: true });
      expect(create).toThrow('Invalid option "colour": true. Unknown option');
    });

    it('requires customTransport in custom mode', () => {
      const create = () => JetLogger({ mode: 'custom' });
      expect(create).toThrow(
        'Invalid option "customTransport": null. The mode is set to "custom". ' +
          'The "customTransport" must be a valid function type.',
      );
    });
  });
});
