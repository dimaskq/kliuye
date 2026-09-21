/*
 * Expo's ambient types (CSS and asset imports, `process.env`, …). Expo writes
 * the same line into `expo-env.d.ts`, but only when a dev server starts, and
 * that file is git-ignored — so a clean CI checkout would not have it.
 */
/// <reference types="expo/types" />
