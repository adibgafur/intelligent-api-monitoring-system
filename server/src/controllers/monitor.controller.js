import { asyncHandler } from '../utils/asyncHandler.js';
import { processBatch } from '../services/monitor.service.js';
import { pollExternalAPIs } from '../services/poller.service.js';

export const handlePostMonitor = asyncHandler(async (req, res) => {
  const result = await processBatch(req.body);
  res.status(201).json({
    success: true,
    ...result,
  });
});

export const handleLivePoll = asyncHandler(async (req, res) => {
  const telemetry = await pollExternalAPIs();
  const result = await processBatch(telemetry);
  res.status(201).json({
    success: true,
    polledCount: telemetry.length,
    ...result,
  });
});
