import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Anomaly } from '../models/Anomaly.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.emailEnabled || !config.smtp.user || !config.smtp.pass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
  return transporter;
}

/**
 * Dispatches an email report for high and critical priority anomalies.
 *
 * @param {Array<Object>} anomalies
 */
export async function sendAnomalyReport(anomalies = []) {
  if (!config.emailEnabled) {
    logger.info('[Email Service] Email notifications are disabled (EMAIL_ENABLED=false).');
    return false;
  }

  const urgentAnomalies = anomalies.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );

  if (urgentAnomalies.length === 0) {
    return false;
  }

  const mailer = getTransporter();
  if (!mailer || !config.smtp.to) {
    logger.warn('[Email Service] Incomplete SMTP credentials or recipient in .env. Email skipped.');
    return false;
  }

  const criticalCount = urgentAnomalies.filter((a) => a.severity === 'critical').length;
  const highCount = urgentAnomalies.filter((a) => a.severity === 'high').length;
  const subject = `🚨 [API Monitor] ${urgentAnomalies.length} Urgent Anomalies (${criticalCount} Critical, ${highCount} High)`;

  const tableRows = urgentAnomalies
    .map(
      (a) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${a.apiName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: ${a.severity === 'critical' ? '#dc2626' : '#ea580c'}; font-weight: bold; text-transform: uppercase;">${a.severity}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${(a.types || []).join(', ')}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${a.aiMessage}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(a.createdAt || Date.now()).toLocaleTimeString()}</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #b91c1c;">API Monitoring Incident Alert</h2>
      <p>The automated API monitor detected the following high-priority anomalies:</p>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #ddd;">API Name</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Severity</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Issues</th>
            <th style="padding: 8px; border: 1px solid #ddd;">AI Diagnosis</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Time</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">Generated automatically by Intelligent API Monitoring System.</p>
    </div>
  `;

  try {
    await mailer.sendMail({
      from: config.smtp.from,
      to: config.smtp.to,
      subject,
      html,
    });

    logger.info(`[Email Service] Alert email sent successfully to ${config.smtp.to}`);

    // Mark emailSent = true on saved docs
    const ids = urgentAnomalies.map((a) => a._id).filter(Boolean);
    if (ids.length > 0) {
      await Anomaly.updateMany({ _id: { $in: ids } }, { emailSent: true });
    }

    return true;
  } catch (error) {
    logger.error(`[Email Service] Failed to send email alert: ${error.message}`);
    return false;
  }
}
