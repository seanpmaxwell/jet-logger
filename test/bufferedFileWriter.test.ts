import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BufferedFileWriter from '@src/JetLogger/_internal/BufferedFileWriter/BufferedFileWriter';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const MAX_BUFFER_LENGTH = 64 * 1024;
const STDERR_FD = 2;

// Saved before any test replaces it
const realWriteSync = fs.writeSync.bind(fs);

// ========================================================================= //
//                                  HELPERS                                  //
// ========================================================================= //

type WriteSyncImpl = (fd: number, data: Buffer) => number;

/**
 * Record every `fs.writeSync` call to the log file, and optionally change
 * what the call does. Writes to stderr are recorded instead of printed.
 */
function mockWriteSync(
  impl: WriteSyncImpl = (fd, data) => realWriteSync(fd, data),
) {
  const chunks: string[] = [];
  const stderr: string[] = [];
  vi.spyOn(fs, 'writeSync').mockImplementation(((
    fd: number,
    data: Buffer | string,
  ) => {
    if (fd === STDERR_FD) {
      stderr.push(data.toString());
      return data.length;
    }
    chunks.push(data.toString());
    return impl(fd, data as Buffer);
  }) as typeof fs.writeSync);
  return { chunks, stderr };
}

const nextTick = () => new Promise((resolve) => setImmediate(resolve));

const lines = (count: number) =>
  Array.from({ length: count }, (_, i) => `line ${i}\n`).join('');

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //

describe('BufferedFileWriter', () => {
  let tmpDir = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jet-logger-buffer-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const open = (name: string) =>
    BufferedFileWriter.open(path.join(tmpDir, name));
  const read = (name: string) =>
    fs.readFileSync(path.join(tmpDir, name), 'utf8');

  it('writes the lines logged in one tick together, at the end of it', async () => {
    const { chunks } = mockWriteSync();
    const file = open('batch.log');
    file.write('a\n');
    file.write('b\n');
    file.write('c\n');
    expect(chunks).toEqual([]);
    await nextTick();
    expect(chunks).toEqual(['a\nb\nc\n']);
    expect(read('batch.log')).toBe('a\nb\nc\n');
    await file.release();
  });

  it('writes right away once 64 KB are waiting, so memory stays small', async () => {
    const { chunks } = mockWriteSync();
    const file = open('burst.log');
    const line = 'x'.repeat(99) + '\n';
    // About 1 MB, all in one tick
    for (let i = 0; i < 10_000; i++) file.write(line);
    // Written during the burst, in bounded pieces, not all at the end
    expect(chunks.length).toBeGreaterThan(10);
    chunks.forEach((chunk) =>
      expect(chunk.length).toBeLessThan(MAX_BUFFER_LENGTH + line.length),
    );
    await file.flush();
    expect(read('burst.log')).toBe(line.repeat(10_000));
    await file.release();
  });

  it('writes everything in order when writes come up short', async () => {
    // Only half of each chunk is written per call
    mockWriteSync((fd, data) => {
      const half = Math.ceil(data.length / 2);
      return realWriteSync(fd, data.subarray(0, half));
    });
    const file = open('short.log');
    for (let i = 0; i < 50; i++) file.write(`line ${i}\n`);
    await file.flush();
    expect(read('short.log')).toBe(lines(50));
    await file.release();
  });

  it('retries instead of dropping lines while the file is full (EAGAIN)', async () => {
    let failures = 3;
    const { stderr } = mockWriteSync((fd, data) => {
      if (failures-- > 0) {
        throw Object.assign(new Error('EAGAIN'), { code: 'EAGAIN' });
      }
      return realWriteSync(fd, data);
    });
    const file = open('full.log');
    for (let i = 0; i < 10; i++) file.write(`line ${i}\n`);
    await file.flush();
    expect(read('full.log')).toBe(lines(10));
    expect(stderr).toEqual([]);
    await file.release();
  });

  it('writes buffered lines immediately with flushSync()', async () => {
    const file = open('sync.log');
    file.write('first\n');
    file.write('second\n');
    file.flushSync();
    expect(read('sync.log')).toBe('first\nsecond\n');
    await file.release();
  });

  it('reports a failed write on stderr instead of throwing', async () => {
    const { stderr } = mockWriteSync(() => {
      throw new Error('EIO');
    });
    const file = open('broken.log');
    file.write('lost\n');
    expect(() => file.flushSync()).not.toThrow();
    expect(stderr).toEqual(['jet-logger: file write failed: EIO\n']);
    vi.restoreAllMocks();
    await file.release();
  });

  it('shares one open file per path and closes it after the last release', async () => {
    const closeSync = vi.spyOn(fs, 'closeSync');
    const first = open('shared.log');
    const second = open('shared.log');
    expect(second).toBe(first);
    await first.release();
    expect(closeSync).not.toHaveBeenCalled();
    await second.release();
    expect(closeSync).toHaveBeenCalledTimes(1);
    // Opened again on the next use
    const reopened = open('shared.log');
    expect(reopened).not.toBe(first);
    await reopened.release();
  });
});
