# Database Schema — PCB Manufacturing ERP (Phase 1)
### Consolidated / Final Draft for Implementation

| | |
|---|---|
| **Document Type** | Database Schema (Merged & Finalized) |
| **Merged From** | `PCB_Manufacturing_ERP_Database_Schema.md` (v0.1) + `PCB_ERP_Database_Schema.docx` (v1.0) + client-provided ERP Flow description |
| **Database** | PostgreSQL 15+ |
| **Status** | Ready for implementation — a handful of open items in §9 still need client sign-off |
| **Version** | 1.0 (merged) |
| **Date** | July 2026 |

---

## 0. How this document was built

Two earlier drafts of this schema existed, modeling the same system with different design choices. This version merges them into one implementation-ready schema, and cross-checks every table against the client's actual described ERP flow (§1) so nothing in the process is left unmodeled. Where the two drafts disagreed, the reasoning for the chosen design is noted inline. New tables/fields not present in either original draft (added to fully cover the flow) are marked **[NEW]**.

Key merge decisions:
- **Reusable named process flows** (from the .docx draft) were kept over "flow embedded directly in product" (from the .md draft), because the client's flow description says the flow is *"selected"* during product creation — implying flows are predefined, reusable templates (e.g. "Standard 10-Stage Multilayer Flow"), not built from scratch per product.
- A **global `process_stages` master list** (from the .md draft) was kept *underneath* the reusable flow tables, because stage identity needs to be consistent company-wide for `ProcessUser` assignment and stage-wise reporting — the .docx draft's flow steps stored stage names as free text with no shared vocabulary, which would break that.
- **Role-based access via `roles` / `permissions` / `role_permissions`** (from the .docx draft) was kept over a fixed 4-value enum (from the .md draft), because the flow explicitly calls for *"Department-wise role-based access"* across a minimum of 20 internal accounts — a fixed enum won't flex well as departments and permission needs grow. A plain enum is flagged in §9 as a valid simpler fallback if the client wants less complexity for Phase 1.
- **`customers` and `customer_portal_access` were split** (from the .docx draft) instead of storing portal login credentials directly on the customer record (.md draft) — cleaner separation between "who the customer is" and "how they log in," and leaves room for a customer to have more than one portal user later without a schema change.
- **`notifications`** (.docx draft only) was kept and is required — the flow explicitly describes two notification events (dispatch alert, delivery confirmation) that need somewhere to live.
- **`daily_report_snapshots`** (.md draft only) was kept for dashboard performance, and a new **§7 Reporting Views** section was added, mapping each of the 8 report types the client asked for directly to a SQL view.
- **Table creation order was re-sequenced** so no table needs a forward-reference / `ALTER TABLE` workaround (both original drafts had this issue with `users` ↔ `process_stages`). See §5.

---

## 1. ERP Flow → Schema Mapping

This is the client's described flow, mapped to the tables that implement each step, so anyone (human or AI agent) picking up this schema can see *why* each table exists before touching the DDL.

