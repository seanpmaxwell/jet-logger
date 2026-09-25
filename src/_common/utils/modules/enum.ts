import schema from './schema';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

// Resolve a tuple of an objects keys
export type Enum<O extends BaseTypes> = {
  [K in keyof O]: O[K] extends string | number ? O[K] : never;
}[keyof O];

type BaseTypes = Record<string, number> | Record<string, string>;

interface EnumProps<T> {
  is: (val: unknown) => val is T[keyof T];
  enum: () => T;
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Get the validator-function to append to enums
 */
export function getEnumProps<T extends BaseTypes>(enumObj: T): EnumProps<T> {
  // Setup the `.is` function
  let values = Object.values(enumObj);
  values = values.filter((val) => {
    return schema.is.str(val) || schema.is.num(val);
  });
  const set = new Set(values);
  const isFn = (val: unknown): val is T[keyof T] => {
    return set.has(val);
  };
  // Setup the `.enum` function
  const enumFn = (): T => ({ ...enumObj });
  // Return
  return {
    is: isFn,
    enum: enumFn,
  };
}
