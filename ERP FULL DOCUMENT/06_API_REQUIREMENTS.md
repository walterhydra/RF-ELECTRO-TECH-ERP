# API Requirements — PCB Manufacturing ERP (Phase 1)
### Consolidated / Final Draft for Backend Implementation

| | |
|---|---|
| **Document Type** | API Requirements (Merged & Finalized) |
| **Merged From** | `PCB_Manufacturing_ERP_API_Requirements.md` (v0.1) + `PCB_ERP_API_Requirements.docx` (v1.0) |
| **Companion Document** | `PCB_ERP_Database_Schema_MERGED.md` (v1.0) — **must stay in sync with this file** |
| **Status** | Ready for endpoint contract lock — a few open items in §14 still need client sign-off |
| **Version** | 1.0 (merged) |
| **Date** | July 2026 |

---

## 0. How this document was built

Two earlier drafts of this API spec existed, describing the same system with different conventions and, in a couple of places, genuinely different designs. This version merges them into one implementation-ready spec, and every endpoint, resource name, and field here is kept consistent with `PCB_ERP_Database_Schema_MERGED.md` — table names, enum values, and the new tables added during that merge (`departments`, `notifications`, `process_flow_masters`, `process_flow_steps`, `customer_portal_access`, `roles`/`permissions`) all show up here too.

Key merge decisions:

1. **Access + refresh token pair** (from the .docx draft) was kept over a single long-lived token (.md draft) — standard practice, avoids forcing re-login on expiry. The .md draft's `/auth/forgot-password` and `/auth/reset-password` flow was kept too since the .docx draft didn't have one and it's a basic requirement.
2. **camelCase JSON fields** (from the .docx draft) were adopted over snake_case (.md draft) for all request/response bodies, since that's the more common convention for API consumers (web/mobile frontends). The database itself stays snake_case per the schema doc — mapping happens at the serialization layer, not by changing DB columns.
3. **Reusable Process Flow master** (`/process-flows`, from the .docx draft) is the source of truth for how a product's manufacturing steps are defined — matching the merged DB schema's `process_flow_masters`/`process_flow_steps`. But the .docx draft's flaw of storing flow steps as raw strings is fixed here: a flow's steps reference `process_stages` by ID (from the .md draft's model), not free text.
4. **Both the manual pre-launch split (`POST /job-cards/:id/split`, .md draft) and the Stage Engine's automatic mid-stage split (inside `POST /sub-job-cards/:id/stage-update`) are kept** — this was flagged as an unresolved ambiguity in the .md draft's own open items. §5 and §6 below now document explicitly when each applies, so there's no "two competing code paths" confusion.
5. **A distinct `/portal` API prefix with its own auth guard** (from the .docx draft's Conventions) was adopted for every customer-facing endpoint, not just login — cleaner separation than the .md draft's mixed `/auth/customer-login` + `/portal/*` approach.
6. **404-not-403 for cross-customer access attempts** (from the .md draft) was kept over the .docx draft's 403/404 split — returning 403 on someone else's order confirms the order exists, which is a resource-enumeration leak on a public-facing portal. This overrides the .docx draft's behavior.
7. **Roles are DB-backed** (`roleId` referencing the `roles` table), matching the merged DB schema's RBAC design — not the fixed role-string enum the .md draft used in its `Role` column. Access-control columns in this doc use the same seed role names as the DB schema doc: `admin`, `production_manager`, `process_user`, `dispatch_user`, `sales`, `supervisor`.
8. **`DELIVERY_FAILED`** — a `delivery_status` value added during the DB schema merge that didn't exist in either original API draft — is now surfaced in the dispatch confirmation endpoint (§8).
9. **Report endpoints are mapped 1:1 to the SQL views** defined in the merged DB schema doc §7, so there's no ambiguity about what query backs each endpoint.

---

## 1. Conventions

- **Base URL:** `/api/v1` for internal (staff) endpoints, `/api/v1/portal` for customer portal endpoints — separate auth guard, separate token type, never share a session between the two.
- **Format:** JSON request/response bodies (all fields camelCase); file uploads (delivery photo) use `multipart/form-data`.
- **Field naming ↔ DB mapping:** API fields are camelCase; the underlying Postgres columns (per the DB schema doc) are snake_case. This is a serialization concern only — e.g. API `poDate` ↔ DB `customer_pos.po_date`.
- **Auth:** `Authorization: Bearer <accessToken>` header on every request except `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, and `/portal/auth/login`.
- **Timestamps:** ISO 8601 UTC in all payloads (e.g. `2026-07-15T14:30:00Z`).
- **IDs:** UUID strings throughout.
- **Pagination** (all list endpoints): `?page=1&limit=20` query params (default 20, max 100), response includes a `pagination` object: `{ page, limit, total, totalPages }`.

### Standard error shape

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "qtyForwarded (600) exceeds qtyProcessed (500)",
  "details": [
    { "field": "qtyForwarded", "message": "must be <= qtyProcessed" }
  ]
}
```
`details` is optional — omitted when the error isn't field-specific (e.g. a 404 or 409).

| Status | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No content (successful action with no body, e.g. deactivate) |
| 400 | Validation error — malformed or missing required fields |
| 401 | Missing, invalid, or expired auth token |
| 403 | Authenticated but not permitted (wrong role, wrong stage assignment, wrong customer scope) |
| 404 | Resource not found (also returned instead of 403 for cross-customer access — see §11) |
| 409 | Conflict — duplicate PO/job card, quantity exceeds available, already-launched, etc. |
| 500 | Unexpected server error |

---

## 2. Auth Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Email/password → access + refresh token | Public |
| POST | `/auth/refresh` | Exchange refresh token for new access token | Valid refresh token |
| POST | `/auth/logout` | Invalidate refresh token | Any authenticated |
| POST | `/auth/forgot-password` | Trigger reset email | Public |
| POST | `/auth/reset-password` | Set new password via reset token | Public |
| GET | `/auth/me` | Current user's profile, role, department, assigned stage | Any authenticated |

**Request — `POST /auth/login`**
```json
{ "email": "admin@company.com", "password": "••••••" }
```
**Response — 200**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "name": "Admin",
    "role": "admin",
    "departmentId": "uuid",
    "assignedStageId": null
  }
}
```
**Error — 401** `{ "statusCode": 401, "error": "INVALID_CREDENTIALS", "message": "Invalid email or password" }`

**Request — `POST /auth/refresh`**
```json
{ "refreshToken": "eyJhbGciOi..." }
```
**Response — 200**
```json
{ "accessToken": "eyJhbGciOi..." }
```

---

## 3. Master Data Endpoints — Process Stages, Process Flows, Products

### 3.1 Process Stages (global vocabulary — `process_stages`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/process-stages` | List master stage list (for the flow builder dropdown) | admin, production_manager |
| POST | `/process-stages` | Add a new stage to the master list | admin |

