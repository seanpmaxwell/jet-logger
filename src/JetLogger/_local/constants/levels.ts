import { Labels } from '../types';

import Palette, { type PaletteColors } from './styles/Palette';
import TextFormats from './styles/TextFormats';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

export const ANSI_RESET = '\x1b[0m';

export const TimestampStyle = textStyle(Palette.LightGreen);
export const ContentStyle = textStyle(Palette.White);

export const Levels = {
  Info: {
    label: 'INFO',
    consoleFn: 'info',
    ...textStyle(Palette.Green),
  },
  Important: {
    label: 'IMPORTANT',
    consoleFn: 'info',
    ...textStyle(Palette.Magenta, TextFormats.Bold, TextFormats.Underline),
  },
  Warning: {
    label: 'WARNING',
    consoleFn: 'warn',
    ...textStyle(Palette.Yellow),
  },
  Error: {
    label: 'ERROR',
    consoleFn: 'error',
    ...textStyle(Palette.Red),
  },
} as const satisfies Record<string, Level>;

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type Style = PaletteColors | TextFormats;

// A style in both output forms, built once so logging doesn't rebuild it
export interface TextStyle {
  ansi: string;
  css: string;
}

export interface Level extends TextStyle {
  label: Labels;
  // The `console` method used in browsers. `warn` and `error` also decide
  // which levels go to stderr in Node.
  consoleFn: 'info' | 'warn' | 'error';
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Combine styles into one ANSI escape sequence and one CSS declaration list.
 */
function textStyle(...styles: Style[]): TextStyle {
  return {
    ansi: `\x1b[${styles.map((style) => style.SGR).join(';')}m`,
    css: styles.map((style) => style.CSS).join('; '),
  };
}
