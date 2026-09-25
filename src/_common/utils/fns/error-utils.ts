// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

// V8 stack frames look like "    at fn (file:1:2)"
const V8_FRAME = /^\s+at /;

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * The message of anything that was thrown.
 */
export function getErrMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * The stack frames of an error, one per entry, without the "Name: message"
 * header. V8 (Node, Chrome) puts that header, which can span several lines,
 * before the frames; Firefox and Safari leave it out.
 */
export function getStackFrames(err: Error): string[] | undefined {
  if (!err.stack) return undefined;
  const lines = err.stack.split('\n');
  const firstFrame = lines.findIndex((line) => V8_FRAME.test(line));
  const frames = firstFrame >= 0 ? lines.slice(firstFrame) : lines;
  return frames.map((line) => line.trim()).filter((line) => line !== '');
}

/**
 * "Name: message" followed by the stack, the same in every browser.
 */
export function errToStr(err: Error): string {
  const header = String(err);
  const { stack } = err;
  if (!stack) return header;
  // V8 stacks already start with the header
  if (
    stack.startsWith(header) ||
    stack.split('\n').some((l) => V8_FRAME.test(l))
  ) {
    return stack;
  }
  return `${header}\n${stack}`;
}
