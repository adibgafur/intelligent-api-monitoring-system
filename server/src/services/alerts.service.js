import { Anomaly } from '../models/Anomaly.js';
import { AppError } from '../utils/AppError.js';

/**
 * Queries alerts with filtering, search, and pagination.
 */
export async function getAlerts({ severity, api_name, status = 'active', page = 1, limit = 50 }) {
  const query = {};

  if (status !== 'all') {
    query.status = status;
  }

  if (severity) {
    query.severity = severity;
  }

  if (api_name) {
    query.apiName = { $regex: api_name.trim(), $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [total, alerts] = await Promise.all([
    Anomaly.countDocuments(query),
    Anomaly.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    alerts,
  };
}

/**
 * Calculates real-time alert statistics for the dashboard cards.
 */
export async function getAlertStats() {
  const [severityStats, apiStats, totalActive, totalResolved] = await Promise.all([
    // Active counts grouped by severity
    Anomaly.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
    // Top active APIs with anomalies
    Anomaly.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$apiName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Anomaly.countDocuments({ status: 'active' }),
    Anomaly.countDocuments({ status: 'resolved' }),
  ]);

  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  severityStats.forEach((item) => {
    if (item._id && severityCounts[item._id] !== undefined) {
      severityCounts[item._id] = item.count;
    }
  });

  return {
    totalActive,
    totalResolved,
    ...severityCounts,
    byApi: apiStats.map((item) => ({ apiName: item._id, count: item.count })),
  };
}

/**
 * Resolves an active anomaly by ID.
 */
export async function resolveAlert(id) {
  const anomaly = await Anomaly.findById(id);

  if (!anomaly) {
    throw new AppError(`Alert with ID "${id}" not found`, 404);
  }

  anomaly.status = 'resolved';
  anomaly.resolvedAt = new Date();
  await anomaly.save();

  return anomaly;
}
