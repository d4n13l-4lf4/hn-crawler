const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
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
