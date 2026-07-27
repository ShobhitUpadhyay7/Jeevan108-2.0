# Jeevan108 — Implementation Phases

**Purpose:** This file breaks the PRD + SRD + ADD into an ordered, buildable sequence. Each phase has a clear goal, a concrete scope, explicit dependencies, and exit criteria. Work should not start on a phase until its dependencies are marked done. This is the source of truth for "what are we building right now."

**Reference documents:** `Jeevan108_PRD.md`, `Jeevan108_SRD.md`, `Jeevan108_ADD.md`

---

## How to use this file

- Each phase = a deployable increment, not just a feature sketch. By the end of a phase, the services touched should be running (in Docker Compose), tested, and demonstrable end-to-end for that slice.
- "Exit criteria" are the definition of done — don't move on until they're true.
- Phases are ordered by dependency, not by business priority. Marketplace needs Application/Verification before it has anything real to list; Booking needs Marketplace; AI Service needs a populated knowledge base before it's useful.
- If scope changes mid-build, update this file in the same PR as the code change — it should never drift from reality.

---

## Phase 0 — Foundation & Scaffolding

**Goal:** A skeleton monorepo/poly-repo that runs in Docker Compose end-to-end, even with empty services, before any business logic is written.

**Scope**
- Repo structure per SRD §21 folder layouts, for every service (empty route stubs are fine).
- `docker-compose.yml` per SRD §12 with all services, Postgres, Mongo, Redis, MinIO, RabbitMQ/Kafka, ChromaDB, Ollama wired up and healthy.
- API Gateway skeleton: routing table stubbed, `/health` on every service.
- Shared conventions in place: response envelope, error envelope, `Idempotency-Key` middleware, request ID/logging middleware (SRD §15, ADD §1, §15).
- CI pipeline skeleton: lint + build + `docker compose up` smoke test on every PR.
- `.env.example` for every service (SRD §13).

**Dependencies:** None.

**Exit criteria**
- `docker compose up` brings up all containers healthy.
- A request to any stub endpoint returns the standard success/error envelope.
- CI passes on an empty/skeleton commit.

---

## Phase 1 — Authentication & User Service

**Goal:** Signup, login, OTP, JWT issuance/refresh, and basic user profile — the foundation every other service depends on for identity.

