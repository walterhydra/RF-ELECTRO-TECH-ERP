# MASTER_CONTEXT.md — PCB Manufacturing ERP

> This is the single source of truth for the project. Every developer, designer, and
> AI coding assistant working on this system should read this file first before
> touching any code. If something in another doc contradicts this file, this file wins.

---

## 1. Project Summary

We are building a **custom ERP system for a PCB (Printed Circuit Board) Manufacturing
company**. This is NOT a generic off-the-shelf ERP (like Tally/Odoo/SAP) — it is a
**production-traceability-first system** built around how a PCB factory actually
works: Product Spec → Customer PO → Job Card → Multi-stage shop-floor process
movement → QR-based tracking → Dispatch → Customer visibility.

Phase 1 (this document set) covers: Product Master, PO, Job Card + Sub-Job Cards,
Process Flow Engine, Process Tracking, Production Reports, QR/Barcode, Dispatch +
Delivery Confirmation, User Management (RBAC), Customer Portal.

Sales, Purchase, and Accounts modules are mentioned by the client as "Full ERP" scope
but are **not detailed yet** — they will be scoped in a later phase once Phase 1
(Production Core) is stable. Do not build these speculatively.

---

## 2. Domain Primer (PCB Manufacturing — for developers unfamiliar with the domain)

- **PCB (Printed Circuit Board)**: the board that electronic components are mounted
  on. Made of layers of copper and insulating material (laminate).
- **Panel**: PCBs are manufactured in batches called "panels" — one panel usually
  contains multiple individual PCB units (the panel gets cut/routed into pieces
  later). Order quantities in this system are counted in **panels**, not pieces.
- **Layers**: number of copper layers in the board (1, 2, 4, 6... layers). More
  layers = more complex process flow.
- **Copper thickness, Solder Mask, Legend/Silkscreen, Surface Finish**: physical/
  chemical specifications of the board — these are attributes on the Product Master,
  not something the ERP needs to "understand" deeply. Store them as structured
  fields/specs, don't hardcode business logic around specific values in Phase 1.
