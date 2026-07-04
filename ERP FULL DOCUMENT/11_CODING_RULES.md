# 11_CODING_RULES.md — PCB Manufacturing ERP

> Engineering conventions for this project. Goal: any developer (or an AI coding
> assistant) picking up this codebase after a break can understand it in minutes,
> and the production traceability data can never silently corrupt.

---

## 1. Suggested Tech Stack

(Adjust to your actual comfort zone — you said you're an experienced web
developer, so pick what you're fastest in. This is a sane default.)

- **Backend**: Node.js + Express (or NestJS for stronger structure) — REST API.
  Alternative: Django/DRF if you're more comfortable in Python.
- **Database**: PostgreSQL — relational integrity matters a lot here (quantity
  reconciliation, sequential numbering, audit trails). Avoid NoSQL for the
  core transactional data.
- **Frontend (Admin/Desktop web app)**: React + TypeScript (Vite or Next.js).
- **Mobile (shop floor + delivery partner)**: Start with a **PWA (mobile-
  responsive web app with camera access for QR scanning)** rather than native
  apps for Phase 1 — much faster to ship, works on both desktop and mobile.
  Move to React Native only if client specifically needs offline-first native
  behavior.
- **QR Code**: generate server-side (e.g. `qrcode` npm package) at Job Card
  creation; scan client-side via browser camera API (e.g. `html5-qrcode`).
- **Auth**: JWT-based, with separate token scopes for Internal Users vs
  Customer Portal users (never share a single auth realm between them).
- **File storage** (delivery photos, etc.): S3-compatible object storage, not
  in the database.
- **Notifications**: abstract behind a single `NotificationService` interface
  so email/SMS/WhatsApp can be swapped without touching business logic.

---

## 2. Project Structure (backend example — adapt to chosen stack)

```
/src
  /modules
    /product-master
    /process-flow
    /purchase-order
    /job-card
    /process-tracking
    /reports
    /qr
    /dispatch
    /users
    /customer-portal
  /shared
    /middleware      (auth, RBAC guard, error handler, audit logger)
    /validators
    /utils
  /db
    /migrations
    /seeds
  /config
```

**Rule**: One module = one business capability from `MASTER_CONTEXT.md`
Section 7. Don't scatter Job Card logic across multiple modules.

---

## 3. Database Rules (non-negotiable — this is a traceability system)

1. **Every table has**: `id`, `created_at`, `created_by`, `updated_at`,
   `updated_by`. No exceptions.
2. **Never hard-delete** production data (Job Cards, Movement Logs, Dispatch
   Records). Use `is_active`/`deleted_at` soft-delete flags. Only true
   master/reference data with zero transactional history may be hard-deleted.
3. **Movement Log table is append-only.** No `UPDATE` or `DELETE` statements
   against it anywhere in application code except by a documented, admin-only
   "correction entry" flow that itself is logged.
4. **Sequential numbers (Spec Card, PO, Job Card) must use DB-level
   sequences or transactions with row locking** — never generate numbers by
   "count rows + 1" in application code (race condition risk with concurrent
   users = duplicate numbers, which breaks traceability).
5. **All quantity fields are integers** (panel counts, not fractions) unless
   the client confirms fractional units are needed.
6. **Foreign keys are enforced at the DB level**, not just in application
   code. A Job Card must not exist without a valid PO reference.
7. **Migrations are version-controlled** and never edited after being
   applied to any shared environment — write a new migration to fix a
   mistake.
8. **Quantity reconciliation constraints**: wherever possible, use DB check
   constraints or triggers as a last line of defense (e.g., forwarded +
   rejected ≤ received) in addition to application-level validation —
   defense in depth, because this data must never be wrong.

---

## 4. API Design Rules

1. RESTful resource naming: `/api/v1/job-cards`, `/api/v1/job-cards/:id/movements`,
   not verb-based URLs.
2. Every write endpoint requires authentication + RBAC check — no endpoint is
   "internal only by convention," enforce it in middleware.
3. Every write endpoint logs the acting user and timestamp automatically via
   shared audit middleware — don't rely on each module remembering to do this.
4. Customer Portal endpoints are **entirely separate route namespace**
   (`/api/v1/portal/...`) with their own auth middleware that injects and
   enforces `customer_id` scoping on every query — never trust a customer_id
   passed in the request body/params.
5. Validate quantity math server-side always, even if the frontend already
   validated it — never trust client input for integrity-critical data.
6. Return consistent error shapes (`{ error: { code, message } }`) so
   frontend and mobile can handle errors uniformly.
7. Version the API from day 1 (`/v1/`) — production systems live a long time
   and will need breaking changes eventually.

---

## 5. RBAC Implementation Rule

- Do not hardcode `if (user.role === 'admin')` scattered through business
  logic. Build a central `can(user, action, resource)` permission checker
  used everywhere, backed by a Role/Permission table (per `MASTER_CONTEXT.md`
  Section 5) — this lets Admin manage roles later without code changes.
- Process-level scoping (a user only sees their assigned process's job
  cards) is enforced **in the query layer**, not just hidden in the UI.

---

## 6. Frontend Rules

1. TypeScript everywhere — no implicit `any`, especially for quantity and ID
   fields (a `string` vs `number` mismatch on a Job Card ID is exactly the
   kind of bug that corrupts traceability data).
2. Shared component library for shop-floor screens (large touch targets — QR
   scan and quantity entry happen on factory-floor phones, often with gloves
   / poor lighting; see `frontend-design` conventions for visual polish).
3. Quantity entry forms must show live reconciliation feedback (e.g. "500
   received, you've entered 300 forwarded + 250 rejected = 550, exceeds
   received" as an inline error) before allowing submit.
4. Never store business logic only in the frontend — it must be re-validated
   server-side (Rule 4.5 above). Frontend validation is UX sugar, not the
   source of truth.

---

## 7. Git / Workflow Rules

1. Branch naming: `feature/job-card-splitting`, `fix/qty-reconciliation-bug`.
2. No direct commits to `main`/`production` branch — PR review required, even
   solo (self-review via PR diff catches mistakes).
3. Commit messages reference the module (e.g. `[process-tracking] add
   rejection reason validation`).
4. Every PR touching Movement Log, Job Card, or Dispatch logic must
   explicitly state in the PR description which Acceptance Criteria (from
   `09_ACCEPTANCE_CRITERIA.md`) it satisfies.
5. `MASTER_CONTEXT.md` is updated whenever a client answer changes an
   assumption — treat it as living documentation, not a one-time file.

---

## 8. Testing Rules

1. **Quantity reconciliation logic gets unit tests before anything else** —
   this is the module where a silent bug does the most damage.
2. Integration tests for the full Job Card lifecycle: create → split → move
   through all stages → complete → dispatch → deliver.
3. Security test suite specifically for Customer Portal isolation (attempt
   cross-customer data access via direct ID manipulation) — run on every
   deploy, not just once.
4. Load test before go-live: simulate 20+ concurrent users scanning/updating
   job cards simultaneously — this is where sequential-numbering race
   conditions and DB locking issues surface.

---

## 9. Documentation Rules

1. Every module's README documents: its DB tables, its API endpoints, and
   which Acceptance Criteria it implements.
2. Any deviation from `MASTER_CONTEXT.md` must be documented with a reason
   and, if it changes client-facing behavior, confirmed with the client.
