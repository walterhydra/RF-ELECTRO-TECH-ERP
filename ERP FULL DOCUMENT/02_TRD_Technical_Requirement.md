# PCB Manufacturing ERP — Master Technical Requirements Document (TRD)
### Phase 1 — Architecture, Data Model & API Design

| | |
|---|---|
| **Document Type** | Master TRD (merged from two prior drafts) — engineering companion to the Master PRD |
| **Companion Document** | `PCB_ERP_Master_Spec.md` (PRD) — every table/endpoint below traces back to an FR-ID defined there |
| **Project** | ERP for PCB Manufacturing |
| **Phase** | Phase 1 |
| **Status** | Ready for build — a few open technical decisions remain (§15) |
| **Version** | 1.0 (Merged) |
| **Date** | July 2026 |

---

## 0. Note to the Building Agent (Antigravity)

This is the engineering companion to `PCB_ERP_Master_Spec.md` (the PRD). Read the PRD first — it explains *why* the system is shaped this way (§2 of the PRD: variable-length process flows, batches that split and move at different speeds, append-only traceability). This document tells you *how* to build it.

How to use this document:
- Every table in §4 and every endpoint in §6 is tagged with the FR-ID it implements (e.g. `FR-4.2`) — cross-reference against the PRD if a requirement is unclear.
- **§5 (Stage Movement Engine) is the highest-risk, most important piece of the whole system.** Build and unit-test it in isolation, behind a dedicated service, before wiring up any UI. Everything else (reports, QR scan, customer portal) reads from the data it produces.
- §4's schema is the recommended target — treat field types/lengths as sensible defaults, adjust to your ORM's conventions, but keep the relationships and constraints intact.
- §15 lists open technical decisions. Where a default is stated, build against the default and leave the alternative easy to swap in — don't block on these.

---

## 1. Purpose & Relationship to the PRD

This document translates the PRD's functional requirements into concrete technical specifications: architecture, tech stack, database schema, API contracts, and module-wise implementation logic. Where a design decision was made specifically to satisfy a given FR, it's called out inline. This is what gets built from directly.

---

## 2. System Architecture

```
                        ┌──────────────────────┐
                        │   Customer Portal      │  (Web, read-only, isolated auth)
                        └──────────┬─────────────┘
                                   │
┌───────────────┐        ┌────────▼───────────┐        ┌───────────────────┐
│  Admin/ERP     │        │                     │        │  Mobile App / PWA  │
│  Web Dashboard │◄──────►│     REST API        │◄──────►│  (QR Scan, Stage   │
│  (React/Next)  │        │   (NestJS, /api/v1) │        │   Update, Delivery) │
└───────────────┘        └─────────┬───────────┘        └───────────────────┘
                                   │
                    ┌──────────────┼───────────────┐
                    │                              │
            ┌───────▼────────┐          ┌──────────▼─────────┐
            │  PostgreSQL      │          │  Object Storage      │
            │  (Primary DB)    │          │  (S3-compatible) —   │
            │                  │          │  photos, drawings,   │
            └──────────────────┘          │  spec card PDFs, QR  │
                    │                       └───────────────────┘
        ┌───────────▼─────────────┐
        │  Background Worker        │
        │  (BullMQ + Redis) —       │
        │  daily reports, notify,   │
        │  QR batch generation      │
        └───────────┬───────────────┘
                    │
        ┌───────────▼─────────────┐
        │  Notification Service     │
        │  (Push / Email / SMS —    │
        │   channel per §15)        │
        └───────────────────────────┘
```

**Single backend API** serves all three frontends (Admin Web, Mobile/PWA, Customer Portal), differentiated by auth role and scoped queries — not separate backends. This avoids duplicating the Stage Engine logic (§5) across services.

