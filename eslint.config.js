const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

/** Hex literals belong in the token file alone (DESIGN_SPEC §1). */
const HEX_LITERAL = String.raw`^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$`;

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'android/**',
      'ios/**',
      'scripts/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': 'error',
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      'import/no-default-export': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text'],
              message: 'Use <Text> from @/ui/components — typography lives in the design system.',
            },
          ],
          patterns: [
            {
              group: ['../../*'],
              message: 'Use the @/ path alias instead of deep relative imports.',
            },
          ],
        },
      ],
    },
  },
  {
    // Logic functions stay short.
    files: ['**/*.ts'],
    rules: {
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // A component body is mostly declarative markup, so it gets a wider budget
    // than a logic function — anything longer is split into subcomponents.
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // The domain layer is pure: no React, no React Native, no Expo.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'expo',
                'expo-*',
                '@/ui/*',
                '@/features/*',
                '@/services/*',
              ],
              message: 'src/domain must stay free of platform and UI dependencies.',
            },
          ],
        },
      ],
    },
  },
  {
    // Features may not reach into each other; shared code moves up.
    files: ['src/features/*/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                'Import a feature only through its own barrel; shared code belongs in @/ui, @/domain or @/hooks.',
            },
          ],
        },
      ],
    },
  },
  {
    // Colour, spacing and radius literals live only in the token modules.
    files: ['src/ui/**/*.tsx', 'src/features/**/*.tsx', 'app/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${HEX_LITERAL}/]`,
          message: 'Hard-coded colours are forbidden — take the value from @/ui/tokens.',
        },
      ],
    },
  },
  {
    files: ['app/**/*.tsx', 'app/**/*.ts', '*.config.js', '*.config.ts'],
    rules: { 'import/no-default-export': 'off' },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
];
