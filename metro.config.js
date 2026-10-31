const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/* Expo's own Metro config, plus Debug IDs that tie the release bundle to its
   source maps — so a crash report reads as our files and lines. */
module.exports = getSentryExpoConfig(__dirname);
