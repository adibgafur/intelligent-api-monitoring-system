import { asyncHandler } from '../utils/asyncHandler.js';
import { getAlerts, getAlertStats, resolveAlert } from '../services/alerts.service.js';
import { sendAnomalyReport } from '../services/email.service.js';
import { Anomaly } from '../models/Anomaly.js';

export const handleGetAlerts = asyncHandler(async (req, res) => {
  const result = await getAlerts(req.query);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const handleGetStats = asyncHandler(async (req, res) => {
  const stats = await getAlertStats();
  res.status(200).json({
    success: true,
    ...stats,
  });
});

export const handleResolveAlert = asyncHandler(async (req, res) => {
  const updated = await resolveAlert(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Alert resolved successfully',
    alert: updated,
  });
});

export const handleSendReport = asyncHandler(async (req, res) => {
  const urgent = await Anomaly.find({
    status: 'active',
    severity: { $in: ['critical', 'high'] },
  }).sort({ createdAt: -1 });

  const sent = await sendAnomalyReport(urgent);

  res.status(200).json({
    success: true,
    message: sent ? 'Alert email dispatched successfully' : 'No urgent alerts or email disabled',
    count: urgent.length,
  });
});
