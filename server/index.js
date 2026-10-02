/**
 * Server API Router Entrypoint
 * Location: server/index.js
 */
import helmet from 'helmet';
import { handlePaymentRoutes } from './routes/paymentRoutes.js';
import { handleAdminLogin, loginRateLimiter } from './routes/adminRoutes.js';

// Apply Helmet Security Headers
export const configureSecurityHeaders = (req, res) => {
  if (typeof res.setHeader === 'function') {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.shiprocket.in https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss:;"
    );
  }
};

export default async function apiRoutesMiddleware(req, res, next) {
  configureSecurityHeaders(req, res);
  const url = req.url ? req.url.split('?')[0] : '';

  // Return standard 404 for direct attempts to common admin probes
  if (url === '/admin' || url === '/login' || url === '/admin-login') {
    if (typeof res.setHeader === 'function') res.setHeader('Content-Type', 'text/html');
    res.statusCode = 404;
    return res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>');
  }

  // Admin Auth Route with Rate Limiting
  if (url === '/api/admin/login' || url === '/api/manage-console-mjx/login') {
    return loginRateLimiter(req, res, async () => {
      await handleAdminLogin(req, res);
    });
  }

  // Payment Routes
  if (url.startsWith('/api/payment') || url.startsWith('/create-order') || url.startsWith('/verify-signature')) {
    await handlePaymentRoutes(req, res);
    return;
  }

  if (typeof next === 'function') next();
}

export { handlePaymentRoutes, handleAdminLogin, loginRateLimiter };
