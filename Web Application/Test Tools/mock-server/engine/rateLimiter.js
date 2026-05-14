const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// In-memory rate limiter — resets on server restart.
// Protects /mock-api/* endpoints from abuse / DDoS.
module.exports = rateLimit({
  windowMs: 60 * 1000,  // 1-minute sliding window
  max: 100,             // max 100 requests per IP per window
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    return ipKeyGenerator(ip);
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfterMs: req.rateLimit?.resetTime
        ? req.rateLimit.resetTime - Date.now()
        : 60000
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
