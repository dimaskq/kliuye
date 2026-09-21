#!/usr/bin/env node
/**
 * Regenerates src/features/about/licenses.json from the installed dependency
 * tree. STORE_REVIEW.md §4 requires this page to be generated, not hand-kept.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUTPUT = join(ROOT, 'src/features/about/licenses.json');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

function readManifest(name) {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'node_modules', name, 'package.json'), 'utf8'));
  } catch {
    return undefined;
  }
}

function publisherOf(manifest) {
  const { author } = manifest;
  if (typeof author === 'string') return author;
  if (author && typeof author.name === 'string') return author.name;
  return undefined;
}

const entries = Object.keys(pkg.dependencies ?? {})
  .sort()
  .flatMap((name) => {
    const manifest = readManifest(name);
    if (manifest === undefined) return [];
    const publisher = publisherOf(manifest);
    return [
      {
        name,
        version: manifest.version ?? 'unknown',
        license: manifest.license ?? 'see repository',
        ...(publisher === undefined ? {} : { publisher }),
      },
    ];
  });

// Fonts are vendored rather than installed, so they are appended explicitly.
entries.push(
  { name: 'Rubik', version: 'OFL 1.1', license: 'OFL-1.1', publisher: 'The Rubik Project Authors' },
  { name: 'Figtree', version: 'OFL 1.1', license: 'OFL-1.1', publisher: 'Erik Kennedy' },
  { name: 'Lucide icons', version: 'ISC', license: 'ISC', publisher: 'Lucide Contributors' },
);

writeFileSync(OUTPUT, `${JSON.stringify(entries, null, 2)}\n`);
process.stdout.write(`Wrote ${entries.length} licence entries to ${OUTPUT}\n`);
