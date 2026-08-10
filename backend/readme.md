# Jeevan108 — AI-Powered Healthcare Staffing Platform

> A production-grade microservices backend for a two-sided healthcare staffing marketplace with a grounded RAG-based medical assistant, event-driven architecture, and a complete booking lifecycle.

![Architecture](./docs/architecture.svg)

## 🎯 What This Is

Jeevan108 solves two connected problems Indian households face:
1. *"I need a trustworthy home healthcare professional, right now."*
2. *"I don't know what to do before help arrives."*

The backend provides:
- **Two-sided marketplace** with a verified-professionals-only policy (no profile is visible without staff approval)
- **Event-driven booking engine** with conflict detection, idempotency, and SLA timers
- **RAG-powered medical assistant** grounded in a curated knowledge base with citations — never hallucinated
- **Emergency-first design** where critical CTAs render instantly, independent of LLM latency

## 🏗️ Architecture Highlights

### Microservices (10 services, 2 runtimes)

| Service | Runtime | Database | Responsibility |
|---|---|---|---|
| API Gateway | Node.js | — | Routing, JWT, rate limiting, BFF aggregation |
| Auth Service | Node.js | MongoDB | JWT issuance, refresh rotation, logout |
| User Service | Node.js | MongoDB | Patient profiles |
| Professional Service | Node.js | MongoDB | Verified professional profiles, ratings |
| Marketplace Service | Node.js | MongoDB + Redis | Listing read-model (denormalized from events) |
| Booking Service | Node.js | MongoDB + Redis | Booking lifecycle, conflict detection, pricing |
| Application Service | Node.js | MongoDB + FS | Multi-step application workflow, file uploads |
| Notification Service | Node.js | MongoDB | Event-driven in-app notification center |
| AI Knowledge Service | **Python/FastAPI** | MongoDB + ChromaDB | RAG pipeline with citations |
| Nginx | — | — | TLS termination, static hosting |

### Event-Driven Data Flow (CQRS-lite)

Each service owns its data. Cross-service reads happen via **event-driven projections**, not direct DB access:

This gives us independent deployability and zero temporal coupling between services.

### Key Engineering Decisions

**Why event-driven over synchronous REST?**
Initial implementation used REST between Booking → Professional to fetch pricing. Refactored to an event-driven read model after recognizing temporal coupling — the Booking Service can now process bookings even if the Professional Service is offline for maintenance.

**Why Redis-backed sliding-window rate limiting?**
A fixed-window counter creates boundary-burst vulnerabilities. A sliding window using Redis sorted sets + atomic Lua scripts eliminates race conditions across multiple Gateway replicas.

**Why HMAC for internal service calls?**
Per [ADD §13](./docs/ADD.md), internal endpoints use `X-Internal-Auth` HMAC headers rather than JWT. This is cheaper than JWT verification and explicitly marks service-to-service boundaries.

**Why RAG with citations instead of direct LLM?**
Medical misinformation has real consequences. The AI Service is architected so that every answer is grounded in an admin-curated knowledge base, with inline citations the user can audit.