**Component breakdown:**
- **Web app (internal):** React/Next.js SPA, used by Admin, Production Manager, Process Users, Dispatch Users.
- **Customer Portal:** separate route/app, authenticated independently, strictly scoped queries — never trusts a client-supplied `customer_id`.
- **Mobile client:** used primarily for QR scanning on the shop floor and delivery confirmation. See §10 for the PWA vs. native decision.
- **API layer:** REST, organized into modules mirroring the PRD's structure (product, PO, job-card, movement, reports, dispatch, users, portal).
- **Database:** PostgreSQL, single schema for Phase 1 (multi-factory partitioning deferred — see PRD §5, out of scope).
- **Background worker:** daily report aggregation, notification queue, QR batch generation.
- **Object storage:** delivery photos, spec card PDFs, exported reports, product drawings.

### 2.1 Request Flow Example — Stage Movement via QR Scan

Walking through **FR-7.2** (scan-based movement update) end to end:

1. User scans a sub-job-card's QR code on the mobile app or web camera.
2. Client resolves the QR payload to a `sub_job_card_id` and calls `GET /api/v1/job-cards/sub/:id`.
3. API validates the requesting user's role has access to that sub-job-card's current process stage.
4. User enters quantity processed / forwarded / rejected and submits.
5. API writes an immutable row to `job_card_movement` (FR-5.1), and if a partial quantity is forwarded, creates a new `sub_job_card` row for the forwarded portion (FR-3.2/FR-4.2).
6. API recalculates and returns updated WIP figures; the background worker picks up the event for the next daily-report aggregation (FR-6.1).

---

## 3. Tech Stack

| Layer | Recommendation | Rationale |
|---|---|---|
| Backend framework | Node.js with NestJS | Modular architecture suits a multi-module ERP; built-in dependency injection and guards fit RBAC needs well |
| Database | PostgreSQL | Strong relational integrity for the Job Card ↔ Sub-Job Card ↔ Movement Log hierarchy; JSONB available for flexible spec fields if needed |
| Frontend (internal) | React + Next.js, Tailwind CSS | Fast for data/table-heavy dashboard UIs |
| Frontend (customer portal) | Next.js, route-isolated or separate app | Isolation reduces risk of cross-tenant data leakage |
| Mobile / scanning client | **PWA (React, camera API)** — see §10 for the alternative | Cross-platform without native app build/release overhead; matches Phase 1's online-first scope (PRD §13) |
| Auth | JWT with short-lived access tokens + refresh token rotation | Stateless, scales across web/mobile/portal clients |
| File storage | S3-compatible object storage | Delivery photos, QC documents, spec card PDFs, drawings |
| Background jobs | BullMQ + Redis | Daily report generation, notification dispatch, QR batch generation |
| Notifications | Firebase Cloud Messaging (push) + email (SMTP/SES); SMS/WhatsApp (Twilio) if confirmed | Channel choice pending client confirmation — PRD §14 |
| QR/Barcode generation | `qrcode` (npm) | Simple, no licensing cost |
| QR/Barcode scanning | `html5-qrcode` / device camera SDK | Works in-browser and in a PWA without a native app requirement |

> **Mobile client decision:** this table recommends a PWA to match Phase 1's online-first, no-native-app-overhead scope. If the client's factory-floor connectivity or camera-performance needs turn out to require a native app, React Native is the fallback (shared logic with the web team, better background offline-sync support). See §10 and §15.

---

## 4. Database Schema

PostgreSQL. All primary keys are UUIDs unless noted. All tables include `created_at`, `updated_at`, and `created_by` audit columns (omitted per-table below for brevity, but required).

### 4.1 `product_master` — one row per PCB product specification *(FR-1.1, FR-1.2)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| spec_card_no | VARCHAR(20), UNIQUE | Auto-generated, e.g. D001 — sequential, never reused |
| name | VARCHAR(255) | Product display name |
| pcb_size | VARCHAR(50) | |
| layers | SMALLINT | |
| thickness_mm | DECIMAL(5,2) | |
| copper_weight | VARCHAR(20) | e.g. 1oz, 2oz |
| solder_mask | VARCHAR(50) | |
| legend | VARCHAR(50) | |
| surface_finish | VARCHAR(50) | |
| process_flow_id | UUID (FK → `process_flow_master.id`) | Mandatory, set at creation |
| drawing_file_url | VARCHAR(500), nullable | Gerber/drawing attachment |
| status | ENUM(active, discontinued) | |

