import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import os from 'node:os';

import { logger } from './utils/logger.js';
import healthRouter from './routes/health.js';
import generateRouter from './routes/generate.js';
import tasksRouter from './routes/tasks.js';

const PORT = Number.parseInt(process.env.PORT, 10) || 3001;
const HOST = '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

app.use(healthRouter);
app.use(generateRouter);
app.use(tasksRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  logger.error('Unhandled error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

function getLanIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

app.listen(PORT, HOST, () => {
  logger.info(`JetDev backend listening on http://${HOST}:${PORT}`);
  logger.info(`  - Local:   http://localhost:${PORT}`);
  for (const ip of getLanIPs()) {
    logger.info(`  - Network: http://${ip}:${PORT}`);
  }
  logger.info(`  - CORS origin: ${CORS_ORIGIN}`);
});
