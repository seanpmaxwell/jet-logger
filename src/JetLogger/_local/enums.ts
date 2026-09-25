import { type Enum, getEnumProps } from '@cmn/utils/modules/enum';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

// ================================= Modes ================================= //

const EModes = {
  CONSOLE: 'console',
  FILE: 'file',
  BROWSER: 'browser',
  CUSTOM: 'custom',
  OFF: 'off',
} as const;

export const Modes = {
  ...EModes,
  ...getEnumProps(EModes),
} as const;

export type EModes = typeof EModes;
export type Modes = Enum<EModes>;

// ================================ Formats ================================ //

const EFormats = {
  LINE: 'line',
  JSON: 'json',
} as const;

export const Formats = {
  ...EFormats,
  ...getEnumProps(EFormats),
} as const;

export type EFormats = typeof EFormats;
export type Formats = Enum<EFormats>;
