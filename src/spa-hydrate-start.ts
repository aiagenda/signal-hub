import { ServerFunctionSerializationAdapter } from "@signal-hub/tss-server-fn-adapter";
import { hydrate } from "@tanstack/router-core/ssr/client";
import { startInstance } from "#tanstack-start-entry";
import { hasPluginAdapters, pluginSerializationAdapters } from "#tanstack-start-plugin-adapters";
import { getRouter } from "#tanstack-router-entry";

declare global {
  interface Window {
    $_TSR?: unknown;
    __TSS_START_OPTIONS__?: unknown;
  }
}

/**
 * Mirrors `@tanstack/start-client-core` hydrateStart, but supports **static SPA** hosts (e.g. Vercel
 * `dist/client` + generated index.html): there is no SSR HTML and thus no `window.$_TSR`.
 * In that case we bootstrap with `router.load()` instead of SSR `hydrate()`.
 */
export async function hydrateStart() {
  const router = await getRouter();
  let serializationAdapters;
  if (startInstance) {
    const startOptions = await startInstance.getOptions();
    startOptions.serializationAdapters = startOptions.serializationAdapters ?? [];
    window.__TSS_START_OPTIONS__ = startOptions;
    serializationAdapters = startOptions.serializationAdapters;
    router.options.defaultSsr = startOptions.defaultSsr;
  } else {
    serializationAdapters = [];
    window.__TSS_START_OPTIONS__ = { serializationAdapters };
  }
  if (hasPluginAdapters) serializationAdapters.push(...pluginSerializationAdapters);
  serializationAdapters.push(ServerFunctionSerializationAdapter);
  if (router.options.serializationAdapters)
    serializationAdapters.push(...router.options.serializationAdapters);
  router.update({
    basepath: process.env.TSS_ROUTER_BASEPATH,
    serializationAdapters,
  });
  if (!router.stores.matchesId.get().length) {
    if (typeof window !== "undefined" && !window.$_TSR) {
      await router.load();
    } else {
      await hydrate(router);
    }
  }
  return router;
}
