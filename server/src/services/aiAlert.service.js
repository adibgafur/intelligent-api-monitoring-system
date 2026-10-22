import Groq from 'groq-sdk';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;
  if (!config.groqApiKey || config.groqApiKey.includes('your_groq_api_key')) {
    return null;
  }
  try {
    groqClient = new Groq({ apiKey: config.groqApiKey });
    return groqClient;
  } catch (err) {
    logger.warn(`Failed to initialize Groq client: ${err.message}`);
    return null;
  }
}

/**
 * Builds a deterministic human-readable alert message when LLM is unavailable,
 * rate-limited, or disabled. Guarantees 100% operational uptime.
 *
 * @param {Object} anomaly - Detected anomaly object
 * @returns {string} Human-readable alert message
 */
export function buildFallbackMessage(anomaly) {
  const { apiName, metrics, types } = anomaly;
  const { statusCode, responseTimeMs, recordsReturned } = metrics || {};
  const issues = [];

  if (types.includes('FAILED_REQUEST')) {
    issues.push(`failed with status ${statusCode}`);
  }
  if (types.includes('HIGH_RESPONSE_TIME')) {
    issues.push(`experienced high latency (${responseTimeMs}ms)`);
  }
  if (types.includes('ZERO_RECORDS')) {
    issues.push('returned 0 records');
  } else if (types.includes('MISSING_DATA')) {
    issues.push('returned missing or invalid record data');
  }

  let base = `${apiName} ${issues.join(' and ')}.`;
  
  // Suggest a likely cause
  if (statusCode >= 500) {
    return `${base} Possible service outage or backend failure.`;
  }
  if (statusCode === 404) {
    return `${base} Endpoint route may have changed or resource is missing.`;
  }
  if (types.includes('HIGH_RESPONSE_TIME')) {
    return `${base} Investigate server load or network bottleneck.`;
  }
  if (types.includes('ZERO_RECORDS') || types.includes('MISSING_DATA')) {
    return `${base} Possible database query or data pipeline issue.`;
  }

  return `${base} Possible outage or data issue.`;
}

/**
 * Generates an AI-powered human-readable alert message using Groq LLM (Llama 3.3).
 * Falls back seamlessly to the deterministic builder if Groq fails or times out.
 *
 * @param {Object} anomaly - Detected anomaly object
 * @returns {Promise<{ message: string, aiGenerated: boolean }>}
 */
export async function generateAlertMessage(anomaly) {
  const client = getGroqClient();

  if (!client) {
    logger.info(`[AI Alert] Groq API key not configured. Using deterministic fallback for ${anomaly.apiName}.`);
    return {
      message: buildFallbackMessage(anomaly),
      aiGenerated: false,
    };
  }

  const systemPrompt =
    'You are an SRE assistant for a healthcare company that integrates with external patient and operational data APIs. ' +
    'Write a concise alert for the operations team. Rules: 1-2 sentences, plain English, no markdown, no emojis. ' +
    'Mention the API name, the exact status code, record count and response time when relevant, then one likely cause or recommended next step. ' +
    'Do not invent facts beyond the data provided. Use wording like "Possible outage or data issue" when uncertain.';

  const userPrompt = `
Generate a concise alert for this anomaly:
${JSON.stringify({
  api_name: anomaly.apiName,
  severity: anomaly.severity,
  types: anomaly.types,
  metrics: anomaly.metrics,
  reasons: anomaly.reasons,
})}

Example Input: AppointmentAPI, status 500, records 0
Example Output: "AppointmentAPI failed with status 500 and returned 0 records. Possible outage or data issue."
`;

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.aiTimeoutMs);

  try {
    const response = await client.chat.completions.create(
      {
        model: config.groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 120,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    let content = response.choices?.[0]?.message?.content?.trim();
    if (content) {
      // Strip potential enclosing quotes
      content = content.replace(/^["']|["']$/g, '').trim();
      return { message: content, aiGenerated: true };
    }

    throw new Error('Groq returned empty response content');
  } catch (error) {
    clearTimeout(timeoutId);
    logger.warn(`[AI Alert] Groq call failed for ${anomaly.apiName}: ${error.message}. Using deterministic fallback.`);
    return {
      message: buildFallbackMessage(anomaly),
      aiGenerated: false,
    };
  }
}