### 4.2 `process_flow_master` — named, reusable manufacturing sequence *(FR-4.1)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(255) | e.g. "Standard 10-stage multilayer flow" |
| total_steps | SMALLINT | Denormalized count, for quick display |

### 4.3 `process_flow_steps` — ordered steps within a flow *(FR-4.1)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| process_flow_id | UUID (FK → `process_flow_master.id`) | |
| step_order | SMALLINT | 1-based sequence — this is what makes flow length variable per product |
| process_name | VARCHAR(100) | e.g. Drilling, Plating, Etching |

### 4.4 `customer_po` — customer purchase order *(FR-2.1)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| po_no | VARCHAR(50), UNIQUE | e.g. P001 |
| customer_id | UUID (FK → `customers.id`) | |
| product_id | UUID (FK → `product_master.id`) | Spec card link, mandatory |
| order_qty | INTEGER | In panels |
| po_date | DATE | |
| edd | DATE | Estimated delivery date, shown on customer portal |
| status | ENUM(open, in_production, completed, dispatched, closed) | |

### 4.5 `job_card` — production job for the full PO quantity *(FR-3.1)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| job_card_no | VARCHAR(30), UNIQUE | e.g. JC001 |
| po_id | UUID (FK → `customer_po.id`) | |
| total_qty | INTEGER | Always equals linked PO quantity |
| process_flow_id | UUID (FK → `process_flow_master.id`) | Copied from product at launch |
| status | ENUM(pending, launched, in_progress, completed, dispatched) | |
| qr_code_value | VARCHAR(100), UNIQUE | |
| launched_at | TIMESTAMPTZ, nullable | |

### 4.6 `sub_job_card` — splittable production unit tracked stage by stage *(FR-3.2)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| parent_job_card_id | UUID (FK → `job_card.id`) | |
| sub_job_card_no | VARCHAR(30), UNIQUE | e.g. JC001-1 |
| qty | INTEGER | Quantity currently held in this sub-card |
| current_stage_id | UUID (FK → `process_flow_steps.id`), nullable | |
| status | ENUM(at_stage, forwarded, completed, rejected_closed, dispatched) | |
| qr_code_value | VARCHAR(100), UNIQUE | |
| split_from_movement_id | UUID (FK → `job_card_movement.id`), nullable | Traces which movement event created this split |

> **Constraint:** `SUM(sub_job_card.qty for a job_card) <= job_card.total_qty` — enforce at the application layer **and** with a DB check/trigger.

### 4.7 `job_card_movement` — immutable log of every stage transition; core traceability table *(FR-5.1)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| sub_job_card_id | UUID (FK → `sub_job_card.id`) | |
| process_id | UUID (FK → `process_flow_steps.id`) | |
| user_id | UUID (FK → `users.id`) | |
| movement_datetime | TIMESTAMPTZ | Auto |
| qty_received | INTEGER | |
| qty_processed | INTEGER | |
| qty_forwarded | INTEGER | Must be `<= qty_processed` |
| qty_rejected | INTEGER | Default 0 |
| rejection_reason | VARCHAR(255), nullable | Required if `qty_rejected > 0` |
| forwarded_to_sub_job_card_id | UUID (FK → `sub_job_card.id`), nullable | Set when a partial forward creates a new split |

> **No UPDATE/DELETE grants on this table at the database role level** — insert-only, to guarantee traceability integrity. Corrections must be new compensating entries, never edits.

### 4.8 `dispatch` — outbound shipment and delivery confirmation *(FR-8.1, FR-8.2)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| job_card_id | UUID (FK → `job_card.id`) | |
| dispatched_qty | INTEGER | |
| dispatched_at | TIMESTAMPTZ | |
| dispatched_by | UUID (FK → `users.id`) | |
| delivery_status | ENUM(in_transit, delivered, failed) | |
| delivery_datetime | TIMESTAMPTZ, nullable | |
| delivery_photo_url | VARCHAR(500), nullable | Object storage URL — mandatory to mark as delivered |
| delivered_by | VARCHAR(100), nullable | Delivery partner / person name |

