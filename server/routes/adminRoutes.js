import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

// Pre-calculated bcrypt hash for 'madesh6361' with 12 salt rounds
const DEFAULT_ADMIN_HASH = '$2b$12$mejXTB7p7fBmQz0e74Xc8eeHunpZvBd0ioQQ8NB80kbM42lbuj9L.';

// 1. Strict Rate Limiter: Max 5 failed login attempts per IP per 15 minutes
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only failed attempts count toward the limit
  handler: (req, res) => {
    sendJsonResponse(res, 429, {
      success: false,
      message: 'Too many failed login attempts from this IP. Account locked for 15 minutes.'
    });
  }
});

// Helper for sending JSON responses consistently across Express & Node HTTP
function sendJsonResponse(res, statusCode, data) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  return res.end(JSON.stringify(data));
}

// Parse request body helper
async function parseRequestBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch (e) { return {}; }
    }
  }

  return new Promise((resolve) => {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (e) {
        resolve({});
      }
    });
    if (req.readableEnded || req.complete) {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (e) {
        resolve({});
      }
    }
  });
}

/**
 * Handle Admin Authentication Request
 */
export async function handleAdminLogin(req, res) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { success: false, message: 'Method not allowed' });
  }

  const payload = await parseRequestBody(req);
  const password = payload.password || payload.passcode || '';

  if (!password || typeof password !== 'string') {
    return sendJsonResponse(res, 400, { success: false, message: 'Password is required' });
  }

  const targetHash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_HASH;

  try {
    const isMatch = bcrypt.compareSync(password.trim(), targetHash);

    if (isMatch) {
      // Secure token generation for session verification
      const sessionToken = `mjrc_sec_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Authentication successful',
        token: sessionToken
      });
    } else {
      return sendJsonResponse(res, 401, {
        success: false,
        message: 'Invalid Security Password'
      });
    }
  } catch (err) {
    console.error('[Admin Login Auth Error]:', err);
    return sendJsonResponse(res, 500, {
      success: false,
      message: 'Server authentication processing error'
    });
  }
}
