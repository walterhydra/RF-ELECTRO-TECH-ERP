# PCB Manufacturing ERP — Master Role & Permission Matrix
## Consolidated RBAC Specification (v0.2) — for implementation by AI coding agent

| | |
|---|---|
| **Document Type** | Role Permission Matrix (RBAC Specification) — merged master version |
| **Merged From** | `PCB_Manufacturing_ERP_Role_Permission_Matrix.md` (v0.1, backend-focused) + `Role_Permission_Matrix.docx` (business/module-focused) + client's verbal ERP flow description |
| **Status** | Draft — ready to hand to dev agent for backend auth middleware, frontend route guarding, and DB schema |
| **Version** | 0.2 |
| **Date** | July 2026 |

> **Note to whoever implements this (e.g. Antigravity):** This file is the single source of truth. Section 2 gives you the end-to-end business flow so the permission rules in Sections 5–8 make sense in context. Section 12 has direct implementation notes. Where the two source documents disagreed, the more restrictive/precise version was kept and the conflict is logged in Section 11 (Open Items) rather than silently resolved.

---

## 1. Purpose

Defines exactly which of the 10 user roles can Create / Add-Update / View / Scan / act-on-Own-data-only / has-No-access for every module and every finer-grained action in the PCB Manufacturing ERP. This is the reference for:
- Backend auth middleware (every rule must be enforced **server-side**, never trust frontend role claims)
- Frontend route guarding / conditional UI rendering
- QA test-case generation

---

## 2. ERP Business Flow (context reference)

This section exists so the permission rules below make sense — it is the client's described end-to-end flow, condensed.

1. **Product Creation** — A Product Master is created with full specs (size, layers, thickness, copper, solder mask, legend, surface finish, process flow). Saving it auto-generates a **Product Specification Card No.** (e.g. `D001`).
2. **Customer PO** — A customer PO is entered and linked to a Product Specification Card (e.g. PO `P001` → linked to `D001`).
3. **Job Card Generation** — Based on order qty, a **Job Card** is generated (e.g. `JC001` for 1000 panels). The Job Card can be **split into Sub-Job Cards** for parallel/partial movement (e.g. `JC001-1` … `JC001-10`).
4. **Process Flow** — The Product Specification Card defines the full stage sequence (e.g. 10 stages). A Job/Sub-Job Card entering Stage-1 = production **launched**. Sub-Job Cards move independently between stages as each batch/partial-qty completes (e.g. `JC001-1..5` move to Stage-2 while `JC001-6..10` remain in Stage-1).
5. **Process Tracking** — Every movement logs: Date/Time, User, Process Name, Qty Received, Qty Processed, Qty Forwarded, Qty Rejected, Rejection Reason. This is the traceability backbone.
6. **Production Reports** — Auto-generated: stage-wise output, pending qty per stage, WIP, job launch status, lead time per Job Card, process-wise productivity, rejection summary, dispatch status.
7. **QR Code / Barcode** — Every Job/Sub-Job Card has a unique QR/barcode, scannable from **both desktop and mobile**, driving movement, production update, qty confirmation, and traceability.
8. **Dispatch & Delivery** — Gate-out dispatch auto-notifies the responsible person. On delivery, the app records Delivery Status, Date/Time, Confirmation Photo, Delivered-By, and fires a delivery-confirmed notification.
9. **User Management** — 1 Master/Admin + one account per production process/stage (Stage-1…Stage-10, minimum 20 internal accounts total across all departments in Phase 1) + department-wise roles. Each user only accesses functions for their assigned process/department.
10. **Customer Portal** — Each customer gets a dedicated login limited strictly to their own PO(s): production status, job progress, traceability, current stage, pending qty, EDD, dispatch/delivery status. Zero visibility into other customers' data.

---

## 3. Roles Summary

10 roles total (merged — the earlier 5-role backend draft is expanded to match the actual department structure described by the client).

