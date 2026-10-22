import { Router } from 'express';
import {
  handleGetAlerts,
  handleGetStats,
  handleResolveAlert,
  handleSendReport,
} from '../controllers/alerts.controller.js';
import { validate } from '../middleware/validate.js';
import { alertsQuerySchema, alertIdParamSchema } from '../validators/alerts.schema.js';

const router = Router();

// Fetch active or filtered anomalies
router.get('/', validate(alertsQuerySchema, 'query'), handleGetAlerts);

// Real-time summary statistics for dashboard cards
router.get('/stats', handleGetStats);

// Resolve an active alert
router.patch('/:id/resolve', validate(alertIdParamSchema, 'params'), handleResolveAlert);

// Manually trigger an email report for high/critical alerts
router.post('/report', handleSendReport);

export default router;