### 4.9 `users` / `roles` / `permissions` — internal, process-scoped RBAC *(FR-9.1)*
| Field | Type | Notes |
|---|---|---|
| users.id | UUID (PK) | |
| users.name / email / phone | | |
| users.role_id | UUID (FK → `roles.id`) | |
| users.assigned_process_id | UUID (FK → `process_flow_steps.id`), nullable | Set for Process Users; null for Admin/Production Manager |
| users.password_hash | VARCHAR(255) | bcrypt |
| users.is_active | BOOLEAN | |
| roles.id | UUID (PK) | |
| roles.name | VARCHAR(50) | admin, production_manager, process_user, dispatch_user |
| permissions | join table `role_id ↔ permission_key` | Enforced via guards on every endpoint |

### 4.10 `customers` / `customer_portal_access` — scoped external login *(FR-10.1)*
| Field | Type | Notes |
|---|---|---|
| customers.id | UUID (PK) | |
| customers.company_name | VARCHAR(255) | |
| customer_portal_access.id | UUID (PK) | |
| customer_portal_access.customer_id | UUID (FK → `customers.id`) | |
| customer_portal_access.email | VARCHAR(255), UNIQUE | |
| customer_portal_access.password_hash | VARCHAR(255) | Logically separate credential store from internal `users` |
| customer_portal_access.last_login_at | TIMESTAMPTZ, nullable | |

### 4.11 `daily_report_snapshots` — pre-aggregated report cache *(FR-6.1, see §7)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| report_date | DATE | |
| report_type | VARCHAR(50) | e.g. stage_output, wip, rejection_summary |
| payload | JSONB | Pre-aggregated data for fast dashboard load |
| generated_at | TIMESTAMPTZ | |

---

## 5. Core Logic: Stage Movement Engine (Module 4) — Most Critical Component

**Problem it solves:** a Job Card's quantity moves through a variable-length, product-specific sequence of stages, and can move *partially* — some quantity forwards while the rest stays behind. This is **FR-4.1 / FR-4.2** made concrete.

**Recommended implementation approach:**

