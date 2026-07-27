# Jeevan108 — Project Memory

**Purpose:** A condensed, fast-to-scan reference of decisions already made, so nobody (human or AI agent) re-derives or re-litigates them from scratch in a new session. This file is meant to be read in full at the start of any work session on this project. Full detail always lives in `Jeevan108_PRD.md` / `Jeevan108_SRD.md` / `Jeevan108_ADD.md` — this file is the index and the "don't forget this" list, not a replacement for them.

**Companion files:** `phases.md` (what to build next), `rules.md` (how to build it)

---

## 1. What This Product Is (and Isn't)

- Jeevan108 is a **healthcare staffing marketplace + AI medical knowledge/emergency assistant**. It is explicitly **not** a hospital management system.
- Two pillars, always: (1) hire a verified Nurse/Caretaker/Compounder, (2) get grounded, cited AI guidance — including emergency-specific guidance. Every feature decision should serve one of these two pillars.
- The AI assistant is **embedded contextually per page**, not a floating generic chatbot. This has been said three times across the PRD/rules — it's a recurring temptation to simplify into a single chat widget; resist it.

---

## 2. Architecture at a Glance

- **Microservices**, Node.js/Express for core business services, **FastAPI/Python for the AI Knowledge Service**, React+TypeScript+Tailwind frontend.
- Services (current list): API Gateway, Authentication, User, Professional, Application & Verification, Marketplace, Booking, Notification, AI Knowledge, Search.
- **Data ownership is service-local, always.** Postgres for Auth/User/Booking; MongoDB for Professional/Application/Marketplace-cache/Search-index/AI-KB/AI-query-logs; Redis for sessions/cache; MinIO/S3 for files; ChromaDB for vectors.
- Cross-service reads happen via internal APIs (`/internal/v1/...`) or via consuming events to build a local read model — never direct DB access across services.
- Containerized via Docker Compose now; Kubernetes is a Phase-4-roadmap item, not a V1 requirement.

---

## 3. Identity & Auth — Key Facts

- Access token: JWT, RS256, **15 min TTL**. Refresh token: opaque, Redis-stored (hashed), **7 day TTL**, rotated on every use, delivered as `httpOnly` cookie.
- **The Gateway is the only JWT verifier.** Downstream services trust a Gateway-signed `X-User-Context` header (HMAC), not the raw JWT. Don't reintroduce JWT parsing into individual services.
- Roles: `patient`, `professional` (sub-types: nurse/caretaker/compounder), `staff`, `admin`. Admin/Staff accounts are provisioned by Super Admin only — no public signup path for them.
- Access tokens never touch `localStorage`. Non-negotiable.

---

## 4. Money, Time, IDs — Formatting Conventions

- **Money is always an integer in paise** with an explicit `currency: "INR"` field. Never a float.
- **Timestamps are always ISO 8601 UTC** in storage and API payloads. Timezone display conversion is frontend-only.
- IDs are UUID v4 strings. (Human-readable prefixes used in examples throughout the docs — e.g. `usr_`, `pro_`, `bk_`, `app_`, `aiq_`, `kb_` — for readability; not a hard requirement, but keep it consistent if adopted.)

---

## 5. The RAG / AI System — Key Facts

- **Query classification runs before generation**: `informational` / `staffing_recommendation` / `emergency`. This ordering is load-bearing — the emergency Call-Ambulance CTA must never wait on generation latency.
- **12 Knowledge Base collections**, 1:1 mapped to ChromaDB collections: Diseases, Symptoms, Departments, Treatments, Emergency Procedures, First Aid, Insurance, Ambulance, Medicines, Home Care, Hospital Policies, FAQs.
- Only `status: published` KB documents get embedded into live retrieval; drafts stay in MongoDB source-of-truth only.
- LLM provider is abstracted behind `LLM_PROVIDER` env var (`ollama` | `openai_compatible`) — never hardcode a provider.
- **Every medical/informational answer needs ≥1 citation.** Below confidence threshold → graceful fallback ("consult a doctor / call emergency services"), never a confident guess.
- The assistant **never** gives dosages or diagnoses, and **never** recommends a named professional outside the platform — staffing recommendations resolve to real marketplace listing IDs via an internal Marketplace Service call.
- **Emergency Guide static content has zero runtime dependency on the LLM/vector store.** It must render even if the AI Service is down — this is a tested availability guarantee, not a nice-to-have.
- Every AI query is logged (query, classification, sources, confidence, latency, feedback) — this feeds the Admin Audit Log and is how the KB improves over time.

---

## 6. API Conventions (also see `rules.md` §2)

