# AI Prompts & Engineering Log

This document records the prompts, system designs, and instructions used during the development of the **Intelligent API Monitoring & Alert System**, as required by the Technical Interview assignment guidelines.

---

## 1. Master System Architecture Prompt

```markdown
Role: Senior Distributed Systems Architect & Lead Backend Engineer

Goal:
Design and implement an "Intelligent API Monitoring & Alert System" that:
1. Proactively monitors external API responses (telemetry payload).
2. Detects anomalies:
   - High response time (> 3000ms threshold)
   - Failed requests (HTTP status >= 400, 5xx server errors, 4xx client errors)
   - Data anomalies (Zero records returned on 200 OK, or missing/invalid record counts)
3. Generates human-readable, actionable alerts using an LLM (Groq Llama 3.3).
4. Stores detected anomalies in MongoDB Atlas.
5. Exposes a clean REST API (/monitor, /alerts, /health).
6. Displays real-time alerts in an intuitive, responsive React dashboard.

Key Architecture Constraints:
- Keep the project modular, clean, and directly explainable in a 5-10 minute interview.
- Maintain 100% operational reliability: if the LLM times out or is rate-limited, provide a deterministic template fallback so alerts are never lost.
- Prevent alert storms: de-duplicate repeated errors within a configurable time window (10 minutes) by incrementing an occurrences counter.
- Concurrency limit: handle batches of multiple APIs safely using Promise.allSettled and p-limit.
```

---

## 2. Detection Engine Prompt (Pure Business Logic)

```markdown
Create a pure function detector service in Node.js (detector.service.js) without any database or network I/O so that it can be tested in isolation.

Rules to enforce:
1. HIGH_RESPONSE_TIME:
   - Trigger when response_time_ms > 3000ms.
   - Severity: 'high' if response_time_ms > 6000ms (2x threshold), else 'medium'.
2. FAILED_REQUEST:
   - Trigger when status_code >= 400 or invalid status.
   - Severity: 'critical' if status_code >= 500 (server crash/outage), 'high' if 4xx.
3. ZERO_RECORDS:
   - Trigger when records_returned === 0.
   - Severity: 'high' if status was 200 OK (unexpected empty data), else 'medium'.
4. MISSING_DATA:
   - Trigger when records_returned is null, undefined, or negative.
   - Severity: 'high'.
5. Multi-anomaly aggregation:
   - If an API triggers multiple rules (e.g. AppointmentAPI: 5500ms + 500 error + 0 records), combine all triggered types into a single anomaly object with the highest severity (critical).
```

---

## 3. Groq LLM Prompt Design

### System Prompt
```text
You are an SRE assistant for a healthcare company that integrates with external patient and operational data APIs. Write a concise alert for the operations team. Rules: 1-2 sentences, plain English, no markdown, no emojis. Mention the API name, the exact status code, record count and response time when relevant, then one likely cause or recommended next step. Do not invent facts beyond the data provided. Use wording like "Possible outage or data issue" when uncertain.
```

### User Prompt Template
```text
Generate a concise alert for this anomaly:
{
  "api_name": "{{apiName}}",
  "severity": "{{severity}}",
  "types": {{types}},
  "metrics": {{metrics}},
  "reasons": {{reasons}}
}

Example Input: AppointmentAPI, status 500, records 0
Example Output: "AppointmentAPI failed with status 500 and returned 0 records. Possible outage or data issue."
```

### Fallback Deterministic Builder Prompt (Zero Downtime Guarantee)
```javascript
// Rule-based fallback when Groq LLM API is unavailable, rate-limited, or disabled
function buildFallbackMessage(anomaly) {
  // Combines API name, HTTP status code, latency, and returned records into
  // a crisp 1-2 sentence alert.
}
```

---

## 4. Frontend UI/UX Prompt

```markdown
Create a modern, clean, responsive React + Vite dashboard:
- Dark theme inspired by Datadog/Grafana with color-coded severity borders (Red for Critical, Orange for High, Yellow for Medium).
- Header with:
  1. "Run Live Check": Immediately tests 6 real external endpoints (httpbin, JSONPlaceholder, Open-Meteo) and streams anomalies.
  2. "Load Sample Data": Submits the 7 assignment test cases in one click.
  3. "Email Report": Dispatches HTML email digest to on-call engineers.
- Real-time Stats Cards: Total Active, Critical, High, Medium with click-to-filter capability.
- Filter Bar: Search by API name, filter by severity, filter by status (Active/Resolved/All), and 15s auto-refresh toggle.
- Individual Alert Cards:
  - Severity badge, relative timestamp ("2m ago"), occurrences tag ("3x detected").
  - LLM Diagnosis badge ("AI Diagnosed" vs "Rule Fallback").
  - Telemetry pills for Status Code, Latency, and Record count.
  - One-click "Resolve" button with optimistic UI update.
```

---

## 5. Automated Test Suite Prompt

```markdown
Write automated unit tests using Node.js native test runner (node:test and node:assert) without external testing dependencies:
1. Test healthy API payload returns null.
2. Test slow latency (>3000ms) triggers HIGH_RESPONSE_TIME (medium).
3. Test extreme latency (>6000ms) triggers HIGH_RESPONSE_TIME (high).
4. Test 500 server error triggers FAILED_REQUEST (critical) and combines with zero records.
5. Test 404 client error triggers FAILED_REQUEST (high).
6. Test missing/null records triggers MISSING_DATA (high).
7. Test batch detection filters healthy records and retains only anomalies.
8. Test deterministic fallback message generator outputs correct metrics and recommendations.
```
