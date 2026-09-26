import { type Enum, getEnumUtils } from '@src/_common/utils/enum.inv';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

// ---- `Modes` table
const ModesTable = {
  CONSOLE: 'console',
  FILE: 'file',
  BROWSER: 'browser',
  CUSTOM: 'custom',
  OFF: 'off',
} as const;
type ModesTable = typeof ModesTable;

// ---- `Modes` enum
export const Modes = {
  ...ModesTable,
  ...getEnumUtils(ModesTable),
} as const;
export type Modes = Enum<ModesTable>;

// ---- `Formats` table
const FormatsTable = {
  LINE: 'line',
  JSON: 'json',
} as const;
type FormatsTable = typeof FormatsTable;

// ---- `Formats` enum
export const Formats = {
  ...FormatsTable,
  ...getEnumUtils(FormatsTable),
} as const;
export type Formats = Enum<FormatsTable>;
