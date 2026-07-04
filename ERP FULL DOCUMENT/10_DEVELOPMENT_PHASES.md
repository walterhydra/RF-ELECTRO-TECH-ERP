# 10_DEVELOPMENT_PHASES.md — PCB Manufacturing ERP

> Client's timeline and budget are not fixed yet. This plan is built so it can be
> used as the basis for a client proposal: each phase is a shippable, demoable
> increment with its own rough effort estimate, so budget/timeline can be
> discussed phase-by-phase rather than as one big unknown number.

**How to use this document**: Effort estimates are in **developer-days**
assuming 1 experienced full-stack developer (adjust if a team is involved).
Ranges reflect real-world uncertainty from unanswered questions in
`MASTER_CONTEXT.md` Section 8 — narrow the range once those are answered.

---

## Phase 0 — Discovery & Foundation (before writing feature code)

**Goal**: Remove ambiguity, lock the data model, set up the skeleton.

- Walk the client through Section 8 open questions in `MASTER_CONTEXT.md`,
  get written answers.
- Finalize DB schema (ERD) for all Phase-1 entities.
- Decide tech stack (see `11_CODING_RULES.md`) and confirm hosting approach
  (see `12_DEPLOYMENT_AND_BACKUP_PLAN.md`) — on-prem factory server vs cloud
  matters a lot for a factory-floor system with patchy network.
- Set up repo, CI skeleton, environments (dev/staging), auth scaffolding.
- Low-fidelity wireframes for: Product Master form, Job Card view, shop-floor
  QR scan screen, Admin user management, Customer Portal.

**Estimated effort**: 5–8 developer-days
**Deliverable**: Signed-off schema + wireframes + working "empty shell" app
with login.

---

## Phase 1 — Core Master Data + Order-to-Job Pipeline (MVP backbone)

**Goal**: The straight-line paper trail works end-to-end, no shop-floor
complexity yet.

**Scope**:
- Product Master CRUD (all specs) + auto Spec Card No. generation
- Process Flow Template management (create ordered stage lists, reusable)
- Customer Master CRUD
- PO entry, linked to Product Spec Card, auto PO No.
- Job Card generation from PO (single card, no splitting yet)
- Basic Admin + role scaffolding (Master/Admin role only, hardcode a couple
  of process roles as placeholders)
- Basic list/detail views for all above

**Explicitly out of scope for this phase**: Sub-job splitting, stage
movement tracking, QR, reports, dispatch, customer portal.

**Estimated effort**: 12–18 developer-days
**Deliverable**: Demo — create a product, raise a PO against it, generate a
Job Card. This is the "walking skeleton" the client can see and validate the
business logic against before deeper investment.

---

## Phase 2 — Production Floor Engine (the heart of the system)

**Goal**: Real shop-floor traceability — this is the highest-value, highest-
complexity phase.

**Scope**:
- Sub-Job Card splitting (with quantity reconciliation enforcement)
- Process Flow execution engine: stage-by-stage movement, partial quantity
  forwarding, pending quantity tracking
- Process Movement Log (immutable, full audit fields: qty received/
  processed/forwarded/rejected + reason)
- Quantity validation/reconciliation rules (AC-4.4 from acceptance criteria)
- Full role-based access per process/department (real RBAC, not placeholder)
- Minimum 20 real user accounts, department-scoped

**Estimated effort**: 20–30 developer-days (this is the module most affected
by open questions — rework/back-flow handling especially can swing this
estimate significantly)
**Deliverable**: A Job Card can be launched, split, and walked through every
production stage with full quantity tracking and correct access control per
user role.

---

## Phase 3 — QR/Barcode + Reports + Traceability UI

**Goal**: Make Phase 2's data usable and scannable on the shop floor.

**Scope**:
- QR code generation per Job/Sub-Job Card (print-ready)
- QR scan flow — desktop (webcam/USB scanner) and mobile (camera)
- Scan → movement update / quantity confirmation / traceability view
- Traceability screen (full history timeline per card)
- Daily automated production reports (stage output, WIP, pending, lead time,
  productivity, rejection summary, dispatch status)
- On-demand custom-date-range reports

**Estimated effort**: 15–20 developer-days
**Deliverable**: Shop floor staff scan a QR code on their phone and update
production; managers see live daily reports.

---

## Phase 4 — Dispatch, Delivery & Notifications

**Goal**: Close the loop from factory gate to customer doorstep.

**Scope**:
- Dispatch marking + gate-out notification (channel: confirm with client —
  email/SMS/WhatsApp/push)
- Delivery partner mobile flow: mark delivered + status + date/time + photo
  upload + delivered-by
- Delivery confirmation notification
- State-machine enforcement (Launched → In-Process → Completed → Dispatched
  → Delivered)

**Estimated effort**: 8–12 developer-days (varies heavily based on
notification channel choice — WhatsApp Business API integration takes longer
than email)
**Deliverable**: End-to-end dispatch demo including photo-confirmed delivery.

---

## Phase 5 — Customer Portal

**Goal**: External-facing, security-critical module — built last so the
internal data model is stable before exposing it externally.

**Scope**:
- Customer login (separate auth realm from internal users)
- Scoped views: Production Status, Job Progress, Traceability, Current
  Stage, Pending Qty, EDD, Dispatch Status
- Strict data isolation (IDOR-proofing, per AC-10.1) — includes a dedicated
  security test pass
- EDD calculation logic (confirm with client how EDD should be computed —
  static per PO, or dynamically recalculated from current stage + historical
  stage lead times)

**Estimated effort**: 10–15 developer-days
**Deliverable**: A customer can log in and track their own order live,
guaranteed not to see anyone else's data.

---

## Phase 6 — Hardening, UAT & Go-Live

**Goal**: Production-readiness.

**Scope**:
- Full regression against `09_ACCEPTANCE_CRITERIA.md`
- Load testing (20+ concurrent internal users, realistic job card volume)
- Security review (auth, RBAC, customer portal isolation, QR endpoint abuse)
- Client UAT (User Acceptance Testing) cycle + bug-fix buffer
- Deployment per `12_DEPLOYMENT_AND_BACKUP_PLAN.md`
- Internal user training + documentation
- Data migration (if legacy Excel/system data exists — confirm scope)

**Estimated effort**: 10–15 developer-days
**Deliverable**: Live system, trained users, signed-off go-live.

---

## Summary Table

| Phase | Focus | Est. Effort (dev-days) |
|---|---|---|
| 0 | Discovery & Foundation | 5–8 |
| 1 | Master Data + Order-to-Job Pipeline | 12–18 |
| 2 | Production Floor Engine | 20–30 |
| 3 | QR/Barcode + Reports | 15–20 |
| 4 | Dispatch & Delivery | 8–12 |
| 5 | Customer Portal | 10–15 |
| 6 | Hardening, UAT, Go-Live | 10–15 |
| **Total** | | **80–118 dev-days** (~4–6 months solo, less with a team) |

> These numbers are a planning starting point, not a quote. Once Section 8
> open questions are answered and the client confirms scope (especially
> notification channel, offline mobile requirement, and rework/back-flow
> handling), tighten these ranges before committing to a client-facing
> timeline/budget.

## Suggested Approach for This Project

Given budget/timeline aren't fixed yet:
1. Use Phase 0 + Phase 1 as a **fixed-scope, fixed-price starter engagement**
   with the client — low risk for both sides, and it forces the open
   questions to get answered early.
2. Price Phases 2 onward once Phase 1 is delivered and both sides have a
   working reference point — production-engine complexity (Phase 2) is the
   biggest unknown and benefits most from being scoped after real client
   feedback on Phase 1.
