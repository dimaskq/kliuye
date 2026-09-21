const reactNativeResolver = require('@react-native/jest-preset/jest/resolver');

/**
 * React Native's resolver, plus the worklets fix: `react-native-worklets` ships
 * `.native.ts` sources that Jest must not pick up, so those extensions are
 * stripped for requests inside that package.
 */
module.exports = function resolve(request, options) {
  const insideWorklets =
    options.basedir.includes('react-native-worklets') || request.includes('react-native-worklets');
  const patched = insideWorklets
    ? { ...options, extensions: options.extensions?.filter((ext) => !ext.includes('native')) }
    : options;
  return reactNativeResolver(request, patched);
};
