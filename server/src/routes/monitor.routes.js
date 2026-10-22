import { Router } from 'express';
import { handlePostMonitor, handleLivePoll } from '../controllers/monitor.controller.js';
import { validate } from '../middleware/validate.js';
import { monitorBatchSchema } from '../validators/monitor.schema.js';

const router = Router();

// Submit batch of API responses for monitoring & anomaly detection
router.post('/', validate(monitorBatchSchema, 'body'), handlePostMonitor);

// Trigger a live check against external test endpoints
router.post('/poll', handleLivePoll);

export default router;