| # | Flow step | Tables involved |
|---|---|---|
| 1 | **Product Creation** — product master with full spec, generates a unique Spec Card No. (e.g. `D001`) | `products` |
| 2 | **Customer PO** — entered and linked to a Spec Card (e.g. `P001` → `D001`) | `customer_pos`, `customers`, `products` |
| 3 | **Job Card Generation** — one Job Card per PO qty (e.g. `JC001` for 1000 panels), splittable into sub-job cards (`JC001-1` … `JC001-10`) | `job_cards`, `sub_job_cards` |
| 4 | **Process Flow** — selected at product-creation time (e.g. 10 total steps); Job Card entering Stage 1 = "launched"; partial quantities move forward while the rest continue at the current stage | `process_flow_masters`, `process_flow_steps`, `process_stages`, `job_cards.launched_at`, `sub_job_cards.current_stage_id` |
| 5 | **Process Tracking** — every movement logs date/time, user, process, qty received/processed/forwarded/rejected, rejection reason | `stage_movement_logs` |
| 6 | **Production Reports** — stage-wise output, pending qty/WIP, launch status, lead time, productivity, rejection summary, dispatch status | `daily_report_snapshots` + reporting views in §7, built on `stage_movement_logs`, `sub_job_cards`, `job_cards`, `dispatches` |
| 7 | **QR Code / Barcode** — unique per Job Card (and per Sub-Job Card, for stage-level scanning), scannable from desktop and mobile | `job_cards.qr_code_value`, `sub_job_cards.qr_code_value` |
| 8 | **Dispatch Notification** — alert on gate dispatch; delivery confirmation (status, date/time, photo, delivered-by) updates and notifies again | `dispatches`, `notifications` |
| 9 | **User Management** — one Admin, per-process users, department-wise RBAC, 20+ internal accounts, each scoped to their assigned function | `users`, `roles`, `permissions`, `role_permissions`, `departments` |
| 10 | **Customer Portal** — scoped login per customer, visibility limited to their own orders/traceability/EDD/dispatch status | `customer_portal_access`, query-layer scoping via `customer_pos.customer_id` |

---

## 2. Entity Relationship Overview

```
departments ──1:N── users ──N:1── roles ──N:M── permissions (via role_permissions)
                │
                └── assigned_stage_id ──N:1── process_stages

process_stages ──1:N── process_flow_steps ──N:1── process_flow_masters ──1:N── products
                                                          │
customers ──1:N── customer_portal_access                 │
    │                                                     │
    └──1:N── customer_pos ──N:1── products ───────────────┘
                   │
                   1:N
                   ▼
              job_cards (snapshots process_flow_master_id at launch)
                   │
                   1:N
                   ▼
            sub_job_cards ──N:1── process_stages (current_stage_id)
                   │  │
                   │  └── parent_sub_job_card_id (self-ref, split lineage)
                   1:N
                   ▼
         stage_movement_logs ──N:1── users, process_stages

job_cards ──1:N── dispatches ──1:N── notifications
users ──1:N── notifications (recipient)
customer_portal_access ──1:N── notifications (recipient)
users ──1:N── audit_logs
```

---

## 3. Table Definitions

