type LogLevel = "info" | "warn" | "error" | "debug";

function line(level: LogLevel, msg: string, extra?: Record<string, unknown>) {
  const base = { ts: new Date().toISOString(), level, msg, ...extra };
  const text = JSON.stringify(base);
  if (level === "error") {
    console.error(text);
  } else {
    console.log(text);
  }
}

export const log = {
  info: (msg: string, extra?: Record<string, unknown>) => line("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => line("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => line("error", msg, extra),
  debug: (msg: string, extra?: Record<string, unknown>) => line("debug", msg, extra),
};
