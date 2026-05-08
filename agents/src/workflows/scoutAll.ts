import "dotenv/config";

import { loadEnv } from "../config/env.js";
import { log } from "../utils/logger.js";
import {
  parseScoutParallelArgs,
  runScoutAllParallel,
  runScoutAllSequential,
} from "./scoutAllCore.js";

async function main() {
  const env = loadEnv();
  const { parallel, concurrency } = parseScoutParallelArgs(process.argv);

  try {
    if (parallel) {
      await runScoutAllParallel(env, concurrency);
    } else {
      await runScoutAllSequential(env);
    }
    process.exitCode = 0;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log.error("scout_all_fatal", { message });
    process.exitCode = 1;
  }
}

main();
