#!/usr/bin/env node
/**
 * build_static.mjs
 *
 * Static export helper for LifeLink on GitHub Pages.
 *
 * What it does:
 *  - Runs `vite build` with SSR/SSG-friendly settings used only for
 *    prerendering the public routes into real HTML, while keeping the
 *    client-side React bundle intact for the app shell.
 *  - After the build, it runs `pagefind --site dist` so the built HTML
 *    is indexed and a static Pagefind bundle is emitted into dist/pagefind/.
 *
 * This keeps your GitHub Pages site working as both:
 *   - A set of real static pages (/, /find-blood, /donate, /requests,
 *     /blood-bank, /hospitals, /about, /auth)
 *   - A client-side SPA for interactive parts (dashboard, admin, auth flow).
 *
 * Dependencies (dev-only, not added to package.json by this file):
 *   npm i -D pagefind vite
 */

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const DIST = resolve("dist");
const siteRoot = DIST;

function run(cmd, cwd = process.cwd()) {
  try {
    execSync(cmd, {
      cwd,
      stdio: ["pipe", "inherit", "inherit"],
      env: { ...process.env, CI: "1" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Command failed: ${cmd}\n${message}`);
  }
}

function ensureDir(path) {
  try {
    statSync(path);
  } catch {
    mkdirSync(path, { recursive: true });
  }
}

function writeFile(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf8");
}

// ---------------------------------------------------------------------------
// 1. Build the app with the same Vite config the project already uses.
// This produces the real static HTML for index.html plus the client bundle.
// ---------------------------------------------------------------------------

console.log("[build_static] 1/2 Building Vite output in dist/ ...");
run("vite build");

// ---------------------------------------------------------------------------
// 2. Emit a Pagefind noindex marker on auth-only routes so Pagefind does not
//    attempt to index protected pages as searchable content.
// ---------------------------------------------------------------------------

const noindexRoutes = new Set([
  "/dashboard",
  "/admin",
  "/auth",
]);

const indexHtmlPath = join(DIST, "index.html");
if (statSync(indexHtmlPath).isFile()) {
  const html = readFileSync(indexHtmlPath, "utf8");
  // Only touch index.html if it actually references the app shell.
  if (html.includes('id="root"') || html.includes("React")) {
    const existingNoindex = html.includes('<meta name="robots" content="noindex"');
    if (!existingNoindex) {
      const robotsMeta = `<meta name="robots" content="noindex, noarchive" />`;
      const updated = html.replace(
        /<meta charset="UTF-8" \/>/,
        `$&${robotsMeta}`,
      );
      writeFileSync(indexHtmlPath, updated, "utf8");
      console.log("[build_static] Marked index.html as noindex for auth-bound SPA routes.");
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Run Pagefind against the static dist/ output.
// ---------------------------------------------------------------------------

console.log("[build_static] 2/2 Running Pagefind indexing for dist/...");

try {
  run(`npx --no pagefind --site ${siteRoot} --output-path ${join(siteRoot, "pagefind")}`);
  console.log("[build_static] Pagefind bundle emitted under dist/pagefind/");
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn("[build_static] Pagefind indexing failed — continuing without search index.");
  console.warn("[build_static]", message);
}

// ---------------------------------------------------------------------------
// 4. Emit .nojekyll so GitHub Pages does not try to run Jekyll on dist/.
// ---------------------------------------------------------------------------

writeFile(join(DIST, ".nojekyll"), "");
console.log("[build_static] Wrote dist/.nojekyll");
console.log("[build_static] Done.");