- **Process Flow**: PCB manufacturing happens in sequential stages (e.g., Cutting →
  Drilling → Plating → Etching → Solder Mask → Legend Print → Surface Finish →
  Routing → Electrical Test → Final QC → Packing). The exact stage list is
  **configurable per product**, not fixed in code — different products can have
  different flows and different number of steps (client's example uses 10 steps).
- **Job Card**: the production work order for a specific PO+Product+Quantity. It
  physically/digitally "travels" through the process stages.
- **Sub-Job Card**: a Job Card split into smaller batches so different portions can
  be at different stages simultaneously (real factories don't move everything as
  one lump — partial quantities move ahead while the rest is still processing).
- **WIP (Work In Progress)**: quantity currently inside the factory, not yet
  finished/dispatched.
- **Rejection**: at any stage, some quantity may fail QC and get rejected — this must
  be tracked with a reason for yield/quality analysis.

---

## 3. Core Entities & Relationships

```
Product Master (1) ──generates──> (1) Product Specification Card
        │
        │ defines
        ▼
Process Flow Template (ordered list of Process Stages, per product)

Customer (1) ──places──> (M) Purchase Order (PO)
PO (M) ──linked to──> (1) Product Specification Card

PO (1) ──generates──> (1) Job Card
Job Card (1) ──splits into──> (M) Sub-Job Cards
Sub-Job Card (1) ──moves through──> (M) Process Stage Movements (per stage, per date)

Each Process Stage Movement records:
  Job/Sub-Job Card, Stage, Date/Time, User, Qty Received,
  Qty Processed, Qty Forwarded, Qty Rejected, Rejection Reason

Job Card / Finished Goods (1) ──dispatched via──> (1) Dispatch Record
Dispatch Record (1) ──updated by──> Delivery Confirmation (status, photo, date, delivered by)

User (M) ──belongs to──> (1) Department/Process (role-based access)
Customer (1) ──has──> (1) Portal Login ──sees only──> own POs/Job Cards
```

### 3.1 Key Entities (data dictionary — expand during DB design)

| Entity | Key Fields | Notes |
|---|---|---|
| **Product Master** | Product Name/Code, PCB Size, Layers, Thickness, Copper Weight, Solder Mask Color, Legend, Surface Finish, Process Flow Template (linked), Spec Card No. (auto: D001, D002...) | Spec Card No. is auto-generated on save, sequential, never reused |
| **Process Flow Template** | Template Name, Ordered list of Process Stages | Reusable across products, or product-specific |
| **Process Stage (Master)** | Stage Name, Stage Sequence No., Department | e.g. Cutting, Drilling, Plating... configurable master list |
| **Customer Master** | Customer Name, Code, Contact, Portal Login credentials | |
| **Purchase Order (PO)** | PO No. (auto: P001...), Customer, Linked Product Spec Card, Order Qty (panels), Order Date, Required Delivery Date | |
| **Job Card** | Job Card No. (auto: JC001...), linked PO, Total Qty, Status (Launched/In-Process/Completed/Dispatched), Current Stage(s) | |
| **Sub-Job Card** | Sub Job Card No. (JC001-1, JC001-2...), Parent Job Card, Qty allocated, Current Stage | |
| **Process Movement Log** | Job/Sub-Job Card ref, Stage, Timestamp, User, Qty Received, Qty Processed, Qty Forwarded, Qty Rejected, Rejection Reason | Immutable — append-only, this is the traceability backbone |
| **Dispatch Record** | Job Card ref, Dispatch Date/Time, Dispatched By, Vehicle/Delivery Partner, Gate-out Notification sent (Y/N) | |
| **Delivery Confirmation** | Dispatch ref, Delivery Status, Delivery Date/Time, Delivery Photo, Delivered By, Notification sent (Y/N) | |
| **User** | Name, Login, Role, Department/Process assigned, Active/Inactive | Min. 20 internal users at launch |
| **Role/Permission** | Role Name, Module access, Process access | RBAC — see Section 5 |

---

## 4. Core Workflows (as given by client — this is the functional bible)

### 4.1 Product Creation
1. Admin/authorized user creates a **Product Master** with full specs (size, layers,
   thickness, copper, solder mask, legend, surface finish) **and selects the Process
   Flow** (ordered stages) for this product.
2. On Save → system auto-generates a unique **Product Specification Card No.**
   (sequential, e.g. D001, D002...).

### 4.2 Customer PO
1. User enters Customer PO into ERP, **linked to a Product Specification Card**.
2. PO No. is auto-generated (P001...) or entered manually — **confirm with client**
   whether PO numbers come from the customer (external) or are ERP-generated.
   *(Open question — see Section 8.)*

### 4.3 Job Card Generation
1. Based on PO order quantity, system generates a **Job Card** (JC001...) — this
   represents "launching" the production order.
2. Job Card can be **split into Sub-Job Cards** (JC001-1 ... JC001-N) at any point,
   for shop-floor batch movement flexibility. Split quantities must always sum to
   the parent's remaining quantity (system-enforced, never allow qty mismatch).

### 4.4 Process Flow Execution
1. Process Flow was already defined on the Product Master (ordered stages, e.g. 10
   steps total).
2. When a Job/Sub-Job Card enters Stage-1, that's the "launch" of production for
   that batch.
3. As quantities are processed at a stage, **partial quantities can move forward**
   to the next stage while the remainder stays at the current stage. Example: 1000
   panels enter Stage-1; 500 get processed and their Sub-Job Cards (JC001-1 to
   JC001-5) move to Stage-2; remaining 500 stay in Stage-1.
4. This repeats at every stage until all quantity reaches the final stage
   (typically Final QC / Packing).
5. **Design implication**: the system must support a Job Card / Sub-Job Card being
   "at" a stage independently of its siblings — stage progress is tracked per
   Sub-Job Card, not per parent Job Card.

### 4.5 Process Tracking (the traceability core)
Every single movement of a Job/Sub-Job Card through a stage must log:
- Date & Time
- User who performed the action
- Process/Stage Name
- Quantity Received (into this stage)
- Quantity Processed
- Quantity Forwarded (to next stage)
- Quantity Rejected
- Rejection Reason (mandatory if rejected qty > 0)

This log is **append-only / immutable** — never update or delete a movement record;
corrections happen via new offsetting entries, so history is always 100% accurate
for audits and traceability.

### 4.6 Production Reports (auto-generated, daily)
- Stage-wise production output
- Pending quantity at each process
- WIP (Work in Progress)
- Job launch status
- Lead Time per Job Card (time from launch to completion)
- Process-wise productivity
- Rejection Summary (by stage, by reason)
- Dispatch Status

### 4.7 QR Code / Barcode
- Every Job Card (and Sub-Job Card) gets a unique QR Code / Barcode at creation.
- Scannable via **desktop (webcam/USB scanner) and mobile app** for:
  - Job movement (advance to next stage)
  - Production update (enter processed/rejected qty)
  - Quantity confirmation
  - Traceability lookup (scan → see full history)

### 4.8 Dispatch & Delivery Confirmation
1. When Job Card / finished material physically leaves the factory gate, system
   sends an **automatic notification** to the responsible person.
2. Delivery partner / driver, once delivered, updates via mobile app:
   - Delivery Status
   - Delivery Date & Time
   - Delivery Confirmation Photo
   - Delivered By
3. System sends a confirmation notification once delivery is marked complete.

### 4.9 User Management
- 1 Master/Admin user (full access).
- Separate login per production process/department.
- **Department-wise, role-based access** — a user only sees/acts on their assigned
  process.
- Minimum 20 internal users at launch — design for this scale from day one but
  architect for growth (don't hardcode a 20-user assumption anywhere).

### 4.10 Customer Portal
- Each customer gets a dedicated login, strictly scoped to their own data:
  - Production Status
  - Job Progress
  - Traceability
  - Current Manufacturing Stage
  - Pending Quantity
  - Estimated Delivery Date (EDD)
  - Dispatch Status
- **Hard requirement**: strict data isolation — a customer must never be able to
  see another customer's PO/Job Card data, even via API manipulation (IDOR-proof).

---

## 5. Role-Based Access Control (RBAC) — Draft Model

| Role | Access |
|---|---|
| Master/Admin | Full access — all modules, all data, user management, master data |
| Production Manager | All process stages, reports, job card management (no user mgmt) |
| Process User (per stage) | Only their assigned stage(s): scan/update movement, view own stage's job cards |
| Dispatch User | Dispatch module, gate-out notifications |
| Accounts/Sales (future phase) | PO entry, customer master (TBD in later phase) |
| Customer (Portal) | Read-only, scoped strictly to own PO/Job Card data |

Design principle: **Role = set of (Module, Permission, Process/Department scope)**.
Don't hardcode roles in code — build a permission table so Admin can create/modify
roles without a developer.

---

## 6. Non-Functional Requirements

- **Traceability is the #1 priority** — every quantity movement must be auditable,
  immutable, and attributable to a user and timestamp.
- **Mobile + Desktop parity** for shop-floor operations (QR scanning must work on
  both).
- **Real-time-ish updates**: reports and dashboards should reflect shop-floor scans
  within seconds/minutes, not next-day batch jobs.
- **Offline tolerance (shop floor)**: factory floor network may be patchy — mobile
  app should queue scans and sync when connectivity returns (confirm with client
  if this is needed in Phase 1 or later).
- **Data integrity**: quantity math must always reconcile — Qty Received = Qty
  Processed + Qty still pending at that stage; Qty Processed = Qty Forwarded + Qty
  Rejected. System should validate/enforce this, not just trust user input.
- **Multi-tenant-safe customer portal** — strict row-level data isolation.
- **Auditability** — who did what, when, from where (IP/device), for every write
  action, not just production movements.

---

## 7. Suggested Module Breakdown (for planning, not final architecture)

1. Master Data (Product Master, Process Flow Templates, Customer Master, User/Role Master)
2. Sales Order Management (PO entry & linking)
3. Production — Job Card & Sub-Job Card Management
4. Production — Process Flow Engine & Stage Movement Tracking
5. QR/Barcode Generation & Scanning (Web + Mobile)
6. Reports & Dashboards
7. Dispatch & Delivery Management
8. Notifications (Email/SMS/Push/WhatsApp — confirm channel with client)
9. User & Role Management (Admin)
10. Customer Portal

---

## 8. Open Questions for Client (must be answered before/during Phase 1)

1. Is PO number system-generated or entered from the customer's PO document?
2. Can one PO have multiple products/multiple Product Spec Cards, or strictly 1:1?
3. What happens if a Sub-Job Card fails QC entirely (100% rejected) — does it
   still "move forward" as zero qty, or close out at that stage?
4. Is a Job Card allowed to skip stages, or go back a stage (rework)? Rework loops
   are common in PCB manufacturing (e.g., re-plating) — needs explicit handling.
5. Notification channels: Email? SMS? WhatsApp Business API? Push (mobile app)?
6. Offline mobile scanning requirement — yes/no for Phase 1?
7. Does the customer portal need document downloads (e.g., COA, test reports,
   invoices) in Phase 1, or just status visibility?
8. Barcode standard: QR only, or also traditional 1D barcode (some factories need
   both for legacy scanner hardware)?
9. Multi-factory / multi-location? Single factory only for now?
10. Any existing system (Excel-based tracking, old software) whose data needs
    migration?

> **Rule**: Do not silently assume answers to these in code. Flag them, get
> client confirmation, then update this file.

---

## 9. Related Documents

- `09_ACCEPTANCE_CRITERIA.md` — testable acceptance criteria per module
- `10_DEVELOPMENT_PHASES.md` — phased delivery plan
- `11_CODING_RULES.md` — engineering conventions/standards
- `12_DEPLOYMENT_AND_BACKUP_PLAN.md` — hosting, CI/CD, backup/DR strategy
