import { Router } from 'express';
import monitorRoutes from './monitor.routes.js';
import alertsRoutes from './alerts.routes.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Feature routers
router.use('/monitor', monitorRoutes);
router.use('/alerts', alertsRoutes);

export default router;
