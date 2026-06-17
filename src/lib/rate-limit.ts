const rateMap = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let timestamps = rateMap.get(ip);
  if (!timestamps) {
    timestamps = [];
    rateMap.set(ip, timestamps);
  }

  const valid = timestamps.filter((t) => t > windowStart);
  valid.push(now);
  rateMap.set(ip, valid);

  if (rateMap.size > 10_000) {
    for (const [key, vals] of rateMap) {
      const clean = vals.filter((t) => t > Date.now() - WINDOW_MS);
      if (clean.length === 0) rateMap.delete(key);
      else rateMap.set(key, clean);
    }
  }

  return valid.length <= MAX_REQUESTS;
}
