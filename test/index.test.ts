/* eslint-disable no-process-env */
import fs from 'fs';
import util from 'util';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { jetLogger, JetLogger } from '../src/jetLogger.js';

const ENV_KEYS = [
  'JET_LOGGER_MODE',
  'JET_LOGGER_FILEPATH',
  'JET_LOGGER_FILEPATH_DATETIME',
  'JET_LOGGER_TIMESTAMP',
  'JET_LOGGER_FORMAT',
] as const;

const envBackup: Record<(typeof ENV_KEYS)[number], string | undefined> = {
  JET_LOGGER_MODE: undefined,
  JET_LOGGER_FILEPATH: undefined,
  JET_LOGGER_FILEPATH_DATETIME: undefined,
  JET_LOGGER_TIMESTAMP: undefined,
  JET_LOGGER_FORMAT: undefined,
};

beforeAll(() => {
  ENV_KEYS.forEach((key) => {
    envBackup[key] = process.env[key];
  });
});

afterAll(() => {
  ENV_KEYS.forEach((key) => {
    const original = envBackup[key];
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  });
});

beforeEach(() => {
  ENV_KEYS.forEach((key) => {
    delete process.env[key];
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  ENV_KEYS.forEach((key) => {
    delete process.env[key];
  });
});

describe('JetLogger', () => {
  const noopAppendSpy = () =>
    vi
      .spyOn(fs, 'appendFile')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(((_: any, __: any, cb: any) => {
        if (typeof cb === 'function') {
          cb(null);
        }
      }) as unknown as typeof fs.appendFile);

  it('logs to the console in line format when configured directly', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = jetLogger({
      mode: JetLogger.Modes.CONSOLE,
      filepath: 'jet.log',
      filepathDatetimeParam: false,
      timestamp: false,
      format: JetLogger.Formats.LINE,
    });

    logger.info('ready');

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain('INFO: ready');
  });

  it('uses util.inspect when printFull is requested', () => {
    const inspectSpy = vi.spyOn(util, 'inspect').mockReturnValue('full-object');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = jetLogger({
      mode: JetLogger.Modes.CONSOLE,
      filepath: 'jet.log',
      filepathDatetimeParam: false,
      timestamp: false,
      format: JetLogger.Formats.LINE,
    });
    const payload = { nested: { value: 42 } };

    logger.err(payload, true);

    expect(inspectSpy).toHaveBeenCalledWith(payload);
    expect(logSpy.mock.calls[0][0]).toContain('ERROR: full-object');
  });

  it('serializes output as JSON when requested', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-12-31T10:20:30.000Z'));
    const appendSpy = noopAppendSpy();
    const logger = jetLogger({
      mode: JetLogger.Modes.FILE,
      filepath: '/tmp/app.log',
      filepathDatetimeParam: false,
      timestamp: true,
      format: JetLogger.Formats.JSON,
    });

    logger.warn('structured payload');

    expect(appendSpy).toHaveBeenCalledTimes(1);
    const payload = (appendSpy.mock.calls[0][1] as string).trim();
    expect(JSON.parse(payload)).toEqual({
      level: 'WARNING',
      message: 'structured payload',
      timestamp: '2023-12-31T10:20:30.000Z',
    });
  });

  it('reads file configuration from environment variables and prefixes datetime', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-02T03:04:05.000Z'));
    process.env.JET_LOGGER_MODE = JetLogger.Modes.FILE;
    process.env.JET_LOGGER_FILEPATH = 'logs/app.log';
    process.env.JET_LOGGER_FILEPATH_DATETIME = 'True';
    process.env.JET_LOGGER_TIMESTAMP = 'False';
    const appendSpy = noopAppendSpy();
    const logger = jetLogger();

    logger.warn('env driven');

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(appendSpy.mock.calls[0][0]).toBe('logs/20240202T030405_app.log');
    expect(appendSpy.mock.calls[0][1]).toBe('WARNING: env driven');
  });

  it('delegates to a custom logger when mode is CUSTOM', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-01T12:00:00.000Z'));
    const customFn = vi.fn();
    const logger = jetLogger({
      mode: JetLogger.Modes.CUSTOM,
      customLogger: customFn,
    });

    logger.imp('forwarded');

    expect(customFn).toHaveBeenCalledTimes(1);
    const [timestamp, level, content] = customFn.mock.calls[0];
    expect((timestamp as Date).toISOString()).toBe('2024-05-01T12:00:00.000Z');
    expect(level).toBe('IMPORTANT');
    expect(content).toBe('forwarded');
  });

  it('respects the OFF mode when set via environment variables', () => {
    process.env.JET_LOGGER_MODE = JetLogger.Modes.OFF;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const appendSpy = vi.spyOn(fs, 'appendFile');
    const logger = jetLogger();

    logger.info('should not print');
    logger.err('should not print either');

    expect(logSpy).not.toHaveBeenCalled();
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('serializes JSON without timestamps when disabled through env vars', () => {
    process.env.JET_LOGGER_MODE = JetLogger.Modes.FILE;
    process.env.JET_LOGGER_FILEPATH = '/tmp/env.jsonl';
    process.env.JET_LOGGER_FILEPATH_DATETIME = 'False';
    process.env.JET_LOGGER_FORMAT = JetLogger.Formats.JSON;
    process.env.JET_LOGGER_TIMESTAMP = 'False';
    const appendSpy = noopAppendSpy();
    const logger = jetLogger();

    logger.info('no timestamp please');

    const payload = (appendSpy.mock.calls[0][1] as string).trim();
    expect(JSON.parse(payload)).toEqual({
      level: 'INFO',
      message: 'no timestamp please',
    });
  });
});
