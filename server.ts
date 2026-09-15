import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { loadAndValidateConfig } from './server/config.js';
import { initDatabase } from './server/db.js';
import {
  securityHeadersMiddleware,
  corsMiddleware,
  rateLimiterMiddleware,
} from './server/security.js';
import { apiRouter } from './server/routes.js';
import { runRetentionCleanup } from './server/retention_service.js';

async function startServer() {
  let config: ReturnType<typeof loadAndValidateConfig>;

  // 1. Startup validation (Fail-fast rule)
  try {
    config = loadAndValidateConfig();
    console.log(`[PathFinder Health] Configuration snapshot verified. Active rules: ${config.redFlagsConfig.rules.length}`);
    initDatabase(config.dbPath);
    console.log(`[PathFinder Health] Database initialized at: ${config.dbPath}`);

    // Run initial data retention cleanup
    const retention = runRetentionCleanup();
    console.log(`[PathFinder Health] Retention check executed. Purged ${retention.records_deleted} records older than ${config.retentionDays} days.`);
  } catch (err: any) {
    console.error(`[PathFinder Health] FATAL STARTUP FAILURE:`, err.message);
    process.exit(1);
  }

  const app = express();
  const PORT = 3000;

  // Body parser with size limits
  app.use(express.json({ limit: '1mb' }));

  // Determine API mount path from config
  let apiMountPath = '/api/v1';
  try {
    if (config.apiBaseUrl.startsWith('http://') || config.apiBaseUrl.startsWith('https://')) {
      apiMountPath = new URL(config.apiBaseUrl).pathname;
    } else if (config.apiBaseUrl.startsWith('/')) {
      apiMountPath = config.apiBaseUrl;
    }
  } catch {
    apiMountPath = '/api/v1';
  }

  // Security & Rate Limiting Middleware
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);
  app.use('/api', rateLimiterMiddleware);
  if (apiMountPath !== '/api/v1' && !apiMountPath.startsWith('/api')) {
    app.use(apiMountPath, rateLimiterMiddleware);
  }

  // Authoritative API routes FIRST
  app.use(apiMountPath, apiRouter);
  if (apiMountPath !== '/api/v1') {
    app.use('/api/v1', apiRouter);
  }

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PathFinder Health server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
