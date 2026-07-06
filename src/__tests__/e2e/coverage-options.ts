import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(import.meta.url), '../../../..');

// shared between the per-test fixture (adds coverage data, one process per
// worker) and global-setup/global-teardown (clean cache before the run,
// generate the report after) - all three must use the exact same options so
// they read/write the same on-disk cache, per monocart-coverage-reports'
// multiprocessing model.
export const coverageOptions = {
  name: 'quill-table-up e2e coverage',
  outputDir: resolve(projectRoot, 'coverage', 'e2e'),
  reports: ['v8', 'console-details'],
  // Restrict to the entry (script) level first: the demo page also loads
  // Quill itself from a CDN, and Quill's own sourcemap happens to use the
  // same `formats/`/`modules/` folder names as this project's own source,
  // so a path-shape-only filter can't tell them apart. Only `index.umd.js`
  // is this project's own build output.
  entryFilter: '**/index.umd.js',
  // Within that entry, keep only our own source (not bundled vendor code
  // like quill-delta/@floating-ui that got inlined into the same bundle).
  sourceFilter: (sourcePath: string) => sourcePath.startsWith('src/'),
  // The build's sourcemap doesn't embed `sourcesContent` for every file (a
  // build-tool quirk, not something this project controls) - MCR's own
  // fallback (reading the missing ones from disk, resolved relative to the
  // sourcemap's own URL) fails for most of them, because that resolution
  // treats the result as an http(s) URL rather than a filesystem path, so it
  // silently drops those files from the report entirely (not "0% covered",
  // just absent). Patch the sourcemap ourselves before MCR ever sees it:
  // backfill any missing `sourcesContent` entry by reading straight from the
  // `src/...` suffix against the known project root, sidestepping whatever
  // relative-path resolution MCR would otherwise attempt.
  sourceMapResolver: async (url: string, defaultResolver: Function) => {
    const map = await (defaultResolver as (url: string) => Promise<any>)(url);
    if (map?.sources && map.sourcesContent) {
      for (const [i, source] of map.sources.entries()) {
        if (typeof map.sourcesContent[i] === 'string') continue;
        const match = (source as string).match(/(src[/\\].*)$/);
        if (!match) continue;
        try {
          map.sourcesContent[i] = readFileSync(resolve(projectRoot, match[1]), 'utf8');
        }
        catch {}
      }
    }
    return map;
  },
};