- Everything under `/api/v1/...` (public) or `/internal/v1/...` (service-to-service, HMAC-secret authenticated, not routed through the public Gateway).
- Standard envelope everywhere: `{ data, meta, error }`. No bare arrays/objects.
- Error codes are catalogued in `Jeevan108_ADD.md` §15 — add new ones there before using them in code.
- `Idempotency-Key` header required on booking/payment-mutating POSTs.
- Pagination: `page`/`limit` + `meta.totalCount`/`meta.hasMore` — cursor-based only by documented exception.

---

## 7. Cross-Service Data Flows (running log — append new ones here)

| Flow | Mechanism | Why |
|---|---|---|
| AI Service needs real, bookable listings for a staffing recommendation | Synchronous internal call: `GET /internal/v1/marketplace/query` (Marketplace Service) | Recommendations must resolve to real marketplace data, not hallucinated names |
| Marketplace's `listings_cache` needs current professional data | Consumes `professional.updated`-type events from Professional Service | Avoids Marketplace directly querying Professional Service's DB; denormalized read model rebuildable from events |
| Application approval creates a Professional record | Synchronous internal call: `POST /internal/v1/professionals` (Application Service → Professional Service) | Professional Service is the source of truth for professional profiles; Application Service triggers creation but doesn't own the data after approval |
| Booking Service needs conflict/availability check | Synchronous internal call: `GET /internal/v1/professionals/{id}/availability-check` | Must be checked inside the booking transaction, not trusted from client |
| Notification triggers | Async, via event bus (`booking.*`, `application.*`, `ai.emergency_flagged`) | Must never block the producing request; producer/consumer decoupling is a hard rule |

*(Add a row here any time a new cross-service dependency is introduced — see `rules.md` §1.4.)*

---

## 8. Validation Rules Quick-Reference

| Rule | Value |
|---|---|
| Booking minimum lead time | ≥ 2 hours from now (configurable) |
| Reschedule window | ≥ 12 hours before current start time (configurable) |
| Application resubmission cooldown | 7 days after non-disqualifying rejection; blocked permanently after disqualifying rejection unless Admin override |
| File upload limits | PDF/JPG/PNG only, ≤ 5MB, virus-scanned before viewable |
| Password | ≥ 8 chars, ≥1 letter + 1 number |
| Phone | E.164, Indian mobile, OTP-verified |
| Rating | Integer 1–5 |
| Care notes / review comments | HTML-stripped, length-capped (500 / 1000 chars) |
| AI query | 1–1000 chars, 20/min & 200/day per user rate limit (emergency queries exempt from daily cap) |
| Professional age | ≥ 18 |
| KB document publish | Requires non-empty body + ≥1 tag |

---

## 9. Success Metrics to Keep in Mind While Building

(Full list in PRD §3 — the ones most likely to constrain implementation choices:)
- AI first-token latency < 2s, full RAG answer < 6s p95 → classification-before-generation and the fast-path emergency CTA exist specifically to hit this.
- 100% of marketplace listings must be verified professionals — no exceptions, no override path.
- 100% of medical/informational AI answers carry a citation.
- Emergency query classification recall > 95% on the labeled test set — this is why the AI Service needs its own eval suite gating PRs (see `rules.md` §8.3).

---

## 10. Open Decisions / Things Deferred (don't accidentally build these prematurely)

- Multi-language UI/KB — deferred to post-V1 roadmap, don't design frontend copy in a way that makes i18n harder later, but don't build the i18n framework now either.
- In-app payments with escrow — V1 assumes a payment method reference/tokenization model; full escrow logic is roadmap Phase 2+.
- Kubernetes — not a V1 requirement; Docker Compose is the target for V1 production (SRD §14). Don't over-engineer manifests prematurely.
- Physiotherapist / Lab Technician / Home Doctor Visit categories — data model should not actively block adding these later (role enum should be easy to extend), but no UI/flows for them ship in V1.

---

## 11. Where Things Live

- Product scope, UX, flows, personas, validation rules → `Jeevan108_PRD.md`
- System architecture, service responsibilities, DB design, Docker/deploy, RAG architecture diagrammed → `Jeevan108_SRD.md`
- Every endpoint, schema, JWT flow, event payloads, error catalog → `Jeevan108_ADD.md`
- What to build next, in what order, with exit criteria → `phases.md`
- How to build it — conventions and anti-patterns → `rules.md`
- This file — what's already been decided, so it isn't re-decided differently → `memory.md`

---

*Update this file whenever a new durable decision is made or a new cross-service dependency is introduced. If a future session's code contradicts something written here, that's a signal to stop and reconcile — either the code is wrong or this file is stale and needs updating in the same PR.*
