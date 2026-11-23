import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.min.js',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'warn',
    },
  },
  {
    files: ['src/presentation/cli.ts'],
    rules: {
      // console.log is the CLI's intended stdout interface.
      'no-console': 'off',
    },
  },
  {
    files: ['src/presentation/cli/**/*.ts'],
    rules: {
      // Console output is the CLI's user-facing stdout/stderr interface.
      'no-console': 'off',
    },
  },
];