| Backend Role Code | Human Label | Who | Scope | (was called, in earlier 5-role draft) |
|---|---|---|---|---|
| `SUPER_ADMIN` | Super Admin *(Master User)* | Business owner / ERP super-user | Full system access. Recommended: 1 user only. | `ADMIN` |
| `SALES_PO_EXECUTIVE` | Sales / PO Executive | Handles customer relationship & order entry | PO entry, dispatch/delivery visibility, reports for their scope | *new* |
| `PRODUCT_ENGINEER` | Planning & Product Engineer | Product/process design | Product Master + Process Flow Configuration | *new (was folded into ADMIN)* |
| `PRODUCTION_PLANNER` | Production Planner | Shop-floor oversight | Job Card / Sub-Job Card generation, cross-stage visibility, no user/master-data mgmt | `PRODUCTION_MANAGER` |
| `PROCESS_OPERATOR` | Process Operator | One account per manufacturing stage (Stage-1…Stage-10) | Only their own assigned stage's job cards — scan/update only | `PROCESS_USER` |
| `QC_OFFICER` | QC / Quality Officer | Quality review | Rejection approval/sign-off, quality reports | *new* |
| `STORE_DISPATCH` | Store & Dispatch User | Gate/logistics staff | Dispatch creation, QR scan at gate, delivery confirmation | `DISPATCH_USER` |
| `ACCOUNTS_FINANCE` | Accounts / Finance User | Billing (future phase) | Invoicing linked to dispatch, view PO/dispatch data relevant to billing | *new* |
| `MIS_VIEWER` | Management (MIS Viewer) | Leadership | View-only across every module and report, zero write access | *new* |
| `CUSTOMER` | Customer (Portal) | External, per-company login | Read-only, own data only | `CUSTOMER` |

> **Enforcement rule (non-negotiable):** every permission below must be checked **server-side** on every request. `PROCESS_OPERATOR` scope requires an `assigned_stage_id` match, `CUSTOMER` scope requires a `customer_id` match, `STORE_DISPATCH` "own dispatch" scope requires a `dispatched_by = user.id` match — all three derived from the JWT, **never** from request params/body.

---

## 4. Legend

| Code | Meaning | Backend Interpretation |
|---|---|---|
| **F** | Full Access | Create, Read, Update, Delete/Deactivate, Approve — all allowed |
| **A** | Add / Update | Insert + edit records, **no delete/deactivate** |
| **V** | View Only | Read-only, no write of any kind |
| **S** | Scan / Update | Restricted write via QR/barcode scan flow only (not general CRUD forms) |
| **O** | Own Data Only | Access restricted to records scoped to the user (own stage / own customer_id / own dispatched_by) |
| **–** | No Access | Module/route hidden and blocked server-side |

---

## 5. Module-Level Permission Matrix

Columns: `SA`=SUPER_ADMIN · `SPE`=SALES_PO_EXECUTIVE · `PE`=PRODUCT_ENGINEER · `PP`=PRODUCTION_PLANNER · `OP`=PROCESS_OPERATOR · `QC`=QC_OFFICER · `SD`=STORE_DISPATCH · `AF`=ACCOUNTS_FINANCE · `MIS`=MIS_VIEWER · `CU`=CUSTOMER

