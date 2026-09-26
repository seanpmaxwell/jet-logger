import schema from './modules/schema';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type BaseTypes = Record<string, number> | Record<string, string>;

// Resolve a tuple of an objects keys
export type Enum<O extends BaseTypes> = {
  [K in keyof O]: O[K] extends string | number ? O[K] : never;
}[keyof O];

interface EnumUtils<T> {
  is: (val: unknown) => val is T[keyof T];
  table: () => T;
}

export type EnumTable<T> = T extends EnumUtils<infer P> ? P : never;

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Some helper functions for Lookup Tables.
 */
export function getEnumUtils<T extends BaseTypes>(tableObj: T): EnumUtils<T> {
  // Setup the `.is` function
  let values = Object.values(tableObj);
  values = values.filter((val) => {
    return schema.is.str(val) || schema.is.num(val);
  });
  const set = new Set(values);
  const isFn = (val: unknown): val is T[keyof T] => {
    return set.has(val);
  };
  // Return
  return {
    is: isFn,
    table: () => ({ ...tableObj }),
  };
}