**Request — `POST /process-stages`**
```json
{ "name": "AOI Testing", "description": "Automated optical inspection", "defaultOrder": 7 }
```

### 3.2 Process Flows (reusable templates — `process_flow_masters` + `process_flow_steps`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/process-flows` | List reusable flows (for selection during product creation) | admin, production_manager, sales |
| GET | `/process-flows/:id` | Flow detail with ordered steps | admin, production_manager, sales |
| POST | `/process-flows` | Create a named, reusable process flow | admin |
| PATCH | `/process-flows/:id` | Update a flow's steps (blocked if any product using it has active job cards — see §14 item 1) | admin |

**Request — `POST /process-flows`**
```json
{
  "name": "Standard 10-Stage Multilayer Flow",
  "steps": [
    { "stageId": "uuid-drilling", "stepOrder": 1 },
    { "stageId": "uuid-plating", "stepOrder": 2 },
    { "stageId": "uuid-etching", "stepOrder": 3 }
  ]
}
```
> Steps reference existing `process_stages` records by ID — not raw strings — so stage identity stays consistent across every flow and matches what `ProcessUser` accounts are assigned to.

**Response — 201**
```json
{ "id": "uuid", "name": "Standard 10-Stage Multilayer Flow", "totalSteps": 3, "steps": [ /* echoed with ids */ ] }
```
**Error — 400** `steps` array is empty, or `stepOrder` values aren't contiguous starting at 1.

