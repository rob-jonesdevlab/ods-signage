/**
 * Rate Limiting Middleware
 * Protects API endpoints from brute force and DoS attacks
 */

const rateLimit = require('express-rate-limit');

// General API rate limiter - 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Auth limiter for pairing/login - 100 attempts per 5 minutes (relaxed for testing)
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Very high limit for E2E testing
    message: {
        error: 'Rate limit reached, try again.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Content upload limiter - 20 uploads per hour
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        error: 'Upload limit reached, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    authLimiter,
    uploadLimiter
};
