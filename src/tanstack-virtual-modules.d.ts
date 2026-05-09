declare module "#tanstack-start-entry";
declare module "#tanstack-router-entry";
declare module "#tanstack-start-plugin-adapters";

declare module "@signal-hub/tss-server-fn-adapter" {
  import type { AnySerializationAdapter } from "@tanstack/router-core";
  export const ServerFunctionSerializationAdapter: AnySerializationAdapter;
}