| Module / Function | SA | SPE | PE | PP | OP | QC | SD | AF | MIS | CU |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Product Master** — specs, spec card generation | F | V | F | V | – | V | – | – | V | – |
| Deactivate Product *(destructive — Admin only, even though PE has create/edit)* | F | – | – | – | – | – | – | – | – | – |
| **Process Flow Configuration** — define stage sequence per product | F | – | F | V | – | V | – | – | V | – |
| **Customer & PO** — create/edit customer, PO entry, link PO → Spec Card | F | F | V | V | – | – | – | V | V | 🔒 own only |
| **Job Card Generation** — create Job Card from PO qty | F | V | V | F | – | – | – | – | V | – |
| **Sub-Job Card Split** — divide Job Card into JC-1, JC-2… | F | – | – | F | – | – | – | – | V | – |
| **Process / Stage Movement** — move Job/Sub-Job Card stage-to-stage (QR scan) | F *(any stage, override)* | – | – | V + F-override *(any stage)* | S *(own assigned stage only)* | O *(rejection entries only, see §6)* | – | – | V | – |
| **Qty Confirmation** — received / processed / forwarded / rejected | F | – | – | V | O *(own stage)* | O *(rejection review)* | – | – | V | – |
| **Rejection Management** — reason capture + approval | F | – | – | V | A *(can raise, cannot approve own)* | F *(approve/sign-off)* | – | – | V | – |
| **QR Code / Barcode** — generation & scanning (desktop + mobile) | F | – | – | V | S *(own stage jobs only)* | S *(rejection-flagged scans)* | S *(dispatch-relevant only)* | – | – | – |
| **Production Reports** — stage output, WIP, lead time, rejection, launch status, productivity | F | V | V | V | – | V | V *(own dispatch entries)* | V | V | – |
| **Dispatch Management** — gate-out entry, notify responsible person | F | V | – | – | – | – | F | V | V | – |
| **Delivery Confirmation** — status, date/time, photo, delivered-by | F | V | – | – | – | – | A | V | V | V *(own only)* |
| **Accounts / Invoicing** — billing linked to dispatch *(future phase)* | F | V | – | – | – | – | – | F | V | – |
| **User Management** — create users, assign role/stage, deactivate | F | – | – | – | – | – | – | – | – | – |
| **View Audit Logs** | F | – | – | – | – | – | – | – | – | – |
| **Customer Portal** — own order status, traceability, EDD, dispatch/delivery | F | V | – | – | – | – | – | – | V | O *(own only)* |
| **Edit Own Profile** | – | – | – | – | – | – | – | – | – | O *(own only)* |

---

## 6. Field-Level / Data-Scope Rules (the part a module-access table can't capture)

These are the rules the backend middleware/query layer must implement precisely — this is where most real-world RBAC bugs live.

| # | Rule | Applies To | Enforcement Point |
|---|---|---|---|
| 1 | `PROCESS_OPERATOR` can only call `stage-update` where `sub_job_card.current_stage_id == user.assigned_stage_id` | Stage Movement API | Middleware check before controller logic |
| 2 | `PROCESS_OPERATOR`'s traceability view shows only log entries for their own stage, not full cross-stage history | `/sub-job-cards/:id/history` | Filter query by `stage_id = user.assigned_stage_id` |
| 3 | `CUSTOMER` queries always filtered by `customer_id` from JWT, never from URL/body params | All `/portal/*` endpoints | Query layer — hard-coded join, not conditional logic |
| 4 | `CUSTOMER` cannot see internal user names in traceability (only stage name + timestamp) | `/portal/orders/:id/traceability` | Response serializer strips `user_id`/`user_name` for this role |
| 5 | `STORE_DISPATCH` sees only dispatch records they created, not company-wide dispatch history (`SUPER_ADMIN`/`PRODUCTION_PLANNER`/`MIS_VIEWER` see all) | Dispatch List | Filter by `dispatched_by = user.id` unless role ∈ {SA, PP, MIS} |
| 6 | `SUPER_ADMIN` and `PRODUCTION_PLANNER` can log a stage update on **any** stage (override, for corrections/exceptions). Must be logged as an override in `audit_logs` | Stage Movement API | Explicit `is_override: true` flag + audit log entry when actor's assigned stage ≠ target stage |
| 7 | **Rejection sign-off gate:** a rejection entry raised by `PROCESS_OPERATOR` (or via an `SA`/`PP` override) sits in status `pending_qc_review` and does **not** count toward final rejection totals in reports until a `QC_OFFICER` approves it | Rejection Management API | Reports/aggregation queries must exclude `pending_qc_review` rows; only `qc_approved` rows count |
| 8 | `QC_OFFICER` cannot approve a rejection they themselves raised (segregation of duties — even though QC can raise rejections too via override flows) | Rejection Management API | Reviewer `user_id` ≠ raiser `user_id` check |
| 9 | `MIS_VIEWER` is a blanket read-only role: **every** write endpoint (POST/PUT/PATCH/DELETE) must reject this role regardless of module, rather than relying on the matrix being followed per-module | Global middleware | Role-level HTTP-method gate, not per-route |
| 10 | `ACCOUNTS_FINANCE` can view PO/dispatch/customer data needed for billing but has **zero** write access outside the Accounts/Invoicing module | All non-Accounts modules | Same pattern as rule 9, scoped to this role |
| 11 | Product Specification Card No., PO No., Job Card No., and Sub-Job Card No. are **system-generated, sequential, and immutable** once created — no role (including `SUPER_ADMIN`) edits them directly; correction requires a formal void/reissue flow | Product Master, PO, Job Card creation | ID generator service, not user-editable field |