**Scope**
- Auth Service: `/auth/signup`, `/auth/verify-otp`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/password/forgot`, `/auth/password/reset` (ADD §4).
- JWT issuance (RS256) + refresh token rotation in Redis (SRD §6, ADD §3).
- Gateway: JWT verification middleware + `X-User-Context` signed-header propagation (ADD §3.3).
- User Service: `/users/me` read/update, addresses CRUD (ADD §5).
- RBAC role model (patient, professional, staff, admin) enforced at Gateway (coarse) — fine-grained checks deferred to each service as it's built.

**Dependencies:** Phase 0.

**Exit criteria**
- A user can sign up as Patient or Healthcare Professional, verify OTP, log in, and receive a working access + refresh token.
- Token refresh and logout-all work and are covered by integration tests.
- Rate limiting on login/OTP endpoints is active (ADD §19 in SRD, rules in ADD §16).

---

## Phase 2 — Application & Verification Service

**Goal:** A Healthcare Professional can apply, upload documents, and get approved/rejected by Staff — producing the first real Professional records.

**Scope**
- Application Service: draft creation, step-wise `PATCH`, document pre-signed upload + confirm, submit, Staff review queue, decision endpoint (ADD §6).
- File Storage integration: MinIO/S3 pre-signed URLs, virus-scan hook (async worker stub is acceptable — can be a no-op scanner initially, but the state machine `pending_scan → clean/infected` must be real).
- Event: `application.submitted`, `application.status_changed` published to the bus (ADD §14.2, §14.3).
- Professional Service: minimal profile record auto-created on approval (internal API `POST /internal/v1/professionals`, SRD §13 event catalog).
- Staff Dashboard UI (Application Review Queue, Document Viewer) — first real frontend screens beyond auth.

**Dependencies:** Phase 1 (needs authenticated users with `professional` and `staff` roles).

**Exit criteria**
- End-to-end: professional signs up → completes application → uploads documents → submits → staff approves → a Professional Service record exists with `verified: true`.
- Rejection flow with reason taxonomy works; re-application cooldown enforced (PRD §12 validation rules).

---

## Phase 3 — Professional Profile & Marketplace

**Goal:** Approved professionals are browsable, filterable, comparable — the core patient-facing discovery experience.

**Scope**
- Professional Service: full profile read/update, availability calendar, reviews read (ADD §7).
- Marketplace Service: `/marketplace/listings` with full filter/sort set, `/marketplace/compare`, denormalized `listings_cache` built from Professional Service events (ADD §8, SRD §8.3).
- Internal endpoint `GET /internal/v1/marketplace/query` stubbed now (real consumer is AI Service in Phase 6) — build it here since it's Marketplace's data.
- Frontend: Marketplace Listing page, Filter Panel, Compare view, Provider Profile page (PRD §11.2, §11.3, §11.6 component specs — profile only, booking CTA can 404/stub for now).

**Dependencies:** Phase 2 (needs real, verified professional records to list).

**Exit criteria**
- A patient can browse, filter by role/location/price/rating/availability/language/gender, sort, and compare up to 3 professionals.
- Listings only ever show `verified: true` professionals — verify this with a test that an unapproved application never appears.

---

## Phase 4 — Booking Service

**Goal:** A patient can actually hire a professional — the platform's core transaction.

**Scope**
- Booking Service: create, get, list, respond (accept/decline), reschedule, cancel, complete, review (ADD §9).
- Conflict detection, SLA timers (auto-decline on breach), pricing calculation (base + platform fee, paise-based).
- Idempotency-Key enforcement on booking creation.
- Events: `booking.requested`, `booking.confirmed`, `booking.cancelled`, `review.submitted` (ADD §14.4–§14.6, §14.9).
- Frontend: Booking Flow stepper (PRD §11.4), Booking Confirmation, Patient Dashboard "My Bookings," Professional Dashboard "Booking Requests" + Calendar.

**Dependencies:** Phase 3 (needs listings/profiles to book against).

**Exit criteria**
- Full happy path: patient books → professional accepts → booking confirmed → marked complete → patient leaves a review → professional rating recalculates.
- Conflict/overlap rejection, SLA auto-decline, and reschedule-window rules are all covered by tests (PRD §12 validation rules).

---

## Phase 5 — Notification Service

**Goal:** Every meaningful state change reaches the right person on the right channel.

**Scope**
- Notification Service consuming `application.status_changed`, `booking.requested/confirmed/cancelled` events (SRD §4.1, ADD §14).
- Channels: in-app (always), push, email, SMS — start with in-app + email, add SMS/push once providers are configured.
- Notification Center read API (`GET /notifications`, mark read) (ADD §11).
- Frontend: Notification Center UI, in-app toast/banner system.

**Dependencies:** Phases 2 and 4 (needs real events to consume).

**Exit criteria**
- Application decisions and booking lifecycle changes reliably produce a notification in-app and via at least one external channel.
- A slow/down notification provider never blocks or fails the originating booking/application request (verify via chaos test: kill the notification service, confirm booking flow is unaffected).

---

## Phase 6 — AI Knowledge Service (RAG) + Knowledge Base Seeding

**Goal:** The core differentiator — grounded, cited, emergency-aware AI assistance, embedded contextually.

**Scope**
- Knowledge Base authoring: seed initial content across all 12 collections (PRD §Knowledge Base) — this is a content task, not just code, and should start in parallel with earlier phases if possible.
- AI Service: chunking, embedding, ChromaDB collections, classifier (informational/staffing_recommendation/emergency), retriever, re-ranker, prompt templates, generator (Ollama + OpenAI-compatible abstraction), citation assembler, audit logger (SRD §10).
- `/ai/query`, `/ai/sessions/{id}`, `/ai/query/{id}/feedback` (ADD §10.1–§10.3).
- Internal call to Marketplace Service for staffing recommendations (ADD §8.3, §13).
- Emergency Guide static content endpoints: `/emergency-guides`, `/emergency-guides/{categoryId}` — sourced from KB but served as pre-formatted structured guides (PRD §11.6, ADD §10.4–§10.5).
- Frontend: AI Assistant panel (contextual, embedded per PRD §11.1) on Marketplace, Booking, Provider Profile pages; Emergency Guide category grid + detail pages.
- KB Admin endpoints and Admin Knowledge Base Manager UI (ADD §10.6, PRD §11.8).

**Dependencies:** Phase 3 (staffing recommendations need real listings); ideally after Phase 4 so booking-context prompts have something to reference. Knowledge base content authoring can and should start as early as Phase 1.

**Exit criteria**
- Every medical/informational answer includes ≥1 citation; below-confidence queries fall back gracefully instead of hallucinating (PRD AI-2).
- A labeled test set of known emergency queries (snake bite, burns, cardiac, choking, etc.) is classified as `emergency` with ≥95% recall and always renders the Call-Ambulance CTA before generated content (PRD §Success Metrics, AI-4).
- Emergency Guide pages render from static/cached content even with the AI Service intentionally stopped (verify via chaos test).
- Admin can add/edit/publish a KB document and see it show up in retrieval within the async re-embed window.

---

## Phase 7 — Search Service

**Goal:** One search bar, three result types.

**Scope**
- Federated search across professionals, KB documents, emergency guides (ADD §12).
- Search indices built from events emitted by Marketplace/AI services (SRD §8.3).
- Frontend: global Search bar + grouped Search Results page.

**Dependencies:** Phases 3 and 6 (needs marketplace and KB data to index).

**Exit criteria**
- A single query returns grouped, relevant results across all three categories within performance targets (PRD §7 NFRs).

---

## Phase 8 — Admin Dashboard & Analytics

**Goal:** Operational visibility and control for Admins, closing the AI feedback loop.

**Scope**
- Admin BFF aggregation endpoints (SRD §3, §21.4) for: platform overview/analytics, user management, AI Answer Audit Log.
- Frontend: Admin Dashboard — Overview/Analytics, User Management, Knowledge Base Manager (built in Phase 6, wired here into the full Admin shell), AI Answer Audit Log, Platform Settings.
- Analytics events aggregation (booking funnel, application funnel, AI query volume/category breakdown, supply/demand heatmap) (PRD §11.2).

**Dependencies:** Phases 2, 4, 6 (needs applications, bookings, and AI query logs to aggregate).

**Exit criteria**
- Admin can view end-to-end platform KPIs, suspend/reinstate a user, and review + act on a flagged low-confidence AI answer by patching the knowledge base directly from the audit log view.

---

## Phase 9 — Hardening: Security, Performance, Accessibility

**Goal:** Make it production-grade, not just functionally complete.

**Scope**
- Security pass: dependency scanning in CI, secrets-manager wiring for staging/prod, prompt-injection mitigation review on AI Service, signed-URL TTL audit (SRD §17).
- Performance pass: load test marketplace listing and AI query endpoints against NFR targets (PRD §7); tune Redis caching, `listings_cache` rebuild latency.
- Rate limiting verification across all limits in ADD §19/SRD.
- Accessibility pass on patient-facing flows, especially Emergency Guide (WCAG 2.1 AA — large tap targets, contrast, screen-reader labels) (PRD §7).
- Monitoring/alerting wired up (Prometheus/Grafana dashboards, alert rules) (SRD §16).
- Full error-catalog conformance test: every documented error code in ADD §15 has at least one integration test asserting it's returned correctly.

**Dependencies:** All feature phases (0–8) substantially complete.

**Exit criteria**
- Load tests meet PRD §7 latency targets under expected concurrent load.
- Security scan and prompt-injection review signed off.
- Accessibility audit passes on Emergency Guide and core booking flow.

---

## Phase 10 — Deployment & Launch Readiness

**Goal:** Ship it.

**Scope**
- Staging environment stood up per SRD §14; full regression pass.
- Production deployment (Docker Compose on managed VM per SRD §14 V1 target; Kubernetes deferred to roadmap Phase 4 in PRD §14).
- Runbooks: on-call escalation, rollback procedure per service, DB migration rollback plan.
- Final go/no-go checklist against PRD §3 Success Metrics instrumentation (confirm every metric is actually measurable in production, not just in theory).

**Dependencies:** Phase 9.

**Exit criteria**
- Production environment live, health checks green, monitoring dashboards populated with real traffic.
- Rollback tested at least once in staging before go-live.

---

## Post-Launch — Roadmap Phases (from PRD §14)

These are **not** part of the V1 build above; tracked here only so scope creep is caught early:

| Roadmap Phase | Trigger to start |
|---|---|
| Physiotherapists / Lab Technicians / Home Doctor Visits | After Phase 10, once V1 metrics are stable |
| Multi-language UI + KB | After Phase 10 |
| In-app payments with escrow | After Phase 10, pending payment-partner integration |
| Insurance-provider integration | Roadmap Phase 3 |
| Kubernetes migration | Roadmap Phase 4, triggered by scale, not by calendar |
| Voice-based emergency assistant | Roadmap Phase 4 |

---

*This file should be updated whenever a phase's scope changes. Keep `rules.md` and `memory.md` in sync with any architectural decisions made during a phase.*
