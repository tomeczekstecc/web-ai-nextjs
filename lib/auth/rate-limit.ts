import "server-only";

type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __authRateLimits?: Map<string, RateLimitRecord>;
};

const store = globalForRateLimit.__authRateLimits ?? new Map<string, RateLimitRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.__authRateLimits = store;
}

export function isRateLimited(key: string, policy: RateLimitPolicy) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + policy.windowMs,
    });

    return false;
  }

  if (current.count >= policy.limit) {
    return true;
  }

  store.set(key, {
    ...current,
    count: current.count + 1,
  });

  return false;
}
