import { createClient } from "@supabase/supabase-js";
import type { AgentEnv } from "./env.js";

export function createServiceSupabaseClient(env: AgentEnv) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
