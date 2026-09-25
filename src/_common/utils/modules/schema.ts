import { AnyFn, NullableFn } from '@cmn/types/misc';

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Is a `boolean` type
 */
function isBoolean<T>(val: T): val is Extract<T, boolean> {
  return typeof val === 'boolean';
}

/**
 * Is a `number` type
 */
function isNumber<T>(val: T): val is Extract<T, number> {
  return typeof val === 'number';
}

/**
 * Is a `string` type
 */
function isString<T>(val: T): val is Extract<T, string> {
  return typeof val === 'string';
}

/**
 * Is it a Non-Empty `string` primitive.
 */
function isNonEmptyString<T>(val: T): val is Extract<T, string> {
  return typeof val === 'string' && val.length > 0;
}

/**
 * Is not `undefined`
 */
function isDefined<T>(value: T): value is Exclude<T, undefined> {
  return value !== undefined;
}

/**
 * Is a non-null object.
 */
function isNonNullObject<T>(val: T): val is Extract<T, NonNullable<object>> {
  return typeof val === 'object' && val !== null;
}

/**
 * Is a `function`
 */
function isFunction<T>(val: T): val is Extract<T, AnyFn> {
  return typeof val === 'function';
}

/**
 * Is a `function` or `null`
 */
function isNullableFn<T>(val: T): val is Extract<T, NullableFn> {
  return val === null || typeof val === 'function';
}

// ================================= Parse ================================= //

/**
 * Parse a string or boolean to a boolean value. Strings other than "true" or
 * "false" (case-insensitive) return `undefined`.
 */
function parseBoolean(val: unknown): boolean | undefined {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const valLower = val.toLowerCase();
    if (valLower === 'true') return true;
    if (valLower === 'false') return false;
  }
  return undefined;
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default {
  is: {
    def: isDefined,
    bool: isBoolean,
    num: isNumber,
    str: isString,
    neStr: isNonEmptyString,
    obj: isNonNullObject,
    fn: isFunction,
    nul: {
      fn: isNullableFn,
    },
  },
  parse: {
    bool: parseBoolean,
  },
} as const;
