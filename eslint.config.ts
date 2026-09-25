import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default [
  {
    // Build output, dependencies, throwaway `.tmp.js` scratch files, and the
    // GIF generator from another project kept for reference.
    ignores: ['lib/', 'node_modules/', '**/*.tmp.js', 'demo-studio/example/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Turns off stylistic rules that would conflict with Prettier
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      eqeqeq: 'error',
      'no-unused-vars': 'off',
      'no-console': 'warn',
      '@typescript-eslint/no-extraneous-class': 'error',
      // A promise nobody awaits or handles can crash the process on rejection
      '@typescript-eslint/no-floating-promises': 'error',
      // Class members must say `public`, `protected`, or `private`
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        { accessibility: 'explicit' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
];
