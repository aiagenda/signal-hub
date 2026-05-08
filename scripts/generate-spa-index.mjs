import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const clientDir = resolve(root, "dist/client");
const assetsDir = resolve(clientDir, "assets");

if (!existsSync(assetsDir)) {
  console.warn("[generate-spa-index] dist/client/assets not found, skipping");
  process.exit(0);
}

const files = readdirSync(assetsDir);
const css = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
const indexEntries = files.filter((f) => f.startsWith("index-") && f.endsWith(".js")).sort();

if (indexEntries.length === 0) {
  console.warn("[generate-spa-index] no index-*.js bundle found, skipping");
  process.exit(0);
}

const entry = indexEntries[indexEntries.length - 1];

const title = "Budapest Signal";
const html = `<!doctype html>
<html lang="hu">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    ${css ? `<link rel="stylesheet" href="/assets/${css}" />` : ""}
  </head>
  <body>
    <div id="__root"></div>
    <script type="module" src="/assets/${entry}"></script>
  </body>
</html>
`;

writeFileSync(resolve(clientDir, "index.html"), html, "utf8");
console.log(`[generate-spa-index] wrote dist/client/index.html (entry=${entry})`);
