import OpenAI from "openai";
import type { AgentEnv } from "./env.js";

export function createOpenAIClient(env: AgentEnv) {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
