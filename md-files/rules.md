# Jeevan108 — Engineering Rules

**Purpose:** Non-negotiable conventions for anyone (human or AI agent) writing code in this repo. These rules exist so that ten different services built at different times still feel like one coherent system. When in doubt, these rules win over local convenience — if a rule needs to change, change it here first, then write the code.

**Reference documents:** `Jeevan108_PRD.md`, `Jeevan108_SRD.md`, `Jeevan108_ADD.md`, `phases.md`, `memory.md`

---

## 1. Service Boundary Rules

1. **No service reads or writes another service's database, ever.** Not "just this once," not "for a quick join." Cross-service data needs go through: (a) a synchronous internal API call (`/internal/v1/...`), or (b) consuming an event and building a local read model.
2. **A service's data ownership is fixed by SRD §8.3.** If a new field seems like it belongs to another service's entity, it goes through that service's API — it does not get bolted onto a different service's table because that's where the request happens to originate.
3. **Internal APIs are not public APIs.** They live under `/internal/v1/`, are never routed through the public Gateway, and are authenticated with the internal `X-Internal-Auth` HMAC secret, not user JWTs.
4. **Every new cross-service data need is a documented decision.** Add it to `memory.md` §"Cross-Service Data Flows" the same PR it's introduced, so the next person doesn't have to reverse-engineer why AI Service calls Marketplace Service directly instead of eventing.

---

## 2. API Rules

