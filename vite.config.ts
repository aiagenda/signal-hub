// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Vercel deploynál a Cloudflare build plugin worker outputot eredményez,
  // ami NOT_FOUND-ot adhat. Itt letiltjuk.
  cloudflare: false,
  vite: {
    resolve: {
      alias: {
        "@signal-hub/tss-server-fn-adapter": path.join(
          root,
          "node_modules/@tanstack/start-client-core/dist/esm/client/ServerFunctionSerializationAdapter.js",
        ),
      },
    },
    plugins: [
      {
        name: "spa-hydrate-start-alias",
        enforce: "pre",
        resolveId(id, importer) {
          const normalized = id.replace(/\\/g, "/");
          const fromClientFolder =
            importer &&
            importer.replace(/\\/g, "/").includes("@tanstack/start-client-core/dist/esm/client/");
          if (
            fromClientFolder &&
            (normalized === "./hydrateStart.js" || normalized.endsWith("/client/hydrateStart.js"))
          ) {
            return path.join(root, "src/spa-hydrate-start.ts");
          }
          return undefined;
        },
      },
    ],
  },
});
