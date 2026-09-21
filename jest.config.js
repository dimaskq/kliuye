const expoPreset = require('jest-expo/jest-preset');

/**
 * jest-expo's transform only matches `.js`/`.ts`; MSW ships `.mjs` dependencies,
 * so the same Babel transform is extended to those extensions.
 */
const babelTransform = expoPreset.transform['\\.[jt]sx?$'];

const NON_TRANSPILED_ESM = [
  'msw',
  '@mswjs/.*',
  '@bundled-es-modules/.*',
  'rettime',
  '@open-draft/.*',
  'graphql',
  'path-to-regexp',
  'tough-cookie',
  'cookie',
  'statuses',
  'outvariant',
  'strict-event-emitter',
  'is-node-process',
  'headers-polyfill',
  'until-async',
  'lucide-react-native',
  'react-native-svg',
  'react-native-maps',
  '@tanstack/.*',
].join('|');

module.exports = {
  ...expoPreset,
  transform: { ...expoPreset.transform, '\\.[cm]js$': babelTransform },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'node'],
  /* Worklets ships .native.ts sources that Jest must not pick; its resolver strips them. */
  resolver: '<rootDir>/tests/jest-resolver.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transformIgnorePatterns: [
    `node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|native-base|${NON_TRANSPILED_ESM}))`,
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
    '!src/i18n/**',
    /* Browser-only files need a DOM; they are covered by the web export smoke build. */
    '!src/**/*.web.tsx',
    '!src/**/*.web.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/domain/**/*.ts': { branches: 100, functions: 100, lines: 100, statements: 100 },
    'src/services/**/*.ts': { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    /* jest-expo resolves the react-native export condition, which has no node entry. */
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
  },
};