1. **Every public endpoint is versioned under `/api/v1/`.** No unversioned routes, ever, even temporarily.
2. **Every response uses the standard envelope** (`{ data, meta, error }`) from ADD §1. No endpoint returns a bare array or bare object.
3. **Every error uses a documented `error.code`** from the catalog in ADD §15. If a new failure mode needs a new code, add it to ADD §15 in the same PR — don't invent an inline string that lives only in one service's code.
4. **Every mutating endpoint that creates a booking or payment requires `Idempotency-Key`.** Reject with `400 VALIDATION_ERROR` if missing on those routes.
5. **Pagination is always `page`/`limit` with `meta.totalCount`/`meta.hasMore`.** No cursor-based pagination unless a specific endpoint's scale genuinely requires it — and if so, document the exception in `memory.md`.
6. **Validation rules live in one place per field.** If `booking.startAt` must be ≥2h from now, that rule is defined once (in the Booking Service's request schema) and referenced by the ADD, not duplicated with slightly different logic in the frontend and re-implemented differently server-side. Frontend validation is a UX nicety; server validation is the actual rule.
7. **Money is always an integer in paise, with an explicit `currency` field.** Never a float. Never assume INR without the field being present.
8. **Timestamps are always ISO 8601 UTC.** No service-local timezone formatting in stored data or API payloads; timezone conversion is a frontend display concern only.

---

## 3. Authentication & Authorization Rules

1. **The Gateway is the only place that verifies the raw JWT.** Downstream services trust the signed `X-User-Context` header, they do not re-parse or re-verify the original JWT. This is deliberate (ADD §3.3) — don't "helpfully" add JWT parsing to a service because it seemed simpler.
2. **Coarse-grained RBAC at the Gateway, fine-grained at the service.** The Gateway blocks a `patient` role from even reaching `/kb/documents` (Admin-only route table). The service itself still re-checks permissions on the decoded context — never trust that "the Gateway already checked" as the only line of defense.
3. **Access tokens are never persisted client-side in `localStorage`.** Access tokens live in memory (JS variable/state); refresh tokens live in an `httpOnly` cookie. This is a hard rule, not a preference — token exfiltration via XSS is the failure mode we're avoiding.
4. **Every sensitive state-changing action gets an audit log entry with actor identity and timestamp**, append-only. This includes: application approve/reject, user suspend/reinstate, KB document publish/retire, AI answer override.

---

## 4. AI / RAG Rules

1. **No answer describing medical/procedural information ships without at least one citation.** If retrieval confidence is below the configured threshold, the service must fall back to "I don't have verified information on this — please consult a doctor or call emergency services," never a generated-from-parametric-knowledge guess.
2. **The AI Service never recommends a named professional outside the platform.** Staffing recommendations resolve to marketplace filter criteria (role, specialization) and then to real listing IDs via the internal Marketplace query — never a hallucinated or off-platform name.
3. **The AI Service never gives medication dosages or diagnostic conclusions.** It may describe general information about a condition/medicine from the knowledge base, but dosage/diagnosis questions get redirected to a professional or emergency services. This is enforced in the system prompt template AND spot-checked in the eval set (`services/ai-service/tests/eval`) — a prompt-only guarantee is not sufficient, it must be tested.
4. **Query classification runs before generation, not after.** The emergency Call-Ambulance CTA must never wait on LLM generation latency. If this ordering is ever inverted for a "simpler" implementation, that's a regression — the eval set must catch it (PRD AI-4).
5. **Emergency Guide static content has zero runtime dependency on the LLM or vector store being up.** It is pre-rendered/cached content. Do not refactor it to be "just another RAG query" — this would violate the availability guarantee in PRD §7 NFRs.
6. **Only `status: published` KB documents are embedded into the live retrieval collections.** Draft documents exist in the MongoDB source-of-truth only. Never embed a draft "for testing" into the production ChromaDB collections.
7. **User query text is never concatenated unescaped into the system prompt.** Treat all user input as untrusted for prompt-construction purposes, even though it's trusted enough to log and display back to the user.
8. **Every AI query is logged** (query, classification, sources, confidence, latency, feedback) regardless of whether the user provides explicit feedback. This is not optional telemetry — it's how the knowledge base gets improved (PRD AI-8).

---

## 5. Data & Validation Rules

1. **Verification status gates marketplace visibility, full stop.** There is no code path, feature flag, or admin override that shows an unapproved professional in `/marketplace/listings` other than the documented approval workflow. Test this explicitly in Marketplace Service's test suite, not just Application Service's.
2. **Booking conflict checks are the Booking Service's responsibility and run inside the same transaction as booking creation.** Never trust a client-side "is this slot free" check as authoritative.
3. **File uploads are validated on type and size server-side**, regardless of what the client already checked (PDF/JPG/PNG, ≤5MB). Client-side checks are UX only.
4. **All uploaded documents are virus-scanned before being marked `clean` and viewable by Staff.** A `pending_scan` document is never shown in the Document Viewer as if it were safe.
5. **PII fields (documents, phone, address, application data) are encrypted at rest.** This applies to every new sensitive field added later, not just the ones enumerated in the SRD at time of writing — if it's personally identifying or health-adjacent, it's encrypted.

---

## 6. Event Rules

1. **Every event includes `eventId`, `eventType`, `eventVersion`, `occurredAt`, `producer`, `payload`** — no ad hoc event shapes (ADD §14).
2. **Consumers must tolerate unknown additive fields in a payload.** Don't write a consumer that breaks if the producer adds a new optional field — check `eventVersion` before assuming a payload shape has changed structurally.
3. **A slow or failing consumer must never block or fail the producing request.** Booking confirmation must succeed even if the Notification Service is down. If this coupling is ever introduced (e.g., an inline call instead of publish-and-forget), that's a bug, not a shortcut.
4. **Events are the mechanism for building another service's local read model — never a substitute for that service owning its authoritative data.** Marketplace's `listings_cache` is a read model that can be rebuilt from events; if it's ever wrong, "replay the events" must be a valid recovery path, meaning events must carry enough data to rebuild it.

---

## 7. Frontend Rules

1. **The AI Assistant is embedded per-page with `context` parameters, never a single generic floating chat widget with no page awareness.** If a page needs AI help, it passes `{ page, ...relevantContext }` per ADD §10.1 — don't reuse one hardcoded prompt-suggestion list everywhere.
2. **Emergency Guide screens must render without waiting on any AI/network call that isn't the static guide fetch itself.** No spinner-blocking the "Call Ambulance" button on anything.
3. **Every list/marketplace screen needs a loading (skeleton) state and an explicit empty state** — not a blank screen (PRD §11.2).
4. **Citations in AI answers are always rendered as clickable/expandable chips**, never silently omitted even when the answer "seems obviously correct" — the disclaimer and citation UI are mandatory, not conditional on how confident the frontend dev feels about the content.
5. **Mobile-first.** Build and test the mobile layout first; desktop is the expanded case, not the default.

---

## 8. Testing Rules

1. **Every documented error code in ADD §15 has at least one integration test** asserting the condition that triggers it and the exact code returned.
2. **Every validation rule in PRD §12 / ADD §16 has a corresponding test**, both for the rejection case and the boundary-valid case (e.g., booking exactly 2 hours from now should pass; 1h59m should fail).
3. **The AI Service's eval set (`services/ai-service/tests/eval`) runs on every PR that touches the RAG pipeline or the knowledge base**, asserting: citation presence, correct classification on the labeled emergency-query set, and no dosage/diagnosis leakage on a fixed adversarial prompt set.
4. **Chaos/degradation tests are required for every documented graceful-degradation guarantee**: kill the Notification Service and confirm bookings still complete; kill the AI Service and confirm the Emergency Guide static pages still render.

---

## 9. Documentation Rules

1. **If code diverges from `Jeevan108_PRD.md`, `Jeevan108_SRD.md`, or `Jeevan108_ADD.md`, the docs get updated in the same PR.** These are living documents, not historical artifacts — an outdated PRD is worse than no PRD.
2. **New architectural decisions go into `memory.md`, not just a commit message.** Commit messages get lost; `memory.md` is the running context file for anyone (or any AI agent) picking up the project later.
3. **`phases.md` reflects actual current status.** If a phase's scope changes or a phase is skipped/reordered, update the file — don't let it silently become fiction.

---

## 10. What Not to Do (Explicit Anti-Patterns)

- Do not add a "quick" direct DB connection from one service to another's database "just for this dashboard query." Build the internal API or consume the event.
- Do not store an access token in `localStorage` "temporarily" for debugging and forget to revert it.
- Do not let the AI Service answer confidently when retrieval confidence is low — silence-with-fallback beats a fluent guess.
- Do not hardcode the LLM provider — always go through the `LLM_PROVIDER` abstraction (Ollama vs. OpenAI-compatible), even in a prototype branch.
- Do not skip the virus-scan gate on file uploads for internal testing convenience in a shared/staging environment.
- Do not introduce a new event shape without the standard envelope, and do not introduce a new REST error without adding it to the ADD §15 catalog first.
- Do not couple a business-critical synchronous flow (booking, payment) to a non-critical downstream service (notifications, analytics) such that the non-critical one failing breaks the critical one.

---

*These rules apply to every service, every phase, every contributor — human or AI. If a rule is actively blocking legitimate progress, that's a signal to revisit and rewrite the rule here, not to quietly work around it in code.*
