import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const FIXTURE = path.resolve('test/ai/fixtures/logLines.ts');
const LINE_COUNT = 20_000;

// Stop a stuck fixture so the test fails on its assertions, not a timeout
const KILL_AFTER_MS = 15_000;

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

interface RunResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
}

// ========================================================================= //
//                                  HELPERS                                  //
// ========================================================================= //

/**
 * Run the fixture in its own process. With `slowReader`, stdout isn't read
 * for a while, so the pipe fills up like it does behind a busy log shipper.
 */
async function runFixture(
  args: string[],
  { slowReader = false } = {},
): Promise<RunResult> {
  const child = spawn(process.execPath, ['--import', 'tsx', FIXTURE, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  const timer = setTimeout(() => child.kill('SIGKILL'), KILL_AFTER_MS);
  const exited = new Promise<Pick<RunResult, 'code' | 'signal'>>((resolve) =>
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    }),
  );
  const stderr = collect(child.stderr);
  const stdout = collect(child.stdout);
  if (slowReader) {
    child.stdout.pause();
    setTimeout(() => child.stdout.resume(), 500);
  }
  return { stdout: await stdout, stderr: await stderr, ...(await exited) };
}

function collect(stream: Readable): Promise<string> {
  return new Promise((resolve) => {
    let text = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk: string) => (text += chunk));
    stream.on('end', () => resolve(text));
  });
}

const countLines = (text: string) =>
  text.split('\n').filter((line) => line.startsWith('INFO: line')).length;

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //
// These run jet-logger in a separate process to check what actually reaches
// the terminal or disk.

describe('jet-logger in a real process', { timeout: 30_000 }, () => {
  let tmpDir = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jet-logger-process-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('delivers every line when stdout is a busy pipe', async () => {
    const result = await runFixture(
      ['console', String(LINE_COUNT), 'natural'],
      {
        slowReader: true,
      },
    );
    expect(result.stderr).toBe('');
    expect(countLines(result.stdout)).toBe(LINE_COUNT);
    expect(result.code).toBe(0);
  });

  it.each([
    ['ends normally', 'natural', { code: 0, signal: null }],
    ['calls process.exit()', 'exit', { code: 0, signal: null }],
    ['is stopped by SIGTERM', 'sigterm', { code: null, signal: 'SIGTERM' }],
    ['crashes', 'throw', { code: 1, signal: null }],
    [
      'handles SIGTERM itself',
      'app-sigterm-handler',
      { code: 7, signal: null },
    ],
  ])(
    'writes every line to the file when the app %s',
    async (_, ending, expectedExit) => {
      const filepath = path.join(tmpDir, 'app.log');
      const result = await runFixture([
        'file',
        String(LINE_COUNT),
        ending,
        filepath,
      ]);
      expect({ code: result.code, signal: result.signal }).toEqual(
        expectedExit,
      );
      expect(countLines(fs.readFileSync(filepath, 'utf8'))).toBe(LINE_COUNT);
    },
  );
});
