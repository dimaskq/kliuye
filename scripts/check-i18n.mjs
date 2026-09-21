#!/usr/bin/env node
/**
 * Two guards, run in CI:
 *  1. Every language bundle describes exactly the same keys as the reference.
 *  2. No user-facing literal has been typed straight into a component.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = process.cwd();
const BUNDLE_DIR = 'src/i18n';
/** Ukrainian is the source of truth; every other bundle is compared to it. */
const REFERENCE = 'uk';
const SOURCE_DIRS = ['src', 'app'];
/** i18next appends a plural suffix, and the two languages pluralise differently. */
const PLURAL_SUFFIX = /_(one|two|few|many|other)$/;
/** Any Cyrillic run is user-facing copy; Latin strings are style values and ids. */
const CYRILLIC_LITERAL = /(['"`])[^'"`\n]*[Ѐ-ӿ][^'"`\n]*\1/g;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT = /\/\/[^\n]*/g;

/** Comments quote the design spec in Ukrainian; only real code is checked. */
function stripComments(source) {
  return source.replace(BLOCK_COMMENT, '').replace(LINE_COMMENT, '');
}

const failures = [];

function flatten(value, prefix = '') {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix === '' ? key : `${prefix}.${key}`),
  );
}

function keysOf(path) {
  const bundle = JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
  return new Set(flatten(bundle).map((key) => key.replace(PLURAL_SUFFIX, '')));
}

const languages = readdirSync(join(ROOT, BUNDLE_DIR))
  .filter((entry) => entry.endsWith('.json'))
  .map((entry) => entry.replace(/\.json$/, ''));

const reference = keysOf(`${BUNDLE_DIR}/${REFERENCE}.json`);
for (const language of languages) {
  if (language === REFERENCE) continue;
  const bundle = keysOf(`${BUNDLE_DIR}/${language}.json`);
  for (const key of reference) {
    if (!bundle.has(key)) failures.push(`Missing in ${language}.json: ${key}`);
  }
  for (const key of bundle) {
    if (!reference.has(key)) failures.push(`Not in ${REFERENCE}.json: ${language}.json ${key}`);
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return extname(path) === '.tsx' ? [path] : [];
  });
}

for (const dir of SOURCE_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    if (file.includes('__tests__')) continue;
    const source = stripComments(readFileSync(file, 'utf8'));
    for (const match of source.matchAll(CYRILLIC_LITERAL)) {
      failures.push(`Hard-coded copy in ${file.replace(`${ROOT}/`, '')}: ${match[0]}`);
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(
  `i18n OK — ${reference.size} keys × ${languages.length} languages (${languages.join(', ')}), no hard-coded copy.\n`,
);
