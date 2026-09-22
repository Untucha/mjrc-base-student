import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getWhatsAppStatus, sendWhatsAppMessage, disconnectWhatsAppSession, forceResetWhatsAppSession } from './server/whatsappBridge.js';
import { handlePaymentRoutes } from './server/routes/paymentRoutes.js';

const liveSyncPlugin = () => {
  return {
    name: 'mjrc-live-sync-bridge',
    configureServer(server) {
      server.ws.on('mjrc:sync_mutation', (data) => {
        server.ws.send({
          type: 'custom',
          event: 'mjrc:sync_mutation_broadcast',
          data: data
        });
      });
    }
  };
};

const paymentDaemonPlugin = () => {
  return {
    name: 'mjrc-payment-daemon-bridge',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url.startsWith('/api/payment/')) {
          await handlePaymentRoutes(req, res);
          return;
        }
        next();
      });
    }
  };
};

const whatsappDaemonPlugin = () => {
  return {
    name: 'mjrc-whatsapp-daemon-bridge',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        
        if ((url === '/api/whatsapp/qr' || url === '/api/whatsapp/status') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(getWhatsAppStatus()));
          return;
        }

        if ((url === '/api/whatsapp/disconnect' || url === '/api/whatsapp/force-reset') && req.method === 'POST') {
          const result = await forceResetWhatsAppSession();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
          return;
        }

        if (url === '/api/whatsapp/send' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const mediaUrl = payload.image || payload.mediaUrl || payload.bannerUrl || null;
              const priority = payload.priority || (payload.isOtp || (payload.text && String(payload.text).toLowerCase().includes('otp')) ? 'high' : 'normal');
              const dispatchRes = await sendWhatsAppMessage(payload.phone, payload.text, mediaUrl, priority);
              res.statusCode = dispatchRes.success ? 200 : (dispatchRes.statusCode || 503);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(dispatchRes));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [react(), liveSyncPlugin(), whatsappDaemonPlugin(), paymentDaemonPlugin()],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    cors: true,
    proxy: {
      '/api/whatsapp': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