---

## 7. ID / Document Numbering Conventions

Derived from the client's flow examples — implement as auto-incrementing, prefix-based generators (exact prefix/padding is a client-config choice; defaults below):

| Entity | Example | Generated When | Suggested Format |
|---|---|---|---|
| Product Specification Card | `D001` | On saving a new Product Master record | `D` + zero-padded sequence |
| Customer PO | `P001` | On PO entry, must reference an existing Spec Card | `P` + zero-padded sequence |
| Job Card | `JC001` | On generating from a confirmed PO qty | `JC` + zero-padded sequence |
| Sub-Job Card | `JC001-1`, `JC001-2`, … | On splitting a Job Card | `{parent JobCard}-{split index}` |

---

## 8. Notification Rules

New requirement surfaced by the flow description — not covered in either source matrix, adding here:

| Trigger | Notification Fires To | Channel (suggest) |
|---|---|---|
| Job/Sub-Job Card dispatched at gate (`STORE_DISPATCH` creates dispatch record) | "Responsible person" for that order — **default suggestion: `SALES_PO_EXECUTIVE` who owns the PO**; confirm with client (see Open Items) | In-app + email/SMS |
| Delivery confirmed by delivery partner (status/photo/delivered-by recorded) | Same responsible person + optionally the `CUSTOMER` portal login | In-app + email/SMS |
| Rejection raised by `PROCESS_OPERATOR` | `QC_OFFICER` queue (for sign-off) | In-app |
| Rejection approved/rejected by `QC_OFFICER` | Originating `PROCESS_OPERATOR` + `PRODUCTION_PLANNER` | In-app |

---

## 9. Route Guarding Reference (Frontend)

Real enforcement is server-side (§1/§6) — frontend guards exist only to avoid confusing dead-end screens.

| Frontend Route | Guarded For | Behavior if Unauthorized |
|---|---|---|
| `/admin/*` | SUPER_ADMIN | → Login or 403 |
| `/admin/users` | SUPER_ADMIN only | → 403 (even MIS_VIEWER blocked) |
| `/admin/products` | SUPER_ADMIN, PRODUCT_ENGINEER (full) | Others (PP, SPE, QC, MIS) see read-only mode, not blocked |
| `/admin/pos` | SUPER_ADMIN, SALES_PO_EXECUTIVE (full) | PP/MIS see read-only mode |
| `/admin/rejections` | SUPER_ADMIN, QC_OFFICER (approve), PROCESS_OPERATOR (raise-only, own stage) | Others read-only or blocked per matrix |
| `/mobile/scan`, `/mobile/stage-update` | PROCESS_OPERATOR | → Login |
| `/mobile/dispatch` | STORE_DISPATCH | → Login |
| `/finance/*` | ACCOUNTS_FINANCE, SUPER_ADMIN | → 403 |
| `/mis/dashboard` | MIS_VIEWER, SUPER_ADMIN | → 403 |
| `/portal/*` | CUSTOMER | → Customer login |

---

## 10. Testing Checklist (QA must verify before go-live)