### 3.0 Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- provides gen_random_uuid()
```

### 3.1 `departments` **[NEW]**
Explicitly called out in the flow ("department-wise role-based access") but not modeled in either original draft.

```sql
CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,   -- e.g. Production, Quality, Sales, Dispatch, Accounts, Admin
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true
);
```

### 3.2 `process_stages` (master list, company-wide)

```sql
CREATE TABLE process_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,   -- e.g. "Drilling", "Plating", "AOI Testing"
    description     TEXT,
    default_order   INT,                             -- UI convenience only, not enforced order
    is_active       BOOLEAN NOT NULL DEFAULT true
);
```

### 3.3 `roles`

```sql
CREATE TABLE roles (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(50) NOT NULL UNIQUE   -- e.g. admin, production_manager, process_user, dispatch_user, sales, supervisor
);
```

### 3.4 `permissions`

```sql
CREATE TABLE permissions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key          VARCHAR(100) NOT NULL UNIQUE,   -- e.g. job_card.launch, movement.create, report.export, user.manage
    description  VARCHAR(255)
);
```

### 3.5 `role_permissions` (join table)

```sql
CREATE TABLE role_permissions (
    role_id        UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id  UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
```

### 3.6 `users` (internal ERP users)

```sql
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    phone               VARCHAR(20),
    password_hash       VARCHAR(255) NOT NULL,
    role_id             UUID NOT NULL REFERENCES roles(id),
    department_id       UUID REFERENCES departments(id),
    assigned_stage_id   UUID REFERENCES process_stages(id),  -- only set when role = process_user
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
```

### 3.7 `process_flow_masters` (reusable, named process "recipe")

```sql
CREATE TABLE process_flow_masters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL UNIQUE,   -- e.g. "Standard 10-Stage Multilayer Flow"
    total_steps     INT NOT NULL DEFAULT 0,          -- denormalized, kept in sync via trigger or app logic
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.8 `process_flow_steps` (ordered stages within a flow)

```sql
CREATE TABLE process_flow_steps (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_flow_master_id  UUID NOT NULL REFERENCES process_flow_masters(id) ON DELETE CASCADE,
    stage_id                UUID NOT NULL REFERENCES process_stages(id),
    step_order              INT NOT NULL,             -- 1-based
    UNIQUE (process_flow_master_id, step_order),
    UNIQUE (process_flow_master_id, stage_id)          -- a stage shouldn't repeat in one flow (Phase 1 assumption — see §9 re: rework loops)
);

CREATE INDEX idx_pfs_flow_master_id ON process_flow_steps(process_flow_master_id);
```

### 3.9 `products` (Product Master)

```sql
CREATE TABLE products (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spec_card_no            VARCHAR(20) NOT NULL UNIQUE,   -- auto-generated, e.g. D001
    name                    VARCHAR(150) NOT NULL,
    pcb_size                VARCHAR(50),
    layers                  SMALLINT CHECK (layers > 0),
    thickness_mm            DECIMAL(6,2),
    copper_weight           VARCHAR(20),    -- e.g. 1oz, 2oz
    solder_mask             VARCHAR(100),
    legend                  VARCHAR(100),
    surface_finish          VARCHAR(100),
    drawing_file_url        TEXT,
    process_flow_master_id  UUID NOT NULL REFERENCES process_flow_masters(id) ON DELETE RESTRICT,
    is_active               BOOLEAN NOT NULL DEFAULT true,
    created_by              UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_spec_card_no ON products(spec_card_no);
```

### 3.10 `customers`

```sql
CREATE TABLE customers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name        VARCHAR(150) NOT NULL,
    contact_email       VARCHAR(150),
    contact_phone       VARCHAR(20),
    billing_address     TEXT,
    shipping_address    TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.11 `customer_portal_access` (scoped external login)

```sql
CREATE TABLE customer_portal_access (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    login_email     VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cpa_customer_id ON customer_portal_access(customer_id);
```

### 3.12 `customer_pos` (Customer Purchase Order)

```sql
CREATE TYPE po_status AS ENUM ('OPEN', 'IN_PRODUCTION', 'COMPLETED', 'DISPATCHED', 'CLOSED');

CREATE TABLE customer_pos (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_no                       VARCHAR(30) NOT NULL UNIQUE,   -- e.g. P001
    customer_id                 UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    product_id                  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,  -- Spec Card link
    order_qty                   INT NOT NULL CHECK (order_qty > 0),
    po_date                     DATE NOT NULL,
    expected_delivery_date      DATE,   -- EDD, surfaced on customer portal
    status                      po_status NOT NULL DEFAULT 'OPEN',
    created_by                  UUID NOT NULL REFERENCES users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pos_customer_id ON customer_pos(customer_id);
CREATE INDEX idx_pos_status ON customer_pos(status);
CREATE INDEX idx_pos_po_no ON customer_pos(po_no);
```
> Assumes one PO ↔ one Product (matches the client's example: `P001` → `D001`). See §9 if multi-line POs are needed later.

### 3.13 `job_cards`

```sql
CREATE TYPE job_card_status AS ENUM ('NOT_LAUNCHED', 'IN_PROGRESS', 'COMPLETED', 'DISPATCHED');

CREATE TABLE job_cards (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_no             VARCHAR(30) NOT NULL UNIQUE,   -- e.g. JC001
    po_id                   UUID NOT NULL REFERENCES customer_pos(id) ON DELETE RESTRICT,
    total_qty               INT NOT NULL CHECK (total_qty > 0),   -- always equals linked PO order_qty
    process_flow_master_id  UUID NOT NULL REFERENCES process_flow_masters(id),  -- snapshot, copied from products.process_flow_master_id at launch time
    status                  job_card_status NOT NULL DEFAULT 'NOT_LAUNCHED',
    qr_code_value           VARCHAR(100) NOT NULL UNIQUE,
    qr_code_image_url       TEXT,
    launched_at             TIMESTAMPTZ,     -- set when the Job Card enters Stage 1
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_cards_po_id ON job_cards(po_id);
CREATE INDEX idx_job_cards_status ON job_cards(status);
```
> **Why the flow is snapshotted here:** if a product's `process_flow_master_id` is changed later (a new flow assigned to it), already-launched Job Cards keep running the flow they were launched with. This resolves the open question in the original .md draft about editing a product's flow after Job Cards already exist against it.

### 3.14 `sub_job_cards`

```sql
CREATE TYPE sub_job_status AS ENUM ('PENDING', 'IN_STAGE', 'COMPLETED', 'REJECTED_CLOSED', 'DISPATCHED');

CREATE TABLE sub_job_cards (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_job_card_no         VARCHAR(30) NOT NULL UNIQUE,   -- e.g. JC001-1
    job_card_id             UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    qty                     INT NOT NULL CHECK (qty > 0),
    current_stage_id        UUID REFERENCES process_stages(id),
    status                  sub_job_status NOT NULL DEFAULT 'PENDING',
    qr_code_value           VARCHAR(100) NOT NULL UNIQUE,
    qr_code_image_url       TEXT,
    parent_sub_job_card_id  UUID REFERENCES sub_job_cards(id),  -- set when created by a mid-stage split
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sjc_job_card_id ON sub_job_cards(job_card_id);
CREATE INDEX idx_sjc_current_stage_id ON sub_job_cards(current_stage_id);
CREATE INDEX idx_sjc_status ON sub_job_cards(status);
```
> **Application-level constraint** (needs a trigger or service-layer check, not plain SQL): `SUM(qty) FROM sub_job_cards WHERE job_card_id = X` must never exceed `job_cards.total_qty`.

### 3.15 `stage_movement_logs` (append-only traceability — the core tracking table)

```sql
CREATE TABLE stage_movement_logs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_job_card_id             UUID NOT NULL REFERENCES sub_job_cards(id) ON DELETE RESTRICT,
    stage_id                    UUID NOT NULL REFERENCES process_stages(id),
    user_id                     UUID NOT NULL REFERENCES users(id),
    qty_received                INT NOT NULL CHECK (qty_received >= 0),
    qty_processed               INT NOT NULL CHECK (qty_processed >= 0),
    qty_forwarded               INT NOT NULL CHECK (qty_forwarded >= 0),
    qty_rejected                INT NOT NULL DEFAULT 0 CHECK (qty_rejected >= 0),
    rejection_reason            VARCHAR(255),
    split_to_sub_job_card_id    UUID REFERENCES sub_job_cards(id),  -- set when a partial forward spins off a new sub-job-card split
    client_request_id           UUID,     -- offline-sync idempotency key from the mobile scanning app
    timestamp                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (qty_forwarded + qty_rejected <= qty_processed),
    CHECK (qty_processed <= qty_received),
    CHECK (qty_rejected = 0 OR rejection_reason IS NOT NULL)
);

CREATE INDEX idx_sml_sub_job_card_id ON stage_movement_logs(sub_job_card_id);
CREATE INDEX idx_sml_stage_id ON stage_movement_logs(stage_id);
CREATE INDEX idx_sml_timestamp ON stage_movement_logs(timestamp);
CREATE UNIQUE INDEX idx_sml_client_request_id ON stage_movement_logs(client_request_id) WHERE client_request_id IS NOT NULL;
```
> **No UPDATE/DELETE** on this table at the application layer — revoke those grants for the app's DB role. Corrections are new offsetting rows, never edits. `client_request_id` prevents duplicate inserts when the mobile app retries an offline-queued scan.

### 3.16 `dispatches`

```sql
CREATE TYPE delivery_status AS ENUM ('DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'DELIVERY_FAILED');

CREATE TABLE dispatches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id         UUID NOT NULL REFERENCES job_cards(id) ON DELETE RESTRICT,
    dispatched_qty      INT NOT NULL CHECK (dispatched_qty > 0),
    dispatched_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    dispatched_by       UUID NOT NULL REFERENCES users(id),
    delivery_status     delivery_status NOT NULL DEFAULT 'DISPATCHED',
    delivered_at        TIMESTAMPTZ,
    delivery_photo_url  TEXT,     -- mandatory before delivery_status = DELIVERED (app-enforced)
    delivered_by_name   VARCHAR(150),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispatches_job_card_id ON dispatches(job_card_id);
CREATE INDEX idx_dispatches_status ON dispatches(delivery_status);
```

### 3.17 `notifications` **[carried over from .docx draft — required by flow step 8]**

```sql
CREATE TYPE notification_type AS ENUM ('DISPATCH_ALERT', 'DELIVERY_CONFIRMED', 'REJECTION_ALERT');

CREATE TABLE notifications (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id           UUID REFERENCES users(id),                    -- internal recipient
    recipient_portal_access_id  UUID REFERENCES customer_portal_access(id),   -- customer recipient
    type                        notification_type NOT NULL,
    reference_table             VARCHAR(50),   -- e.g. 'dispatches', 'stage_movement_logs'
    reference_id                UUID,
    message                     VARCHAR(500) NOT NULL,
    is_read                     BOOLEAN NOT NULL DEFAULT false,
    sent_at                     TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (recipient_user_id IS NOT NULL OR recipient_portal_access_id IS NOT NULL)
);

CREATE INDEX idx_notifications_recipient_user ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_recipient_portal ON notifications(recipient_portal_access_id);
```
> Delivery *channel* (push/email/SMS/in-app) is intentionally not modeled here yet — see §9.

### 3.18 `daily_report_snapshots` (pre-aggregated, for fast dashboard load)

```sql
CREATE TABLE daily_report_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date         DATE NOT NULL,
    stage_id            UUID REFERENCES process_stages(id),
    total_processed     INT DEFAULT 0,
    total_rejected      INT DEFAULT 0,
    total_forwarded     INT DEFAULT 0,
    wip_qty             INT DEFAULT 0,
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (report_date, stage_id)
);
```

### 3.19 `audit_logs`

```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,   -- e.g. LOGIN, USER_CREATED, ROLE_CHANGED, PRODUCT_UPDATED
    entity_table    VARCHAR(100),
    entity_id       UUID,
    before_value    JSONB,
    after_value     JSONB,
    ip_address      VARCHAR(50),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## 4. Full CREATE TYPE list (create before any table that uses them)

```sql
CREATE TYPE po_status          AS ENUM ('OPEN', 'IN_PRODUCTION', 'COMPLETED', 'DISPATCHED', 'CLOSED');
CREATE TYPE job_card_status    AS ENUM ('NOT_LAUNCHED', 'IN_PROGRESS', 'COMPLETED', 'DISPATCHED');
CREATE TYPE sub_job_status     AS ENUM ('PENDING', 'IN_STAGE', 'COMPLETED', 'REJECTED_CLOSED', 'DISPATCHED');
CREATE TYPE delivery_status    AS ENUM ('DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'DELIVERY_FAILED');
CREATE TYPE notification_type  AS ENUM ('DISPATCH_ALERT', 'DELIVERY_CONFIRMED', 'REJECTION_ALERT');
```

---

## 5. Table Creation Order (no forward-reference workarounds needed)

Both original drafts had a `users` ↔ `process_stages` circular-reference problem requiring an `ALTER TABLE` after the fact. Re-sequencing avoids that entirely — `process_stages` has no dependency on `users`, so it can simply be created first.

```
1.  departments
2.  process_stages
3.  roles
4.  permissions
5.  role_permissions        (depends on: roles, permissions)
6.  users                   (depends on: roles, departments, process_stages)
7.  process_flow_masters    (depends on: users — for created_by)
8.  process_flow_steps      (depends on: process_flow_masters, process_stages)
9.  products                (depends on: process_flow_masters, users)
10. customers
11. customer_portal_access  (depends on: customers)
12. customer_pos            (depends on: customers, products, users)
13. job_cards                (depends on: customer_pos, process_flow_masters)
14. sub_job_cards            (depends on: job_cards, process_stages — self-referencing FK)
15. stage_movement_logs      (depends on: sub_job_cards, process_stages, users)
16. dispatches                (depends on: job_cards, users)
17. notifications             (depends on: users, customer_portal_access)
18. daily_report_snapshots    (depends on: process_stages)
19. audit_logs                (depends on: users)
```

---

## 6. Key Business Rules Enforced at Application Layer (not plain SQL)

| Rule | Table(s) | Why not pure SQL |
|---|---|---|
| Sum of `sub_job_cards.qty` per Job Card ≤ `job_cards.total_qty` | sub_job_cards, job_cards | Cross-row aggregate constraint — needs a trigger or service-layer check |
| A Process User can only insert `stage_movement_logs` for their `assigned_stage_id` | users, stage_movement_logs | Authorization logic, not a data constraint |
| `stage_movement_logs` rows are never updated/deleted | stage_movement_logs | Enforced via DB role permissions + service layer |
| Customer Portal queries auto-scoped to `customer_id` | customer_pos and everything downstream | Every portal query must join through `customer_portal_access.customer_id = current_user.customer_id` |
| `process_flow_steps.step_order` must be contiguous (1,2,3… no gaps) | process_flow_steps | Validate on save in the Process Flow Builder UI/API |
| `delivery_photo_url` required before `delivery_status = 'DELIVERED'` | dispatches | Business rule tied to a state transition, not a static column constraint |
| A role's granted `permissions` gate which API actions a user can call | roles, permissions, role_permissions | Authorization logic lives in the service layer, checked per-request |

Note: `rejection_reason` required when `qty_rejected > 0` **is** enforced at the DB level now (a `CHECK` constraint on `stage_movement_logs`), tightened up from being app-only in both original drafts.

---

## 7. Reporting Views

The client's flow (step 6) lists eight required daily production reports. Each maps to a straightforward view built directly on the transactional tables — no need to wait on `daily_report_snapshots` for correctness, though the snapshot table should still be populated nightly for large-scale dashboard performance.

```sql
-- 1. Stage-wise production output (per day)
CREATE VIEW v_stage_wise_output AS
SELECT stage_id, DATE(timestamp) AS report_date,
       SUM(qty_processed) AS total_processed,
       SUM(qty_forwarded) AS total_forwarded
FROM stage_movement_logs
GROUP BY stage_id, DATE(timestamp);

-- 2. Pending quantity at each process (current WIP per stage)
CREATE VIEW v_pending_qty_per_stage AS
SELECT current_stage_id, SUM(qty) AS pending_qty
FROM sub_job_cards
WHERE status = 'IN_STAGE'
GROUP BY current_stage_id;

-- 3. Overall WIP
CREATE VIEW v_total_wip AS
SELECT SUM(qty) AS total_wip_qty
FROM sub_job_cards
WHERE status IN ('PENDING', 'IN_STAGE');

-- 4. Job launch status
CREATE VIEW v_job_launch_status AS
SELECT job_card_no, status, launched_at, completed_at
FROM job_cards;

-- 5. Lead time per Job Card
CREATE VIEW v_job_card_lead_time AS
SELECT job_card_no,
       launched_at,
       completed_at,
       (completed_at - launched_at) AS lead_time
FROM job_cards
WHERE launched_at IS NOT NULL;

-- 6. Process-wise productivity (by user, by stage)
CREATE VIEW v_process_productivity AS
SELECT stage_id, user_id, DATE(timestamp) AS report_date,
       SUM(qty_processed) AS qty_processed
FROM stage_movement_logs
GROUP BY stage_id, user_id, DATE(timestamp);

-- 7. Rejection summary
CREATE VIEW v_rejection_summary AS
SELECT stage_id, rejection_reason, DATE(timestamp) AS report_date,
       SUM(qty_rejected) AS total_rejected
FROM stage_movement_logs
WHERE qty_rejected > 0
GROUP BY stage_id, rejection_reason, DATE(timestamp);

-- 8. Dispatch status
CREATE VIEW v_dispatch_status AS
SELECT jc.job_card_no, d.dispatched_qty, d.delivery_status, d.dispatched_at, d.delivered_at
FROM dispatches d
JOIN job_cards jc ON jc.id = d.job_card_id;
```

---

## 8. Indexing Strategy

Already declared inline with each table in §3. Additional composite indexes worth adding as data grows:

```sql
-- Most common dashboard query: "all active sub-job-cards at a given stage"
CREATE INDEX idx_sjc_stage_status ON sub_job_cards(current_stage_id, status);

-- Reporting date-range queries
CREATE INDEX idx_sml_stage_timestamp ON stage_movement_logs(stage_id, timestamp);

-- Customer portal's "my orders" query
CREATE INDEX idx_pos_customer_status ON customer_pos(customer_id, status);
```

---

## 9. Open Items to Confirm Before Finalizing (unresolved from both drafts + new from merge)

1. **Rework loops** — is a rejected quantity ever routed *back* to an earlier stage, or does it always exit the flow? Current schema assumes rejected qty exits. If rework is needed, `stage_movement_logs` needs a `reworked_to_stage_id` column, and `process_flow_steps` needs to permit non-linear/backward movement.
2. **Multi-line POs** — one PO ↔ one Product is assumed, matching the client's example (`P001` → `D001`). If a PO can cover multiple products, `customer_pos` needs a child `po_line_items` table instead of embedding `product_id`/`order_qty` directly.
3. **Pricing/Accounts** — multi-currency and pricing fields are intentionally omitted; scope for an Accounts module is unconfirmed. Add a separate `pricing` extension table later rather than overloading `customer_pos`.
4. **RBAC granularity** — full `roles`/`permissions`/`role_permissions` was chosen for flexibility, but if the client wants a leaner Phase 1, a fixed `user_role` ENUM (`ADMIN`, `PRODUCTION_MANAGER`, `PROCESS_USER`, `DISPATCH_USER`) on `users` directly is a simpler, valid fallback — swap `role_id` for a `role` enum column and drop `roles`/`permissions`/`role_permissions`.
5. **Notification channel** — `notifications` currently models *what* was sent and to whom, not *how* (email/SMS/push/in-app). Add a `channel` column once the client confirms which channels are in scope.
6. **QR code content** — should the QR encode the raw `id`/`sub_job_card_no`, or a signed/opaque token (to prevent someone forging a scan URL)? Recommend a signed token for anything reachable without login.
7. **Multi-factory / multi-tenant** — out of scope for Phase 1 per both original drafts; all entities currently live in a single schema.

---

## 10. Next Steps

1. Resolve §9 with the client — items 1, 2, and 4 affect core table structure and are expensive to retrofit after data exists.
2. Set up migrations (Prisma/TypeORM/Sequelize for Node, or Django/SQLAlchemy for Python) following the creation order in §5.
3. Seed master data before building any UI on top of this: `process_stages`, `roles`, `permissions`, `role_permissions`, `departments`.
4. Build the **Stage Engine service** — the core logic for split/forward/reject at a stage, enforcing the `sub_job_cards.qty` sum constraint (§6) and writing to `stage_movement_logs`. Unit test this thoroughly before wiring up any UI or mobile scanning flow.
5. Build **QR generation & resolution** — generate `qr_code_value` (and image) at Job Card / Sub-Job Card creation; resolve a scanned value back to a record for both the desktop and mobile scanning flows.
6. Build the **notification dispatcher** — trigger a `DISPATCH_ALERT` row on gate dispatch and a `DELIVERY_CONFIRMED` row on delivery update, per flow step 8.
7. Build the **reporting layer** on the §7 views, plus a nightly job to populate `daily_report_snapshots` for dashboard performance.
8. Revoke `UPDATE`/`DELETE` grants on `stage_movement_logs` for the application's DB role once the service layer is stable.