### 3.3 Product Master

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/products` | List products (filter: `search` matches name or spec card no., `status`) | Any authenticated internal user |
| GET | `/products/:id` | Product detail incl. its process flow | Any authenticated internal user |
| POST | `/products` | Create product, referencing an existing process flow | admin |
| PATCH | `/products/:id` | Update product | admin |
| PATCH | `/products/:id/deactivate` | Soft-deactivate | admin |

**Request — `POST /products`**
```json
{
  "name": "ABC",
  "pcbSize": "100x150mm",
  "layers": 4,
  "thicknessMm": 1.6,
  "copperWeight": "1oz",
  "solderMask": "Green",
  "legend": "White",
  "surfaceFinish": "ENIG",
  "processFlowId": "uuid"
}
```
**Response — 201**
```json
{ "id": "uuid", "specCardNo": "D001", "name": "ABC", "processFlowId": "uuid" }
```
**Error responses:** `400` missing required spec field · `404` `processFlowId` does not exist

---

## 4. Customer & PO Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/customers` | List customers | admin, sales |
| POST | `/customers` | Create customer (does **not** auto-create portal login — see §4.1) | admin |
| POST | `/customers/:id/portal-access` | Provision a portal login for this customer | admin |
| GET | `/customer-pos` | List POs (filter: `status`, `customerId`, `dateFrom`, `dateTo`) | admin, sales, production_manager |
| GET | `/customer-pos/:id` | PO detail incl. linked spec card and job card status | admin, sales, production_manager |
| POST | `/customer-pos` | Create PO, linked to a product spec card | admin, sales |
| PATCH | `/customer-pos/:id` | Update PO (only before a Job Card has been generated) | admin, sales |

**Request — `POST /customer-pos`**
```json
{
  "poNo": "P001",
  "customerId": "uuid",
  "productId": "uuid",
  "orderQty": 1000,
  "poDate": "2026-07-01",
  "expectedDeliveryDate": "2026-07-20"
}
```
**Response — 201**
```json
{ "id": "uuid", "poNo": "P001", "status": "OPEN" }
```
**Error responses:** `409` duplicate PO number · `404` `productId` or `customerId` not found

> §4.1 note: `customer_portal_access` was split out from `customers` in the merged DB schema, so creating a customer no longer implicitly creates a login — call `POST /customers/:id/portal-access` explicitly when the customer needs portal visibility.

---

## 5. Job Card & Sub-Job Card Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/customer-pos/:id/generate-job-card` | Create a Job Card from a PO's full order quantity | admin, sales, production_manager |
| GET | `/job-cards` | List (filter: `status`, `productId`, `customerId`) | Any authenticated internal user |
| GET | `/job-cards/:id` | Detail incl. all sub-job-cards and their current stages | Any authenticated internal user |
| POST | `/job-cards/:id/split` | *(Optional)* Pre-launch split into N sub-job-cards | admin, production_manager |
| POST | `/job-cards/:id/launch` | Launch — moves sub-job-card(s) into Stage 1 | admin, production_manager, supervisor |
| GET | `/job-cards/:id/qr` | Get/regenerate QR image | Any authenticated internal user |
| GET | `/sub-job-cards/:id` | Sub-job-card detail — the endpoint hit right after a QR scan | admin, production_manager, process_user (own stage only) |
| GET | `/sub-job-cards/:id/current-stage` | Quick current-stage lookup (lighter payload than full detail) | process_user |
| GET | `/sub-job-cards/:id/qr` | QR image for one sub-job-card | Any authenticated internal user |
| GET | `/sub-job-cards/:id/history` | Full chronological stage-movement history | admin, production_manager, Customer (scoped, via `/portal/...`) |

**Request — `POST /job-cards/:id/split`**
```json
{
  "splits": [
    { "qty": 100 }, { "qty": 100 }, { "qty": 100 }, { "qty": 100 }, { "qty": 100 },
    { "qty": 100 }, { "qty": 100 }, { "qty": 100 }, { "qty": 100 }, { "qty": 100 }
  ]
}
```
**Validation:** `SUM(splits[].qty) == jobCard.totalQty`, else `400`.

**Response — 201**
```json
{
  "subJobCards": [
    { "id": "uuid", "subJobCardNo": "JC001-1", "qty": 100, "qrCodeValue": "..." }
  ]
}
```

**Request — `POST /job-cards/:id/launch`** — no body required.

