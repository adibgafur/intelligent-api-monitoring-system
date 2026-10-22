# Interview Video & Talking Points Cheat Sheet

Use this guide while recording your **5–10 minute demonstration video** or during your live interview. It breaks down the system into simple, confident answers.

---

## 1. The 1-Minute Elevator Pitch

> *"I designed and built an **Intelligent API Monitoring & Alert System** for distributed microservices. In production, third-party healthcare APIs can intermittently slow down, throw 500 errors, or return empty payloads.*
>
> *My system provides an automated pipeline:*
> 1. *It accepts API health telemetry via `POST /monitor` or automated polling.*
> 2. *It applies pure rule-based anomaly detection to catch high latency, HTTP errors, or missing data.*
> 3. *It calls the Groq Llama 3.3 LLM to translate raw metrics into concise, 1-to-2 sentence operational alerts.*
> 4. *It stores them in MongoDB Atlas with de-duplication to prevent alert fatigue, and presents them on a real-time React dashboard where operators can filter, inspect, and resolve incidents."*

---

## 2. System Architecture (The 4-Step Pipeline)

```
[ External APIs / Telemetry / Sample Data ]
                   │
                   ▼
       1. INGESTION & VALIDATION
          • Express POST /monitor
          • Strict Zod Schema validation
                   │
                   ▼
       2. RULE-BASED DETECTION ENGINE (Pure logic)
          • High Latency (>3000ms)
          • HTTP Status (5xx Critical, 4xx High)
          • Data Integrity (0 or null records)
                   │ (Healthy records exit here)
                   ▼
       3. AI DIAGNOSIS (Groq LLM)
          • Model: Llama 3.3 70B (Fast sub-second inference)
          • Concurrency control via p-limit
          • Graceful Fallback template (100% uptime guarantee)
                   │
                   ▼
       4. PERSISTENCE & DASHBOARD
          • MongoDB Atlas (Deduplication within 10min window)
          • Real-time React Dashboard (Vite)
          • One-click Resolve + Optional Email Report
```

---

## 3. Top Interview Questions & Strong Answers

### Q1: *"Why did you use Groq instead of OpenAI or running a local model?"*
> **Answer:** *"Groq uses custom LPUs (Language Processing Units) that deliver sub-second inference speeds (often under 300ms). For real-time monitoring and alerting, latency is critical. Groq also offers a generous free tier for high-quality models like Llama 3.3 70B."*

### Q2: *"What happens if the LLM API is down, rate-limited, or slow?"*
> **Answer:** *"The system has a zero-downtime architecture. In `aiAlert.service.js`, the Groq request has an 8-second timeout and an automatic retry. If the call fails or if no API key is provided, the system immediately uses our deterministic `buildFallbackMessage` function and tags the alert with `aiGenerated: false`. The monitoring pipeline **never crashes or loses an alert**."*

### Q3: *"How does the system prevent alert storms if an API fails repeatedly?"*
> **Answer:** *"We implemented a 10-minute de-duplication window. If the exact same API fails with the same issue types within 10 minutes, the system updates the `lastSeenAt` timestamp and increments an `occurrences` counter on the existing MongoDB document instead of creating duplicate records or wasting LLM tokens."*

### Q4: *"Why did you separate the detection logic into a pure function?"*
> **Answer:** *"In `detector.service.js`, the logic has zero database or network dependencies. This makes it completely deterministic, easy to reason about, and lightning-fast to unit test. In fact, our test suite runs in under 10 milliseconds without needing mock databases."*

### Q5: *"How does batch processing scale when monitoring hundreds of APIs?"*
> **Answer:** *"We use `Promise.allSettled` combined with `p-limit`. This ensures that:
> 1. We process entries concurrently without exceeding LLM rate limits.
> 2. A failure in diagnosing one API never halts or corrupts the rest of the batch."*

---

## 4. 5–10 Minute Video Demo Walkthrough Script

Follow these steps when recording your screen:

1. **Introduction (1 min):**
   - Introduce yourself and state the project goal: Intelligent API Monitoring & Alert System.
   - Mention the tech stack: Node.js, Express, MongoDB Atlas, Groq LLM, React, Zod, and Winston.

2. **Backend & Architecture Walkthrough (2 mins):**
   - Open VS Code.
   - Show `detector.service.js`: point out the 3 core checks (latency, status code, records returned).
   - Show `aiAlert.service.js`: point out the Groq prompt and the instant fallback message builder.
   - Run `npm test` in the terminal to show all 11 unit tests passing.

3. **Frontend Dashboard Demo (3 mins):**
   - Open `http://localhost:5173` in your browser.
   - Click **"Load Sample Data"**: show how 5 anomalies (AppointmentAPI, BillingAPI, LabResultsAPI, etc.) appear instantly.
   - Point out:
     - **AppointmentAPI**: Show the Red Critical badge, the HTTP 500 status, and the Groq/Fallback explanation.
     - Click **"Load Sample Data"** again: show how the `occurrences` badge increases (`2x detected`) due to de-duplication!
   - Click **"Run Live Check"**: show the spinner querying real live endpoints (JSONPlaceholder, httpbin 500, delay 4s) and rendering real-time results.
   - Demonstrate the **Severity filter** and **API search** bar.
   - Click the **"Resolve"** button on one alert: show how it gets marked resolved and updates the active count.

4. **Conclusion & Key Decisions (1 min):**
   - Summarize the key strengths: modular design, zero-downtime AI fallback, de-duplication, and clean user experience.
