export type RetryOptions = {
  retries: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, waitMs: number) => void | Promise<void>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultShouldRetry(): boolean {
  return true;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const retries = Math.max(0, options.retries);
  const baseDelayMs = Math.max(25, options.baseDelayMs ?? 300);
  const factor = Math.max(1, options.factor ?? 2);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 5000);
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error, attempt)) {
        throw error;
      }
      const wait = Math.min(maxDelayMs, Math.round(baseDelayMs * factor ** attempt));
      if (options.onRetry) await options.onRetry(error, attempt + 1, wait);
      await sleep(wait);
      attempt += 1;
    }
  }
}