1. On Job Card launch → system reads `process_flow_steps` for the job's `process_flow_id` → determines the stage sequence.
2. System creates initial `sub_job_card` record(s) — either the full quantity as one sub-card, or pre-split by the user at launch (see the client's own example of manually creating JC001-1 through JC001-10) — all starting at `step_order = 1`.
3. **Stage Update API** (`POST /api/v1/movements`) accepts:
   ```json
   {
     "sub_job_card_id": "uuid",
     "qty_processed": 500,
     "qty_forwarded": 500,
     "qty_rejected": 0,
     "rejection_reason": null
   }
   ```
4. Backend logic:
   - Validate `qty_processed <= current remaining qty of that sub-job-card at this stage`.
   - Validate `qty_forwarded <= qty_processed`, and `qty_rejected` accounted for within `qty_processed`.
   - Write a `job_card_movement` row (immutable — insert-only).
   - If `qty_forwarded < sub_job_card.qty` → **split the sub-job-card**: create a new `sub_job_card` record (auto-numbered, e.g. `JC001-1a`) for the forwarded portion, set its `current_stage_id` to the next step; the remaining qty stays on the original record at the same stage. Set `split_from_movement_id` on the new record and `forwarded_to_sub_job_card_id` on the movement row.
   - If `qty_forwarded == sub_job_card.qty` → simply advance `current_stage_id` to the next stage in the flow.
   - If the current stage is the last in the flow and the full quantity is forwarded → mark `sub_job_card.status = completed`.
   - When all sub-job-cards under a job card are `completed` → mark the parent `job_card.status = completed`.
5. **Rejected quantity** is logged but does not forward — tracked separately for the Rejection Summary report. Per PRD §13 (assumption), rejected quantity is treated as scrapped by default; if the client confirms rework should be supported, model it as a new movement entry re-entering the same stage, not an automatic system behavior.

> **Build this as a standalone service** (e.g. `StageEngineService`), called from Web, Mobile/QR scan, and any future bulk-upload path — keep it out of controllers so the logic is never duplicated. Write thorough unit tests for the split/advance/complete logic **before** building UI on top of it (see Risk #1, §14).

---

## 6. API Design

REST API, versioned under `/api/v1`. All endpoints (except `/auth/login`) require a valid JWT. Customer portal endpoints live under a separate `/api/v1/portal` namespace with an independent auth guard that injects and enforces `customer_id` server-side.

### 6.1 Product Master
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/v1/products` | Create product master, auto-generates `spec_card_no` | Admin |
| GET | `/api/v1/products/:id` | Fetch product with full spec and process flow | Admin, Production Manager |
| GET | `/api/v1/products` | List/search products | Admin, Production Manager |

### 6.2 Customer PO
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/v1/purchase-orders` | Create PO, requires `product_id` | Admin |
| GET | `/api/v1/purchase-orders/:id` | Fetch PO with linked spec card and job card status | Admin, Production Manager |

### 6.3 Job Cards
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/v1/job-cards` | Generate a Job Card from a PO | Admin, Production Manager |
| POST | `/api/v1/job-cards/:id/launch` | Launch the Job Card into Stage 1 | Admin, Production Manager |
| POST | `/api/v1/job-cards/:id/split` | Manually pre-split into sub-job-cards ahead of/at launch | Admin, Production Manager |
| GET | `/api/v1/job-cards/:id` | Fetch Job Card with all sub-job-cards and current stages | Admin, Production Manager, Process User |
| GET | `/api/v1/job-cards/sub/:id` | Fetch a single sub-job-card (used by QR scan resolve) | Admin, Production Manager, Process User |
| GET | `/api/v1/job-cards/:id/qr` | Get QR code image | Admin, Production Manager, Process User |

### 6.4 Stage Movement
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/v1/movements` | Log a stage movement (§5); auto-creates a split sub-job-card on partial forward | Process User (own stage only) |
| GET | `/api/v1/movements/sub-job-card/:id` | Full chronological movement history for one sub-job-card | Admin, Production Manager, Customer (own only, via `/portal`) |

### 6.5 Reports
| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/v1/reports/daily` | Daily production report (stage-wise output, WIP, pending qty) | Admin, Production Manager |
| GET | `/api/v1/reports/wip` | Work-in-progress report | Admin, Production Manager |
| GET | `/api/v1/reports/lead-time` | Lead time per Job Card | Admin, Production Manager |
| GET | `/api/v1/reports/rejections` | Rejection summary, filterable by date/stage/product | Admin, Production Manager |
| GET | `/api/v1/reports/export` | Export any report as PDF/Excel | Admin, Production Manager |

### 6.6 Dispatch
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/v1/dispatch` | Record gate dispatch, triggers notification | Dispatch User |
| POST | `/api/v1/dispatch/:id/deliver` | Record delivery confirmation with mandatory photo upload | Dispatch User, Mobile |

### 6.7 Users & Auth
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Issues JWT + refresh token | Public |
| POST | `/api/v1/users` | Admin creates a user with role and process assignment | Admin |
| PATCH | `/api/v1/users/:id/deactivate` | Deactivate a user | Admin |

### 6.8 Customer Portal (`/api/v1/portal`)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/v1/portal/auth/login` | Customer login, separate credential store | Public (customer) |
| GET | `/api/v1/portal/orders` | List orders for the authenticated customer only | Customer |
| GET | `/api/v1/portal/orders/:id/status` | Stage, pending qty, EDD, dispatch status for one order | Customer (scoped) |

**Authorization rule (critical):** every endpoint must check `req.user.role` AND, for Process Users, that `assigned_process_id` matches the stage being updated; for Customers, that the resource's `customer_id` matches `req.user.customer_id`. This must be enforced **server-side**, never trusted from the frontend or accepted as a request parameter — this directly satisfies **FR-10.1**'s hard requirement from the PRD.

---

## 7. Reports — Implementation Notes

- Run as a **nightly scheduled job** (e.g. 11:59 PM) that pre-aggregates data into `daily_report_snapshots` (§4.11) for fast dashboard loading.
- Also expose an **on-demand recalculation** path for a "live" view during the day (query `job_card_movement` directly, filtered by date) — decide sync-vs-background based on report export volume (§15).
- Suggested aggregation queries:
  - **Stage-wise output:** `SUM(qty_processed) GROUP BY process_id, DATE(movement_datetime)`
  - **WIP:** `SUM(qty) FROM sub_job_card WHERE status = 'at_stage'`, grouped by stage
  - **Lead time:** `job_card.completed_at - job_card.launched_at`
  - **Rejection summary:** `SUM(qty_rejected) GROUP BY process_id, rejection_reason`

---

## 8. QR Code Implementation Notes

- Generate a QR code at Job Card / Sub-Job Card creation, encoding the record's unique ID (not sensitive data) — e.g. `https://yourdomain.com/scan/JC001-1` or the raw ID for offline resolution.
- Store the QR image (PNG/SVG) in object storage, referenced via `qr_code_value`.
- Scan flow (mobile/web camera): decode → resolve ID → fetch current stage/status → show a **Stage Update form** pre-filled with that sub-job-card's remaining quantity → operator submits → hits `POST /api/v1/movements`.
- For physical label printing: confirm label size/printer with the client (PRD §14, open question) before finalizing QR pixel dimensions.

---

## 9. Security & RBAC Implementation

- JWT-based auth with short-lived access tokens and refresh token rotation.
- Every endpoint declares its required role(s)/permission(s) via a guard middleware; Process Users are additionally filtered by `assigned_process_id` at the query level, not just at the route level.
- Customer Portal queries always derive `customer_id` from the authenticated session — never accepted as a request parameter. This closes the cross-customer data-leak risk called out in the PRD (**FR-10.1**).
- Passwords hashed with bcrypt; portal and internal credential stores are logically separate (`customer_portal_access` vs. `users`).
- All write operations are recorded with `created_by`/`updated_by` for audit purposes.
- `job_card_movement` rows are **insert-only at the database level** (no UPDATE/DELETE grants for the application role) to guarantee traceability integrity — this is a DB-level control, not just an application-level one.
- HTTPS everywhere; encrypt the file storage bucket for delivery photos.
- Audit log table for login events and admin actions (user creation, role changes).

---

## 10. Mobile Client & Offline Handling

The PRD (§9, §13) flags weak/no Wi-Fi in some shop-floor zones and sets **online-only as the Phase 1 default**, with offline-first sync as a Phase 2 stretch goal. Build so that adding offline support later doesn't require a rewrite:

- Prefer a **PWA client** (per §3) for Phase 1 — lower build/release overhead, works cross-platform.
- Design the `POST /api/v1/movements` call to accept a **client-generated request UUID** (idempotency key) from day one, even though offline queuing isn't built yet — this makes it trivial to add local queuing (IndexedDB) and safe retry-on-reconnect later without changing the API contract.
- If offline support is pulled into Phase 1 (client decision, §15): queue stage-update submissions locally on failure, auto-sync on reconnect, and show a clear "pending sync" indicator so the operator knows their update hasn't reached the server yet. Server-side idempotency (via the request UUID above) prevents duplicate movement log entries on resync.
- If shop-floor camera performance or offline needs turn out to demand it, **React Native** is the fallback mobile stack (shared logic with the web team, native camera + QR scanning, single codebase for iOS/Android) — see §3.

---

## 11. Non-Functional Technical Requirements

| Category | Requirement |
|---|---|
| **Performance** | Movement-log write P95 latency under 500ms; QR scan-to-confirm end-to-end under 2 seconds on factory Wi-Fi |
| **Scalability** | API stateless and horizontally scalable behind a load balancer; DB connection pooling (e.g. PgBouncer) |
| **Availability** | 99% uptime target during production shifts; daily automated DB backups with point-in-time recovery |
| **Observability** | Structured (JSON) logging + centralized log aggregation; error tracking (e.g. Sentry or equivalent) |
| **Data integrity** | DB-level CHECK constraints enforcing `qty_forwarded <= qty_processed` and `qty_processed <= qty_received` |
| **Environments** | Separate dev, staging, and production environments with isolated databases |

---

## 12. Deployment Architecture

- Containerized services (Docker) for the API and background worker, deployed via a CI/CD pipeline.
- PostgreSQL managed instance with automated backups; read replica for reporting queries (deferred to Phase 2 if initial load is low).
- Redis instance for the BullMQ job queue and caching.
- Object storage bucket with signed URLs for delivery photos and generated report exports.
- Mobile client (if PWA: standard web deploy; if native, per §10) distributed via an internal track (TestFlight/Play Console) for factory-floor devices.

---

## 13. Milestone → Technical Task Breakdown

Cross-referenced to the PRD's Milestones (§11 of the PRD).

| Milestone | Key Technical Tasks |
|---|---|
| M1: Product Master + Flow + Users | DB schema §4.1–4.3, 4.9; Admin CRUD UI; RBAC guard middleware |
| M2: PO + Job Card + Splitting | DB schema §4.4–4.6; split validation logic; QR generation |
| M3: Stage Engine + Traceability + QR scan | `StageEngineService` (§5); scan UI; movement log API (§6.4) |
| M4: Reports Dashboard | Aggregation queries (§7); scheduled job; dashboard charts |
| M5: Dispatch + Notifications | DB schema §4.8; notification service integration; photo upload |
| M6: Customer Portal | Scoped auth guard; portal UI; live status endpoints (§6.8) |
| M7: UAT | End-to-end testing; bug fixing; load testing on the Stage Engine |

---

## 14. Technical Risks to Flag Early

1. **Stage Engine correctness** — partial-quantity splitting logic is easy to get wrong, and data-integrity bugs here mean wrong production numbers company-wide. Write thorough unit tests before building any UI on top of it.
2. **Offline sync conflicts** — if two operators update the same sub-job-card while offline (should offline support be pulled into Phase 1), a conflict-resolution strategy is needed.
3. **QR label printing hardware** — not yet confirmed with the client; could add unexpected integration work (label printer drivers).
4. **Scale of movement logs** — with ~20 users logging multiple times daily across many job cards, `job_card_movement` grows fast; index on `sub_job_card_id` and `movement_datetime` from day one.
5. **Accounts-module ambiguity** — if Finance turns out to be in-scope later, review this schema for extensibility now (e.g. how `dispatch`/`customer_po` would link to future invoice tables), so it isn't a rework.

---

## 15. Open Technical Decisions

1. **Mobile stack:** confirm whether offline scan queuing is needed for Phase 1, given intermittent factory-floor connectivity — this decides PWA (§3 default) vs. React Native, and how much of §10's offline design gets built now vs. later.
2. **Concurrent user count** on the shop floor — needed to size the DB connection pool and API instance count correctly.
3. **Report export volume/frequency** — decides whether report generation stays synchronous or is fully offloaded to the background worker (§7).
4. **Notification channel** — Push/Email vs. SMS/WhatsApp (Twilio) — pending the client's answer in PRD §14.
5. **Rejected-quantity rework** — if the client confirms rework should be supported (PRD §14, item 1), the Stage Engine (§5) needs a defined re-entry path back into the same stage; not built by default.

---

## 16. Next Steps

1. Resolve the PRD's Open Questions (§14 of the PRD) — several directly affect this schema (e.g. PO↔Product cardinality, rejected-qty rework logic, mobile stack per §15 above).
2. Set up the repo, CI/CD, and dev/staging environments.
3. Build the DB schema (§4) and run through it with sample data manually before writing API code.
4. Build and unit-test the **Stage Engine (§5)** in isolation first — it's the highest-risk component in the whole system.
5. Proceed per the Milestone breakdown (§13).
