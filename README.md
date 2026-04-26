# AI Call Processing — Backend API

### Overview
- Express + TypeScript service that processes call transcripts with an LLM and returns structured data + next action.
- Uses Anthropic SDK and AJV schema validation with one-shot retry on invalid AI output.

### Quick start
- Requirements
  - Node 20+
  - Anthropic API key
- Env vars (create .env)
  ```
  AI_API_KEY=your_anthropic_key
  PORT=3000 (optional)
  MAX_TRANSCRIPT_LEN=5000 (optional; if omitted, no cap is applied)
  ```
- Install & run
  - `npm install`
  - `npm run dev`

### API
- Health
  - GET /ping → 200 { "status": "ok" }
- Process Call
  - POST /process-call
  - Request body
    {
      "transcript": "Hi, I’ve had a really bad cough for 5 days and I’d like to see a doctor. My name is John Smith and my date of birth is 2nd Jan 1990."
    }
  - Success 200 (example)
    {
      "patient": { "name": "John Smith", "date_of_birth": "1990-01-02" },
      "clinical": { "symptoms": ["cough"], "duration": "5 days", "urgency": "routine" },
      "intent": "book_appointment",
      "confidence": 0.85,
      "recommended_action": { "type": "book_appointment", "mode": "gp_consultation" },
      "is_valid_call": true
    }
  - Client error examples
    - 400 Invalid request (missing/not-string/empty transcript)
    - 400 Payload too large (exceeds MAX_TRANSCRIPT_LEN)
    - 400 Transcript does not appear to be a valid patient call (AI judged invalid)
  - Upstream/validation error
    - 502 Invalid AI output (includes AJV error details)
  - Server error
    - 500 Processing failed

### AI & validation
- LLM: Anthropic `messages.create` with JSON Schema output enforcing `callExtractionSchema`.
- Retry: If the first AI response fails schema validation, the service retries once with a repair hint.
- Schema: Ensures structured fields for patient, clinical, intent, confidence, recommended_action, and a boolean `is_valid_call`.

### Run tests
- Unit tests
  - npm run test:unit
- Integration tests (require running server and real AI key)
  - Start server in one terminal: `npm run dev`
  - In another: `npm run test:integration`
  - Note: in a CI environment these would run against a containerised instance of the server
      via Testcontainers, with the AI key injected as a secret.

### Security & keys
- Do not commit real API keys. Use environment variables.
- Network calls to the LLM may incur cost; prefer unit tests locally.

### Development notes
- Code style: ESLint + Prettier (npm run lint / lint:fix / format)
- Build output to dist/ (npm run build)

### Assumptions & approach
- Multiple intents are returned as an array.
- Urgency defaults conservatively - routine unless the transcript clearly indicates otherwise.
- Symptoms are captured verbatim from the transcript, not inferred or expanded.
- Vague complaints (e.g. "I feel unwell") are recorded as-is in the symptoms array.
- is_valid_call=false returns 400, not 200, to fail fast on irrelevant input.
- Confidence is model-generated, not rule-based.