> **Resolving the split ambiguity flagged in both original drafts:** this is a single-source-of-truth model with two distinct triggers, not two competing code paths.
> - If `/job-cards/:id/split` was **not** called first, `launch` auto-creates one sub-job-card holding the full `totalQty`, then moves it into Stage 1.
> - If `/job-cards/:id/split` **was** called, `launch` moves every existing sub-job-card into Stage 1.
> - Either way, further splitting *within* a sub-job-card (e.g. only 60 of a 100-qty sub-card's units are forwarded) happens automatically inside the Stage Engine (§6), never through this endpoint. Both paths write to the same `sub_job_cards` table with `parent_sub_job_card_id` lineage.

**Response — 200**
```json
{ "status": "launched", "launchedAt": "2026-07-05T09:00:00Z", "subJobCards": [ /* now at Stage 1 */ ] }
```
**Error — 409** Job Card already launched.

---

## 6. Stage Movement Endpoint (Core — the Stage Engine)

This is the highest-traffic, highest-risk endpoint in the system — build and unit-test it first.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/sub-job-cards/:id/stage-update` | Log a movement; auto-splits and/or auto-forwards per Stage Engine logic | process_user (own assigned stage only), production_manager, admin |
| GET | `/sub-job-cards/:id/current-stage` | Quick lookup, used immediately after a QR scan | process_user |

**Request — `POST /sub-job-cards/:id/stage-update`**
```json
{
  "qtyProcessed": 500,
  "qtyForwarded": 500,
  "qtyRejected": 0,
  "rejectionReason": null,
  "clientRequestId": "client-generated-uuid-for-offline-idempotency"
}
```

**Validations (return `400` with a `details[].field` entry on failure):**
- `qtyProcessed <= remaining qty at this stage for this sub-job-card`
- `qtyForwarded + qtyRejected <= qtyProcessed`
- if `qtyRejected > 0`, `rejectionReason` is required
- requesting user's `assignedStageId` must match `subJobCard.currentStageId` → else `403 STAGE_MISMATCH`

**Response — 200**
```json
{
  "movementId": "uuid",
  "splitOccurred": true,
  "subJobCardStatus": "IN_STAGE",
  "newSubJobCard": {
    "id": "uuid",
    "subJobCardNo": "JC001-1a",
    "qty": 500,
    "currentStageId": "uuid-next-stage"
  },
  "remainingAtCurrentStage": {
    "subJobCardNo": "JC001-1",
    "qty": 0
  }
}
```
> If the full quantity is forwarded (no split needed), `splitOccurred: false` and `newSubJobCard` is `null` — the same sub-job-card simply advances to the next stage. If the sub-job-card was fully processed and rejected/forwarded such that nothing remains, `remainingAtCurrentStage.qty` is `0`.

**Response — 409 (idempotent retry)**
```json
{ "statusCode": 409, "error": "DUPLICATE_SUBMISSION", "message": "This update was already recorded", "movementId": "uuid" }
```
> `clientRequestId` is stored (and uniquely indexed) exactly to make this safe — the mobile app can retry an offline-queued submission without risking a double-count.

---

## 7. Reports Endpoints

Each endpoint below maps directly to a SQL view defined in the DB schema doc §7 — see the `View` column.

| Method | Endpoint | Description | Access | View (DB schema §7) |
|---|---|---|---|---|
| GET | `/reports/daily?date=` | Bundled dashboard snapshot: stage-wise output, WIP, pending-by-stage | production_manager, admin | combines several |
| GET | `/reports/stage-output?dateFrom=&dateTo=` | Stage-wise output | production_manager, admin | `v_stage_wise_output` |
| GET | `/reports/pending-by-process` | Current pending qty per stage | production_manager, admin | `v_pending_qty_per_stage` |
| GET | `/reports/wip` | Total WIP across the system | production_manager, admin | `v_total_wip` |
| GET | `/reports/job-launch-status` | Launched vs. not-launched jobs | production_manager, admin | `v_job_launch_status` |
| GET | `/reports/lead-time?jobCardId=` | Lead time per Job Card | production_manager, admin | `v_job_card_lead_time` |
| GET | `/reports/productivity?stageId=&dateFrom=&dateTo=` | Process-wise productivity | production_manager, admin | `v_process_productivity` |
| GET | `/reports/rejections?dateFrom=&dateTo=&stageId=` | Rejection breakdown | production_manager, admin | `v_rejection_summary` |
| GET | `/reports/dispatch-status` | Dispatch/delivery summary | production_manager, admin | `v_dispatch_status` |
| GET | `/reports/export?reportType=&format=pdf\|xlsx` | Export any report above | production_manager, admin | — |

All report responses include both `summary` (aggregate numbers) and `breakdown` (array, for table/chart rendering).

**Response — `GET /reports/export`**
```json
{ "fileUrl": "https://.../signed-download-url", "expiresAt": "2026-07-15T15:00:00Z" }
```

---

## 8. Dispatch Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/dispatches` | Create dispatch record (gate exit); triggers a `DISPATCH_ALERT` notification | dispatch_user, admin |
| GET | `/dispatches` | List (filter: `status`, `dateFrom`, `dateTo`) | admin, production_manager |
| PATCH | `/dispatches/:id/confirm-delivery` | Update delivery status + photo; triggers a `DELIVERY_CONFIRMED` notification | dispatch_user, admin |

**Request — `POST /dispatches`**
```json
{ "jobCardId": "uuid", "dispatchedQty": 1000, "destination": "Customer warehouse, Ahmedabad" }
```
**Response — 201**
```json
{ "id": "uuid", "deliveryStatus": "DISPATCHED" }
```
**Error — 409** dispatched quantity exceeds completed quantity.

**Request — `PATCH /dispatches/:id/confirm-delivery`** (`multipart/form-data`)
```json
{
  "deliveryStatus": "DELIVERED",
  "deliveredAt": "2026-07-15T14:30:00Z",
  "deliveredByName": "Ramesh Kumar",
  "deliveryPhoto": "<binary file>"
}
```
> `deliveryPhoto` is mandatory when `deliveryStatus = "DELIVERED"`. If the attempt failed (`deliveryStatus = "DELIVERY_FAILED"`), the photo is optional but a `failureReason` string is required instead. `DELIVERY_FAILED` is a value added during the DB schema merge that neither original API draft modeled — included here to stay in sync.

**Response — 200**
```json
{ "deliveryStatus": "DELIVERED", "deliveryPhotoUrl": "https://..." }
```
**Error — 400** missing delivery photo (when status is `DELIVERED`) or missing `failureReason` (when status is `DELIVERY_FAILED`).

---

## 9. Notification Triggers (Internal — not directly called by any frontend)

| Event | Triggered By | Recipient | `type` value | Channel (TBD — §14 item 2) |
|---|---|---|---|---|
| Job dispatched from gate | `POST /dispatches` | Responsible person (configurable) | `DISPATCH_ALERT` | Email/SMS/WhatsApp |
| Delivery confirmed | `PATCH /dispatches/:id/confirm-delivery` | Responsible person + Customer | `DELIVERY_CONFIRMED` | Email/SMS/WhatsApp |
| Rejection logged above threshold *(Phase 1.5)* | `POST /sub-job-cards/:id/stage-update` | Production Manager | `REJECTION_ALERT` | In-app/Email |

Every row written here also lands in the `notifications` table (per the DB schema doc) so an in-app bell-icon feed is possible without extra modeling:

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/notifications` | List the current user's notifications (paginated, newest first) | Any authenticated internal user |
| PATCH | `/notifications/:id/read` | Mark a notification as read | Any authenticated internal user (own only) |

---

## 10. User & Role Management Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/users` | List internal users | admin |
| POST | `/users` | Create user (email + auto-generated temp password sent by email) | admin |
| PATCH | `/users/:id` | Update user (role, department, assigned stage, active status) | admin |
| PATCH | `/users/:id/deactivate` | Deactivate | admin |
| GET | `/roles` | List roles (for the user-creation dropdown) | admin |
| GET | `/departments` | List departments (for the user-creation dropdown) | admin |
| GET | `/audit-logs?userId=&dateFrom=&dateTo=` | View audit trail | admin |

**Request — `POST /users`**
```json
{
  "name": "Suresh Patel",
  "email": "suresh@company.com",
  "roleId": "uuid",
  "departmentId": "uuid",
  "assignedStageId": "uuid"
}
```
> `assignedStageId` is required when `roleId` resolves to the `process_user` role, otherwise omitted.

**Response — 201**
```json
{ "id": "uuid", "temporaryPassword": "sent-via-email-not-returned-in-production" }
```
**Error — 409** email already in use.

> Full CRUD for `permissions` and `role_permissions` is **not** exposed via API in Phase 1 — the seed role/permission matrix is managed through migrations/seed data (see the DB schema doc §10, step 3). Revisit if the client needs admins to build custom roles at runtime.

---

## 11. Customer Portal Endpoints (Strictly Scoped, `/api/v1/portal` prefix)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/portal/auth/login` | Customer login against `customer_portal_access` | Public |
| GET | `/portal/orders` | List own POs only | Authenticated customer |
| GET | `/portal/orders/:id` | Own order detail — status, EDD, dispatch status | Authenticated customer (own order only) |
| GET | `/portal/orders/:id/traceability` | Simplified movement history — no internal user names, no rejection reasons | Authenticated customer (own order only) |

**Request — `POST /portal/auth/login`**
```json
{ "email": "buyer@customer.com", "password": "••••••" }
```
**Response — 200**
```json
{ "accessToken": "eyJhbGciOi...", "customer": { "id": "uuid", "companyName": "..." } }
```

**Response — `GET /portal/orders/:id`**
```json
{
  "poNo": "P001",
  "productName": "ABC",
  "currentStageLabel": "In production",
  "pendingQty": 500,
  "edd": "2026-07-20",
  "dispatchStatus": "DISPATCHED"
}
```

**Server-side enforcement (non-negotiable):** every query in this section must filter through `customer_portal_access.customer_id = req.user.customerId`, derived from the JWT — **never** accepted as a request parameter.

**Cross-customer access attempt → `404`, not `403`.** Confirming an order *exists* but belongs to someone else is itself a data leak on a public-facing endpoint; both "wrong customer" and "genuinely doesn't exist" return the identical `404` body so an attacker can't distinguish the two. (This overrides the .docx draft's original 403/404 split.)

