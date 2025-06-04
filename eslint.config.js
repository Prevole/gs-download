import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: ['dist/**/*'],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        fetch: 'readonly',
        node: true,
        process: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
        setTimeout: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import': importPlugin,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.strict.rules,
      'no-console': 'off', // Allow console for this CLI application
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }], // Custom pattern for unused vars

      // Import plugin rules
      'import/no-namespace': 'error', // Prevent wildcard imports (import * as foo)
      'import/order': ['error', { 'alphabetize': { 'order': 'asc' } }], // Enforce import order
      'import/no-unresolved': 'off', // Disabled to allow imports with .js extensions in TypeScript files
      'import/named': 'error', // Ensure named imports correspond to named exports
      'import/default': 'error', // Ensure default import corresponds to a default export
      'import/no-duplicates': 'error', // Prevent importing the same module multiple times
    },
  },
];
