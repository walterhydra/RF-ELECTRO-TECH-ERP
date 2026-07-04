# PCB Manufacturing ERP — Master Build Specification
### Phase 1 — Production, Traceability & Order Management

| | |
|---|---|
| **Document Type** | Master PRD / Build Specification (merged from two prior drafts + client's raw workflow notes) |
| **Project** | ERP for PCB (Printed Circuit Board) Manufacturing |
| **Phase** | Phase 1 — Core Production + Traceability |
| **Status** | Ready for build — a small set of open questions remain (see §14) |
| **Version** | 1.0 (Merged) |
| **Date** | July 2026 |

---

## 0. Note to the Building Agent (Antigravity)

You are building Phase 1 of an ERP system for a PCB manufacturing company. Read this document fully before writing code — the domain has non-obvious logic (Section 2) that shapes almost every table and screen.

How to use this document:
- **§1–3** give you the "why" — read these first so later decisions make sense.
- **§4** is the client's original workflow in their own words. Treat it as the source of truth if anything elsewhere conflicts with it.
- **§7** (Functional Requirements) is written as FR-IDs with acceptance criteria — build against these directly, and use the FR-IDs in commit messages / test names for traceability.
- **§8** is the data model — design your schema from this before writing feature code.
- **§13** lists assumptions this document already made on the client's behalf so you are not blocked. They are reasonable defaults, not confirmed requirements — flag them for client sign-off, but you don't need to wait for an answer to start building.
- **§14** is the short list of questions that genuinely need a client answer before you build that specific piece (they're called out per-item, so you can build everything else in parallel).
- Build **Module 4 (Stage Movement Engine) and Module 5 (Traceability Log) first** — nearly every other module (reports, QR scanning, customer portal) reads from these two.

---

## 1. Purpose

This document converts the client's raw requirement notes into a structured specification for:
- Client sign-off (so both sides agree on what "done" means)
- Database and system design
- Sprint/feature planning and effort estimation
- QA test case creation

This is a **living document** — the client has said more logic will be added during development. New logic should be added as new FR-IDs, not by editing existing ones, so history stays traceable.

---

## 2. Background — What is a PCB and why does this ERP look this way?

A **PCB (Printed Circuit Board)** is the board inside electronic devices that holds and connects components. Manufacturing a PCB is not a single step — it's a **sequence of physical processes** (drilling, plating, etching, solder mask application, legend printing, surface finish, testing, etc.), typically 8–10+ stages. Every PCB design ("product") can have a *different* sequence of steps depending on its specification (layers, thickness, finish, etc.).

A single customer order is also **not a single physical batch**. On the shop floor, 1000 panels don't finish Stage-1 at the same moment — some move ahead while others are still processing, at different speeds, with different rejection rates. So the same order physically **splits into batches that move independently and at different speeds** through the process flow.

This is why the ERP is not a generic "make → sell" system. It is built around **three core ideas** — keep these in mind for every design decision:

1. **Every product has its own recipe** (Process Flow) — e.g., Product A goes through 10 stages, Product B might go through 6.
2. **A single customer order is split into physical batches (Job Cards / Sub-Job Cards)** that move independently through the recipe.
3. **Every movement must be logged** (who, when, how many, rejected how many) — in electronics manufacturing this is often a compliance/quality requirement (ISO-type audits), not a nice-to-have.

This explains why **Job Card splitting** and **Stage tracking** (Modules 3 & 4) are the heart of the system, and should be built as a generic, configurable engine — not hardcoded to any fixed number of stages.

---

## 3. Glossary (Domain Terms → Plain Meaning)

| Term | Meaning |
|---|---|
| **Product Master** | A saved record of one PCB design + all its technical specs. Reusable for future orders. |
| **Product Specification Card** | Auto-generated ID/document for a Product Master once saved (e.g., D001). |
| **PO (Purchase Order)** | The customer's official order, entered into ERP and linked to a product. |
| **Job Card** | A production work order generated against a PO for a given quantity (e.g., JC001 for 1000 panels). |
| **Sub-Job Card** | A split of a Job Card into smaller batches for shop-floor movement (JC001-1, JC001-2...). |
| **Process Flow / Stage** | The ordered list of manufacturing steps a product must go through (Stage-1 → Stage-N). |
| **WIP** | Work in Progress — quantity currently inside production, not yet finished. |
| **Lead Time** | Total time a Job Card takes from launch to completion. |
| **EDD** | Estimated Delivery Date shown to the customer. |
| **Panel** | The base unit of PCB quantity being tracked (like "pieces" in other industries). |

---

## 4. Original Client Workflow (Source of Truth)

This is the client's own description of the required flow, preserved here so the agent can cross-check every feature against it directly.

**1. Product Creation**
A Product Master is created in the ERP with all specifications: PCB size, layers, thickness, copper, solder mask, legend, surface finish, process flow, etc. After saving, a unique **Product Specification Card** is generated.
*Example: Product ABC → Product Specification Card No. D001*

**2. Customer Purchase Order (PO)**
Customer PO is entered into the ERP and linked to the respective Product Specification Card.
*Example: PO No. P001 → linked with D001*

**3. Job Card Generation**
Based on order quantity, the ERP generates a Production Job Card. The Job Card can be divided into multiple Sub-Job Cards for production movement and traceability.
*Example: Order Qty 1000 Panels → Job Card JC001 → split into JC001-1 ... JC001-10*

**4. Process Flow**
The complete manufacturing process flow is selected while creating the Product Specification Card (e.g., 10 total steps). When a Job Card enters Stage-1, the job is "launched." A stage can process a partial quantity and forward it — e.g., Stage-1 processes 500 of 1000 panels, so JC001-1 to JC001-5 move to Stage-2 while the remainder continues in Stage-1. The same partial-forward logic repeats at every stage.

**5. Process Tracking**
For every Job Card movement, the ERP records: Date & Time, User Name, Process Name, Quantity Received, Quantity Processed, Quantity Forwarded, Quantity Rejected, Rejection Reason (if any) — for complete production traceability.

**6. Production Reports**
Automatic daily reports: stage-wise output, pending quantity per process, WIP, job launch status, lead time per Job Card, process-wise productivity, rejection summary, dispatch status.

**7. QR Code / Barcode**
Every Job Card has a unique QR/barcode, scannable from desktop and mobile, for job movement, production update, quantity confirmation, and traceability.

**8. Dispatch Notification**
When a Job Card or finished material is dispatched from the factory gate, the ERP automatically notifies the responsible person. Once the delivery partner delivers to the customer, the ERP/mobile app is updated with: Delivery Status, Delivery Date & Time, Delivery Confirmation Photo, Delivered By — and a delivery-confirmed notification is sent.

**9. User Management**
One Master/Admin user, separate users per production process, department-wise role-based access, minimum 20 internal user accounts. Each user accesses only functions related to their assigned process.

**10. Customer Portal**
Dedicated login per customer, showing only their own products/orders: Production Status, Job Progress, Traceability, Current Manufacturing Stage, Pending Quantity, EDD, Dispatch Status. Strictly no visibility into other customers' data.

---

## 5. Goals of Phase 1

1. Digitize product specifications and eliminate paper-based job cards.
2. Give real-time, stage-wise visibility of every order — internally and to the customer.
3. Capture rejection data at every stage for quality analysis.
4. Enable QR/barcode-based shop-floor updates (desktop + mobile).
5. Automate daily production reporting (currently manual/Excel).
6. Provide a secure, role-based multi-user system (~20 users at launch).
7. Give customers self-service order visibility (reduce "what's the status?" calls/emails).
8. Establish a clean, extensible data model that later phases (costing, inventory, finance) can build on without rework.

### Out of Scope for Phase 1 (build as Phase 2 candidates)
- Full Accounts/Finance module (ledgers, GST invoicing, payments)
- Raw material inventory / procurement (Purchase module) / BOM-based material consumption
- Machine/equipment maintenance tracking
- Payroll/HR
- Multi-factory/multi-location support
- Delivery-partner system integration (API-based courier tracking)
- Offline-first mobile scanning with background sync
- Advanced analytics/BI beyond the standard daily reports

---

## 6. User Roles

| Role | Description | Access |
|---|---|---|
| **Master/Admin** | Business owner / ERP admin | Full access — all modules, user creation, master data |
| **Production Manager** *(recommended addition)* | Oversees full shop floor | View all stages, all reports, job launch approval, cross-stage overrides |
| **Process User** (×~18–20) | Operator assigned to one production stage | Only their assigned stage: scan/update job cards, log quantity & rejections |
| **Dispatch/Gate User** | Manages outward material | Dispatch entry, delivery confirmation |
| **Customer** | External, per-company login | Read-only Customer Portal — only their own data |

> The client's notes list Admin + Process Users only. A **Production Manager** role is added here because someone needs cross-stage visibility and job-launch authority that sits between a single-stage operator and full Admin rights. Flagged in §14 for confirmation, but recommended to build regardless.

---

## 7. Functional Requirements

Each requirement has a unique ID for traceability into test cases, sprint planning, and commit messages.

### 7.1 Product Master
**FR-1.1 — Create product master with full specification**
Capture PCB size, layer count, thickness, copper weight, solder mask (color/type), legend/silkscreen, surface finish (HASL, ENIG, OSP, etc.), attachments (drawing/Gerber files), and the full manufacturing **process flow** for that product.
- Acceptance: all specification fields mandatory before save; process flow selected from a master Stage list at creation time; process flow length is not fixed (varies per product).

**FR-1.2 — Auto-generate Product Specification Card**
On save, generate a unique, sequential card number (e.g., D001), permanently linked to the product.
- Acceptance: numbers are unique and never reused; card is viewable/printable as a standalone document.

### 7.2 Customer PO (Sales Order)
**FR-2.1 — PO entry linked to Product Spec Card**
Capture PO No., PO Date, Customer, linked Product Spec Card, Order Quantity, Delivery Terms, Expected Delivery Date.
- Acceptance: PO cannot be saved without a linked spec card; duplicate PO numbers per customer are blocked.
- Default assumption (see §13): one PO ↔ one product line item in Phase 1. Multi-line POs are a Phase 2 candidate.

### 7.3 Job Card Generation & Splitting
**FR-3.1 — Generate Job Card from PO quantity**
Auto-generate a Job Card (e.g., JC001) for the full order quantity, carrying forward the product's process flow.
- Acceptance: Job Card total quantity always equals linked PO quantity.

**FR-3.2 — Dynamic Sub-Job-Card splitting**
Job Cards split into Sub-Job Cards (JC001-1, JC001-2, ...) as partial quantities move through stages at different times. Splitting happens organically based on actual quantity moved at each stage — not as a fixed upfront division.
- Acceptance: sum of all sub-job-card quantities under a parent always equals the parent's total quantity minus confirmed rejections; each split is traceable back to the movement event that created it; system supports at least 999 sub-splits per parent without ID collisions; system prevents split quantities from exceeding the parent/available quantity.

### 7.4 Process Flow & Stage Movement
**FR-4.1 — Configurable process flow per product**
Process flow (ordered list of stages, e.g., 10 steps) is defined once at Product Master level and reused by every Job Card for that product.
- Acceptance: steps are ordered and enforced sequentially unless an Admin override is used.

**FR-4.2 — Stage launch and partial forwarding**
A Job Card entering Stage-1 is "launched." A user can forward a partial or full quantity to the next stage; the remainder stays at the current stage under its own sub-job-card. This repeats identically at every stage.
- Acceptance: forwarded quantity can never exceed quantity received at that stage; remaining quantity at a stage is visible in real time on the job card and in WIP reports; a Job Card is "Complete" only when its full quantity has exited the final stage.

> **Build note:** this is the most complex module. Build it as a generic **stage-transition engine** driven by the product's configured flow, not hardcoded to any fixed stage count.

### 7.5 Process Tracking (Traceability Log)
**FR-5.1 — Log every stage movement**
For every movement/update, record: Date & Time (auto), User Name (auto, from login), Process/Stage Name, Quantity Received, Quantity Processed, Quantity Forwarded, Quantity Rejected, Rejection Reason (dropdown + free text).
- Acceptance: log entries are **append-only / immutable** — corrections require a new offsetting entry, not an edit or delete; full movement history for any sub-job-card is viewable as a single chronological timeline. This table is the backbone of Reports (7.6) and the Customer Portal (7.10).

### 7.6 Production Reports (Daily, Automated)
**FR-6.1 — Automatic daily production reports**

| Report | Description |
|---|---|
| Stage-wise Production Output | Qty processed per stage per day |
| Pending Quantity per Process | Qty stuck at each stage |
| WIP Report | Total quantity in-process, across all stages/jobs |
| Job Launch Status | Which jobs launched, when, current stage |
| Lead Time per Job Card | Time from launch to completion |
| Process-wise Productivity | Throughput per stage/operator |
| Rejection Summary | Rejected qty + reasons, by stage/product/date |
| Dispatch Status | What's shipped vs. pending |

- Acceptance: reports generate automatically without manual trigger, available at shift start; filterable by date range, product, customer, and process stage; exportable (PDF/Excel).

### 7.7 QR Code / Barcode
**FR-7.1 — Unique QR code per Job Card / Sub-Job Card**
- Acceptance: printable on a job traveler/tag; QR payload uniquely resolves to one sub-job-card record.

**FR-7.2 — Scan-based movement update**
Scan from desktop (webcam/USB scanner) or mobile app camera to: view current stage, log quantity received/processed/forwarded/rejected (triggers FR-5.1), view basic traceability history.
- Acceptance: scanning opens directly into the correct job's movement-entry screen; Phase 1 target is **online-only** (offline-capable scanning with sync is a Phase 2 stretch — see §13).

### 7.8 Dispatch & Delivery
**FR-8.1 — Dispatch notification**
When material leaves the factory gate, auto-notify the responsible internal person.
- Acceptance: notification triggers within ~1 minute of dispatch entry; includes Job Card number, quantity, destination.

**FR-8.2 — Delivery confirmation**
Once the delivery partner delivers the material, mobile app/ERP is updated with: Delivery Status, Delivery Date & Time, Delivery Confirmation Photo, Delivered By — triggering a "delivered successfully" notification.
- Acceptance: delivery photo upload is mandatory to mark a dispatch as delivered; delivery status reflects in the Customer Portal immediately.
- Default assumption (see §13): delivery confirmation is entered manually by in-house delivery staff via the mobile app in Phase 1 (no courier/API integration).

### 7.9 User Management & Role-Based Access
**FR-9.1 — Role-based access control**
One Master/Admin, ~20 internal users, department-wise roles, each user restricted to only their assigned process's functions — enforced at **both UI and API level**.
- Acceptance: Admin can create/deactivate users and assign process-level access; a process user attempting to access another process's job card is blocked and logged; standard auth needs — login/logout, password reset, activation/deactivation, audit log of user actions.

### 7.10 Customer Portal
**FR-10.1 — Customer self-service login**
Dedicated login per customer, showing: Production Status, Job Progress, Traceability, Current Manufacturing Stage, Pending Quantity, EDD, Dispatch Status — for their own orders only.
- Acceptance (hard requirement): customer queries are always scoped **server-side** by authenticated customer ID — never by a client-supplied parameter; a customer must never see another customer's PO/Job Card/product data, even via URL manipulation or direct API calls.

---

## 8. Data Model — Key Entities

```
Product Master (1) ──< Process Flow Steps (ordered list, per product)
Product Master (1) ──< Customer PO (many)
Customer (1) ──< Customer PO (many)                 [for portal scoping]
Customer PO (1) ──< Job Card (1, Phase 1 default)
Job Card (1) ──< Sub-Job Card (many)
Sub-Job Card ──< Stage Movement Log (many)           [FR-5.1 data]
Job Card / Sub-Job Card ──< Dispatch Record (many)
Dispatch Record (1) ──< Delivery Confirmation (0..1)
User ──< assigned to ──> Process/Stage
User ──< performs ──> Stage Movement Log entries
```

Each **Stage Movement Log** entry references: Job/Sub-Job Card, Stage, User, Timestamp, Qty (received/processed/forwarded/rejected), Rejection Reason. This table is append-only.

Each **Sub-Job Card** references: Parent Job Card, Current Stage, Current Quantity, Origin Movement Event (which log entry created this split), QR/Barcode value.

Full field-level schema should be finalized by the build team from this entity list before writing migrations.

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Access** | Web app (desktop) + mobile app or mobile-responsive web (for QR scanning on the shop floor) |
| **Connectivity** | Shop floor may have weak/no Wi-Fi in some zones — Phase 1 target is online-only; design the scan/update API so offline-capable sync can be added later without a rewrite |
| **Performance** | Stage update/scan action should respond in <1–2 sec even with concurrent users during shift changes |
| **Security** | Role-based access control (RBAC), audit logs, encrypted customer-portal data isolation |
| **Scalability** | Should handle growth beyond 20 users and multiple simultaneous Job Cards without redesign |
| **Notifications** | Dispatch & delivery events — channel (SMS/Email/WhatsApp/push) to be confirmed with client (§14); build the notification layer channel-agnostic so this is a config change, not a rebuild |
| **Audit/Backup** | Movement logs (§7.5) are non-editable and backed up — relevant for quality audits (ISO-type, common in PCB industry) |

---

## 10. Suggested Technical Approach

Not the client's requirement — a working recommendation for the build team:

- **Backend:** Node.js / Django / Laravel (whichever the team is strongest in), REST or GraphQL API — one backend serving the internal ERP, mobile app, and customer portal.
- **Database:** PostgreSQL/MySQL — relational fits well given the clear entities and relationships in §8.
- **Frontend (internal ERP):** React/Vue admin dashboard.
- **Mobile (scanning):** Progressive Web App (PWA) with camera-based QR scanning is typically faster to ship than native apps for Phase 1 and works cross-platform — evaluate against the client's expectations.
- **QR/Barcode:** standard libraries for generation (e.g., `qrcode`) and scanning (e.g., `html5-qrcode`, `zxing`) — no custom hardware needed unless the client wants dedicated scanner guns.
- **Reports:** precompute daily reports via a scheduled job, cache results, allow on-demand refresh.

Build **Module 4 (Stage Engine)** and **Module 5 (Movement Log)** first — they are the foundation everything else (reports, portal, QR) reads from.

---

## 11. Suggested Build Phasing (within Phase 1 scope)

1. **Milestone 1:** Product Master + Process Flow config + User Management (RBAC)
2. **Milestone 2:** Customer PO + Job Card + Sub-Job Card generation/splitting
3. **Milestone 3:** Stage Movement Engine + Traceability Log + QR generation/scanning
4. **Milestone 4:** Reports Dashboard (daily auto reports)
5. **Milestone 5:** Dispatch & Delivery module + notifications
6. **Milestone 6:** Customer Portal
7. **Milestone 7:** UAT with client, bug fixing, go-live

This lets the client be given a phased quote/timeline instead of one large number.

---

## 12. Success Metrics (suggested — confirm with client)

- 100% of new orders processed through the ERP (zero paper job cards) within X weeks of go-live
- Real-time stage visibility available for all active Job Cards
- Daily reports generated automatically without manual Excel work
- Customer portal reduces status-inquiry calls/emails by a target %
- Full traceability available for 100% of dispatched Job Cards

---

## 13. Assumptions Made in This Document (build against these; flag for client sign-off)

These are defaults chosen so the build isn't blocked — not confirmed client requirements. Each is called out so it can be swapped later with minimal rework:

1. **One PO = one product line item** in Phase 1 (multi-product POs are Phase 2).
2. **One PO generates one Job Card** in Phase 1.
3. **Rejected quantity is scrapped**, not automatically sent back for rework — rework, if needed, is logged as a manual new movement entry, not an automatic system behavior.
4. **Sub-job-cards do not merge back together** once split — traceability is kept simple by treating each split as permanent.
5. **Process flow is fixed per product** at launch; no mid-production stage-skipping in Phase 1 (Admin override exists for exceptions, per FR-4.1).
6. **Delivery confirmation is manual**, entered by in-house delivery staff via the mobile app — no courier/API integration in Phase 1.
7. **QR/mobile scanning is online-only** in Phase 1; offline-first sync is a Phase 2 stretch goal.
8. **Rejection reasons** are a dropdown list (editable by Admin) plus a free-text field, so this is easy for the client to change from the manufacturing side.
9. **Notification channel** defaults to in-app + email; SMS/WhatsApp can be added as a config change.
10. Accounts/Finance, raw-material inventory, and multi-location support are **out of scope for Phase 1** (see §5).

---

## 14. Open Questions — Still Needs a Client Answer

These genuinely need the client's input; everything else in this document can be built without waiting on them.

1. Should **rejected quantity** ever be reworked back into the same stage, or is scrap always final? *(affects FR-5.1 / FR-4.2 logic)*
2. Should the **Production Manager** role (§6) be added, or should Admin cover that ground alone?
3. What is the actual **list of ~20 users/departments**, so roles can be mapped precisely before RBAC is built?
4. What **rejection reasons** are standard on the shop floor — should the list be pre-populated, and by whom?
5. **Order volume** expected (POs/month, Job Cards/month) — helps size the system correctly.
6. Do QR/barcode labels need to be **physically printed** on panels/boxes — if so, what printer/label hardware is already available?
7. Is **Accounts/Finance** actually needed in a near-term Phase 2, so the data model should anticipate it now (e.g., pricing fields on the PO)?

---

## 15. Next Steps

1. Share this document with the client — walk through §14 to get written answers on the truly blocking items.
2. Design the database schema from §8 before writing any code.
3. Build a clickable low-fi prototype of **Job Card + Stage Flow** (§7.3–7.4) first — this is the riskiest, most complex part and is worth validating with the client early.
4. Break Milestones (§11) into sprint-level tasks with story points once scope is locked.
5. Estimate effort/timeline per milestone.
