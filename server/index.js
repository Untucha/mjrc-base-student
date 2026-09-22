/**
 * Server API Router Entrypoint
 * Location: server/index.js
 */
import { handlePaymentRoutes } from './routes/paymentRoutes.js';

export default async function paymentRoutesMiddleware(req, res, next) {
  const url = req.url ? req.url.split('?')[0] : '';
  if (url.startsWith('/api/payment') || url.startsWith('/create-order') || url.startsWith('/verify-signature')) {
    await handlePaymentRoutes(req, res);
    return;
  }
  if (typeof next === 'function') next();
}

export { handlePaymentRoutes };
