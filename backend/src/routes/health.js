import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'jetdev-backend',
    version: '0.1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
