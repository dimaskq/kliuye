/**
 * Just enough runtime validation for the three API responses the app reads.
 *
 * A schema library would do the same job, but its error-message locales alone
 * outweigh every screen of the app, and Metro cannot tree-shake them away. The
 * shapes here are fixed and small, so a handful of typed checks is the lighter
 * and equally strict choice: wrong types, missing keys and non-finite numbers
 * are rejected; unknown keys are dropped.
 */

/** Returns the checked value, or throws `Invalid` naming where it went wrong. */
export type Check<T> = (input: unknown, path: string) => T;

export type Infer<C> = C extends Check<infer T> ? T : never;

class Invalid extends Error {}

function fail(path: string, expected: string): never {
  throw new Invalid(`${path}: expected ${expected}`);
}

export const number: Check<number> = (input, path) =>
  typeof input === 'number' && Number.isFinite(input) ? input : fail(path, 'a number');

export const string: Check<string> = (input, path) =>
  typeof input === 'string' ? input : fail(path, 'a string');

export function nullable<T>(check: Check<T>): Check<T | null> {
  return (input, path) => (input === null ? null : check(input, path));
}

export function optional<T>(check: Check<T>): Check<T | undefined> {
  return (input, path) => (input === undefined ? undefined : check(input, path));
}

export function array<T>(check: Check<T>): Check<T[]> {
  return (input, path) =>
    Array.isArray(input)
      ? input.map((item, index) => check(item, `${path}[${index}]`))
      : fail(path, 'an array');
}

export function object<S extends Record<string, Check<unknown>>>(
  shape: S,
): Check<{ [K in keyof S]: Infer<S[K]> }> {
  return (input, path) => {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return fail(path, 'an object');
    }
    const source = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      output[key] = shape[key]!(source[key], `${path}.${key}`);
    }
    return output as { [K in keyof S]: Infer<S[K]> };
  };
}

export type SafeParseResult<T> = { success: true; data: T } | { success: false; error: string };

export type Schema<T> = { safeParse: (input: unknown) => SafeParseResult<T> };

/** Wraps a check in the `safeParse` shape the API clients expect. */
export function schema<T>(check: Check<T>): Schema<T> {
  return {
    safeParse: (input) => {
      try {
        return { success: true, data: check(input, '$') };
      } catch (error) {
        if (error instanceof Invalid) return { success: false, error: error.message };
        throw error;
      }
    },
  };
}