- [ ] A `PROCESS_OPERATOR` assigned to "Drilling" cannot submit a stage update for a job currently at "Plating" (expect 403 `STAGE_MISMATCH`)
- [ ] A `CUSTOMER` cannot access another customer's order by editing `:id` in a portal URL (expect 404, not 403)
- [ ] A `STORE_DISPATCH` user cannot access `/reports/*` except their own dispatch report/list (expect 403 on the rest)
- [ ] A deactivated user's existing JWT is rejected on next request (not just blocked at login)
- [ ] `SUPER_ADMIN`/`PRODUCTION_PLANNER` override on a stage update (logging for a stage not their own) creates a visible `audit_logs` entry with `is_override: true`
- [ ] `PRODUCT_ENGINEER` can create/edit Product Master but cannot deactivate a product
- [ ] Customer-facing traceability response never includes internal `user_name`/`user_id` fields (inspect raw API response, not just UI)
- [ ] A rejection raised by a `PROCESS_OPERATOR` does **not** appear in the Rejection Summary Report totals until a `QC_OFFICER` approves it
- [ ] A `QC_OFFICER` cannot approve a rejection entry they raised themselves
- [ ] `MIS_VIEWER` gets a 403 on every POST/PUT/PATCH/DELETE endpoint tested, across at least 3 different modules
- [ ] `ACCOUNTS_FINANCE` can view PO/dispatch data but gets 403 attempting to edit a Job Card or Product Master record
- [ ] `SALES_PO_EXECUTIVE` cannot generate a Job Card (create rights are Production Planner-only)
- [ ] Product Spec Card No. / PO No. / Job Card No. / Sub-Job Card No. cannot be edited via API even by `SUPER_ADMIN` (only system-generated)
- [ ] Dispatch notification fires on gate-out; delivery-confirmed notification fires on delivery update

---

## 11. Open Items to Confirm With Client

1. Should `PRODUCTION_PLANNER` have the same stage-update override capability as `SUPER_ADMIN`, or should overrides be Admin-only? *(currently assumed equal — both source docs agreed on this, carried forward)*
2. Should `STORE_DISPATCH` see aggregate Dispatch Status *reports*, or strictly their own transaction list? *(the two source docs disagreed — current matrix gives them view of the report but scoped to own entries; confirm this is right)*
3. Are there any documents/reports the `CUSTOMER` portal should be able to *export* (e.g. delivery certificate), or is it strictly view-only with zero export in Phase 1?
4. Who exactly is the "responsible person" notified on dispatch/delivery (§8)? Default assumption here is `SALES_PO_EXECUTIVE`, but it could instead/also be `SUPER_ADMIN` or a per-PO assigned contact.
5. Should `QC_OFFICER` approval be scoped per-stage (a QC checkpoint at specific stages only) or is one central QC role approving rejections from all 10 stages acceptable for Phase 1? *(current matrix assumes one central, cross-stage QC role)*
6. Should `SALES_PO_EXECUTIVE` visibility be scoped to only the customers/POs they personally created, or org-wide across all customers? *(current matrix assumes org-wide — flag if that's wrong for a multi-salesperson team)*
7. Of the "minimum 20 internal user accounts," how should that split across departments — is it 20 just for Process Operators (one per stage across shifts), or 20 total including Sales/QC/Store/Accounts/MIS?

---

## 12. Implementation Notes (for the dev/coding agent)

1. Implement permissions as a **single centralized config** (`permissions.ts` / `permissions.py`) mapping `role → module → action → access-level`, rather than scattering role checks across controllers. This makes adding a future role (already anticipated: e.g. `INVENTORY_STORE_KEEPER` for raw materials in a later phase) a config change, not a code change.
2. JWT payload should carry: `role`, `user_id`, and — only for roles that need it — `assigned_stage_id` (PROCESS_OPERATOR) or `customer_id` (CUSTOMER). Never trust equivalents passed in the request body/query string.
3. Build the "own-scope" filters (rules in §6) as reusable query-layer helpers (e.g. `scopeToRole(query, user)`) so every endpoint applies them consistently instead of each controller reimplementing the filter.
4. The rejection sign-off gate (§6 rule 7–8) implies a **status field** on rejection entries: `pending_qc_review → qc_approved | qc_rejected`. Reporting aggregation must key off this status, not just the existence of a rejection row.
5. Build Section 10's checklist directly into the automated test suite before UAT — each line maps cleanly to one integration test.
6. Section 7's ID generators should be atomic/sequence-based at the DB level to avoid collisions under concurrent creation (e.g. Postgres `SEQUENCE` or equivalent), not computed client-side.