---

## 12. Rate Limiting & Abuse Protection

| Endpoint group | Limit |
|---|---|
| `/auth/login`, `/portal/auth/login` | 5 attempts / 15 min / IP, lockout + captcha after |
| `/sub-job-cards/:id/stage-update` | 300 / min / user — generous, sized for floor-level QR scanning volume |
| `/reports/export` | 20 / min / user — exports can be heavy |
| `/portal/*` | 60 / min / customer account |
| All other authenticated endpoints | 120 / min / user (default) |

---

## 13. Versioning & Change Management

- All internal endpoints prefixed `/api/v1`; portal endpoints `/api/v1/portal`. Breaking changes go to `/api/v2` — the old version stays live until the client confirms mobile app migration is complete.
- Additive changes (new optional fields) don't require a version bump.
- Any schema change must be reflected in this document **and** the DB schema doc together — they're meant to be read as a pair.

---

## 14. Open Items Affecting API Design

1. **Process flow editability** — §3.2's `PATCH /process-flows/:id` is listed as blocked once a product using that flow has active job cards, mirroring the DB schema doc's snapshot-at-launch design (§9 item there). Confirm this is the desired UX rather than versioning flows.
2. **Notification channel** — email/SMS/WhatsApp/in-app is still TBD; affects whether a channel-dispatch integration (Twilio, WhatsApp Business API, etc.) needs to be scoped now or later.
3. **Third-party delivery confirmation** — can a courier confirm delivery directly via a limited external-facing endpoint (e.g. a signed one-time link), or is `PATCH /dispatches/:id/confirm-delivery` strictly internal `dispatch_user` only? Affects the auth model for that one flow.
4. **Export format priority** — PDF vs. Excel first — affects which library gets built first for `/reports/export`.
5. **Custom roles at runtime** — confirm whether Phase 1 truly only needs the seeded roles (§10 note) or whether admins need to define new roles/permission sets without a deploy.

---

## 15. Next Steps

1. Resolve §14 with the client before the backend team locks endpoint contracts.
2. Generate an OpenAPI/Swagger spec from this document for auto-generated API docs and frontend type generation.
3. Build and unit-test `POST /sub-job-cards/:id/stage-update` (§6) first — highest-risk, highest-traffic endpoint in the system. Cover: partial forward + split, full forward without split, rejection with/without reason, stage-mismatch 403, and idempotent retry via `clientRequestId`.
4. Build the launch-time auto-create-if-not-split logic (§5) as its own tested unit, since it's the one place two different upstream user actions converge on the same code path.
5. Set up a Postman/Insomnia collection mirroring this doc for manual QA during development.
6. Cross-check every endpoint here against `PCB_ERP_Database_Schema_MERGED.md` once implementation starts — table/column names should need zero translation given the camelCase↔snake_case convention in §1.
