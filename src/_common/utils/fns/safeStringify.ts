// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

interface StackEntry {
  holder: unknown;
  original: object;
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * `JSON.stringify` that never throws and keeps values that would otherwise be
 * lost: circular references become "[Circular]", BigInts become "123n", and
 * `Error`, `Map`, and `Set` objects keep their contents instead of becoming
 * `{}`.
 */
function safeStringify(value: unknown, space?: number): string {
  // The chain of objects from the root down to the value being serialized,
  // so only true cycles are marked, not objects that are shared.
  const stack: StackEntry[] = [];
  const replacer = function (this: unknown, _key: string, val: unknown) {
    // `this` is the object holding `val`, so drop anything below it
    while (stack.length > 0 && stack[stack.length - 1].holder !== this) {
      stack.pop();
    }
    if (typeof val === 'bigint') return `${val}n`;
    if (typeof val !== 'object' || val === null) return val;
    if (stack.some((entry) => entry.original === val)) return '[Circular]';
    const out = toJsonFriendly(val);
    stack.push({ holder: out, original: val });
    return out;
  };
  try {
    return JSON.stringify(value, replacer, space) ?? String(value);
  } catch {
    // e.g. a getter or `toJSON` that throws
    return String(value);
  }
}

/**
 * Convert objects that `JSON.stringify` would turn into `{}`.
 *
 * Used by: {@link safeStringify}
 *
 * @private
 */
function toJsonFriendly(val: object): unknown {
  if (val instanceof Error) {
    return { name: val.name, message: val.message, stack: val.stack };
  }
  if (val instanceof Map || val instanceof Set) {
    return Array.from(val);
  }
  return val;
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default safeStringify;
