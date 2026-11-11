// Simple in-memory rate limiter (IP-based, fixed window).
// NOTE: On Vercel serverless each function instance has its own memory, so
// limits are per-instance rather than cluster-wide. Still a meaningful
// deterrent against brute-force / credential-stuffing on auth endpoints.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;          // requests per window per IP

const attempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // x-forwarded-for: client, proxy1, proxy2 — take the leftmost (client)
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function cleanup() {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetAt) attempts.delete(key);
  }
}

export function rateLimit(req) {
  const key = getClientIp(req);
  const now = Date.now();

  let record = attempts.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
  }

  record.count += 1;
  attempts.set(key, record);

  // Occasional cleanup to avoid unbounded growth.
  if (attempts.size > 1000) cleanup();

  return {
    allowed: record.count <= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - record.count),
    resetAt: record.resetAt,
  };
}

export { WINDOW_MS, MAX_ATTEMPTS };
