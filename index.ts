/*
 * The app's entry. Android can start the app with no screen at all just to run
 * the bite-alert refresh, so the task is defined here, in the global scope of
 * the entry module, rather than by a screen that would never mount.
 */
import 'expo-router/entry';

import { defineBiteAlertTask } from '@/features/alerts';

defineBiteAlertTask();
