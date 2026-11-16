#!/usr/bin/env node
/**
 * Precache budget guard.
 *
 * The service worker's precache is paid for on the first visit, before the user
 * has asked for anything, so it must stay limited to the app shell (HTML, entry
 * JS/CSS, small public icons). Route chunks, vendor bundles and images are
 * runtime-cached on demand (see `runtimeCaching` in vite.config.ts).
 *
 * This runs after `vite build` because vite-plugin-pwa generates dist/sw.js at
 * the very end of the build. It fails the build when:
 *   - a shell file exceeds the per-file cap (Workbox would silently drop it),
 *   - the total install payload exceeds the total cap,
 *   - a shell file is missing from the precache, or
 *   - the precache contains something that is not part of the shell.
 */
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(process.cwd(), "dist");
const SW = path.join(DIST, "sw.js");

const MAX_FILE_KB = Number(process.env.PRECACHE_MAX_FILE_KB ?? 512);
const MAX_TOTAL_KB = Number(process.env.PRECACHE_MAX_TOTAL_KB ?? 700);

// Must mirror the `workbox.globPatterns` in vite.config.ts.
const SHELL_PATTERNS = [
  /^index\.html$/,
  /^manifest\.webmanifest$/,
  /^assets\/index-[\w-]+\.js$/,
  /^assets\/index-[\w-]+\.css$/,
  /^favicon\.ico$/,
];

const isShell = (url) => SHELL_PATTERNS.some((pattern) => pattern.test(url));
const sizeOf = (url) => {
  const file = path.join(DIST, url);
  return fs.existsSync(file) ? fs.statSync(file).size : null;
};

if (!fs.existsSync(SW)) {
  console.error("[precache] dist/sw.js not found - did the PWA plugin run?");
  process.exit(1);
}

const precached = [
  ...new Set(
    [...fs.readFileSync(SW, "utf8").matchAll(/url:"([^"]+)"/g)]
      .map((match) => match[1])
      .filter((url) => !url.startsWith("http"))
  ),
];

const shellFiles = fs
  .readdirSync(path.join(DIST, "assets"))
  .map((name) => `assets/${name}`)
  .concat(fs.readdirSync(DIST).filter((name) => !name.startsWith("assets")))
  .filter(isShell);

const problems = [];

for (const url of shellFiles) {
  const bytes = sizeOf(url);
  if (bytes === null) continue;
  if (bytes / 1024 > MAX_FILE_KB) {
    problems.push(
      `${url} is ${Math.round(bytes / 1024)} kB, over the ${MAX_FILE_KB} kB per-file precache budget`
    );
  }
  if (!precached.includes(url)) {
    problems.push(`${url} is missing from the precache (dropped by the size cap, or the globs changed)`);
  }
}

const unexpected = precached.filter((url) => !isShell(url));
if (unexpected.length > 0) {
  problems.push(
    `precache contains non-shell files: ${unexpected.slice(0, 5).join(", ")}${
      unexpected.length > 5 ? ` (+${unexpected.length - 5} more)` : ""
    } — route chunks belong in runtime caching`
  );
}

const totalKB = precached.reduce((sum, url) => sum + (sizeOf(url) ?? 0), 0) / 1024;
if (totalKB > MAX_TOTAL_KB) {
  problems.push(`${totalKB.toFixed(0)} kB across ${precached.length} entries, over the ${MAX_TOTAL_KB} kB install budget`);
}

if (problems.length > 0) {
  console.error("[precache] budget check failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "\nAdjust the shell globs in vite.config.ts, or raise the limits deliberately " +
      "(PRECACHE_MAX_FILE_KB / PRECACHE_MAX_TOTAL_KB)."
  );
  process.exit(1);
}

console.log(
  `[precache] ${precached.length} shell entries, ${totalKB.toFixed(0)} kB ` +
    `(budget ${MAX_TOTAL_KB} kB total / ${MAX_FILE_KB} kB per file)`
);
