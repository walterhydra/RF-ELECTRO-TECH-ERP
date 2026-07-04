# PCB Manufacturing ERP — Master App Flow Document
### Phase 1 — Screen-by-Screen User Journeys Across Web, Mobile & Customer Portal

| | |
|---|---|
| **Document Type** | Master App Flow (merged from two prior drafts) — UI/UX companion to the PRD and TRD |
| **Companion Documents** | `PCB_ERP_Master_Spec.md` (PRD, FR-IDs) · `PCB_ERP_Master_TRD.md` (TRD, schema/API) |
| **Project** | ERP for PCB Manufacturing |
| **Status** | Ready for wireframing / frontend build |
| **Version** | 1.0 (Merged) |
| **Date** | July 2026 |

---

## 0. Note to the Building Agent (Antigravity)

This is the third document in the set — read `PCB_ERP_Master_Spec.md` (PRD, the *what*) and `PCB_ERP_Master_TRD.md` (TRD, the *how*) first. This document answers the third question: **what does the user actually see and tap, in what order, on each screen.**

How to use this document:
- Every journey below is tagged with the FR-ID(s) it implements (e.g. `FR-4.2`) — cross-reference the PRD for the underlying rule, and the TRD for the exact endpoint it calls.
- **§4's journeys are what routes/pages to build.** Each step names a screen; build one route/page per named screen, in the order shown.
- §5 (Screen Inventory) is the flat list to use for component/route scaffolding — build against this list, not just the journey diagrams, so nothing gets missed.
- §7 (Empty & Error States) — build every listed state alongside the "happy path" screen, not as an afterthought.
- §8 (Notes for Design & Engineering) contains hard behavioral requirements (e.g. customer portal must never expose rejection reasons) — treat these as acceptance criteria, not suggestions.

---

## 1. Purpose

This document maps every user journey across the system's three client applications — internal web app, mobile app, and customer portal — screen by screen. It sits alongside the PRD (what the system must do) and the TRD (how it's built), and answers: what does the user see and tap, in what order. Use it to:

- Build wireframes screen by screen
- Define routes/pages in the frontend codebase
- Identify every UI state (empty, loading, error, success) before development starts

Each journey below is broken into numbered steps. Every step names the screen the user is on, the action they take, and where that action leads next. Screens that recur across journeys (like Login) are described once in §3 and referenced afterward.

---

## 2. Surfaces / Platforms Overview

| Surface | Used By | Primary Purpose |
|---|---|---|
| **Internal Web App** | Admin, Production Manager | Full ERP functionality — setup, order entry, monitoring, reports, user management |
| **Shop Floor Mobile / PWA** | Process Users, Dispatch User | QR scanning, quick stage updates, delivery confirmation on the move |
| **Customer Portal (Web)** | Customers | Read-only order/production tracking, strictly scoped to their own data |

> **Role note:** one of the source drafts referenced a separate "Sales" persona for PO entry (Journey B, §4.2). The PRD's confirmed role list (PRD §6) doesn't include a dedicated Sales role — PO entry is performed by **Admin or Production Manager**. If the client wants a dedicated Sales role with narrower access than Admin, that's a small RBAC addition (new role + permission set), flagged here rather than assumed.

---

## 3. Global Screens & Login Flow

These recur across journeys and are described once here.

| Screen | Description |
|---|---|
| **Login** | Email/username + password. Role-based redirect after login: Admin/Production Manager → Dashboard; Process User → their assigned stage's job queue; Dispatch User → dispatch queue; Customer → Portal home. |
| **Dashboard (Home)** | Role-specific summary cards: pending job cards, today's output, rejections, dispatch due today. |
| **Notifications Panel** | Dispatch alerts, delivery confirmations, rejection escalations — bell icon, accessible from any screen. |
| **Forgot Password** | Standard reset-via-email flow, all surfaces. |
| **Error / 404** | Generic fallback, all surfaces. |
| **Session Expired** | Redirect to Login with a message, all surfaces. |

### Login → Role Routing

```
[App Launch / URL Visit]
        │
        ▼
  [Login Screen]
   (Email + Password)
        │
        ▼
  [Auth Check] ──── Fail ──► [Error: Invalid credentials] ──► back to Login
        │
      Success
        │
        ▼
  [Role Detection]
        │
   ┌────┼───────────────────┬───────────────┐
   ▼                        ▼               ▼
[Admin / Production Mgr]  [Process /       [Customer]
Dashboard                  Dispatch User]   Portal Home
                            Mobile Home /
                            Assigned Stage
                            Job Queue
```

Every screen in §4 assumes the user has already passed this login gate.

---

## 4. Journeys (Step-by-Step, FR-Tagged)

### Journey A — Admin: Product & Process Setup
*Covers `FR-1.1`, `FR-1.2`, `FR-4.1`.*

```
Dashboard → [Products] → Product List
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            [+ New Product]      [Click existing product]
                    │                   │
                    ▼                   ▼
        Product Creation Form    Product Detail View
        - Basic Specs tab        - Spec Card No. shown
        - Process Flow tab       - Full spec (read-only)
                    │             - Linked POs list
                    ▼             - [Edit] [Deactivate]
        Process Flow Selector
        - Select an existing flow, OR
        - [Create new flow] → Process Flow Builder
                    │
                    ▼
        Process Flow Builder (if new)
        - Drag-drop / numbered-list stage
          sequence builder, from master
          stage list
        - Save → returns to product form
          with flow attached
                    │
                    ▼
            [Save Product] → validates →
            Auto-generates Spec Card No. (e.g. D001)
                    │
                    ▼
        Spec Card Confirmation Screen
        ("Product ABC saved. Spec Card: D001")
        [View/Print Spec Card]
                    │
                    ▼
            Redirect to Product List
```

| Step | Screen | User Action | Leads To |
|---|---|---|---|
| 1 | Dashboard | Clicks "New Product" | Product Master Form |
| 2 | Product Master Form | Enters PCB size, layers, thickness, copper, solder mask, legend, surface finish | Process Flow Selector |
| 3 | Process Flow Selector | Selects an existing flow, or clicks "Create new flow" | Process Flow Builder (if new) or back to product form |
| 4 | Process Flow Builder | Adds ordered stages (e.g. Drilling, Plating...); saves | Returns to Product Master Form with flow attached |
| 5 | Product Master Form | Clicks Save | Spec Card Confirmation Screen (e.g. "D001 generated") |
| 6 | Spec Card Confirmation | Views/prints spec card | Product List |

> **Build note:** the Process Flow Builder is the most complex UI component in this journey — it's what makes each product's "recipe" configurable (TRD §4.2–4.3). Flag it for extra wireframe/UX attention.

---

### Journey B — PO Entry
*Covers `FR-2.1`. Performed by Admin or Production Manager (see role note, §2).*

| Step | Screen | User Action | Leads To |
|---|---|---|---|
| 1 | Dashboard | Clicks "New PO" | PO Entry Form |
| 2 | PO Entry Form | Selects customer (or "+ New Customer"); searches and selects linked Product Spec Card; enters order qty, PO date, EDD | PO Confirmation |
| 3 | PO Confirmation | Reviews details, clicks Confirm | PO Detail Screen, with "Generate Job Card" button |
| 4 | PO Detail Screen | Clicks "Generate Job Card" | Job Card created; navigates to Job Card Detail (Journey C) |

**PO Detail Screen (persistent view, revisited across the PO's lifecycle):**
- Status badge: Open / In Production / Dispatched / Closed
- Linked Job Card(s)
- "Generate Job Card" button (hidden once already generated)

---

### Journey C — Job Card Generation & Split
*Covers `FR-3.1`, `FR-3.2`.*

```
PO Detail → [Generate Job Card]
                    │
                    ▼
        Job Card auto-created (JC001)
        Status: "Not Launched"
                    │
                    ▼
            Job Card Detail Screen
            - Total Qty, linked PO, Product
            - Process Flow preview (stages list)
            - [Split into Sub-Job Cards] button
            - [Launch Job] button
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
[Split Screen]            [Launch directly
- Enter number of          without split]
  splits or custom          (treated as 1
  quantities per split      sub-job-card)
- Auto-generates
  JC001-1, JC001-2...
- Validation: sum of
  split quantities =
  total qty
        │
        ▼
[Confirm Split] → QR codes
auto-generated per
sub-job-card
        │
        ▼
[Launch Job] → status → "Launched" /
"In Progress"; all sub-job-cards
enter Stage-1; QR codes become active
```

---

### Journey D — Production Floor: Job Card Launch & Stage Movement
*Covers `FR-3.1`, `FR-3.2`, `FR-4.2`, `FR-5.1`, `FR-7.1`, `FR-7.2`. This is the **highest-frequency journey** and the one most used on mobile — build and test it first among the mobile screens.*

| Step | Screen | User Action | Leads To |
|---|---|---|---|
| 1 | Job Card Detail (web) | Supervisor clicks "Launch to Stage 1" | Job Card status → Launched; QR code becomes active |
| 2 | Mobile App Home | Process User taps "Scan" | Camera Scanner Screen |
| 3 | Scanner Screen | Scans the sub-job-card's QR code/tag | Sub-Job-Card Detail Screen (auto-advances, no intermediate tap — see §8) |
| 4 | Sub-Job-Card Detail Screen | Views current stage, quantity at stage, product spec | Taps "Update Movement" |
| 5 | Movement Update Screen | Enters quantity processed, quantity forwarded, quantity rejected + reason (if any) | Confirmation Screen |
| 6 | Confirmation Screen | Reviews and submits | If partial forward: new sub-job-card auto-created; user returns to Scanner for the next tag |
| 7 | Job Card Detail (web, supervisor view) | Sees real-time updated WIP and stage split reflected | Repeats for each stage until the final stage |

**Scanner validation state:** if the scanned job is not at the scanning user's assigned stage, show `Error: "This job is not at your stage"` and return to the Scanner screen — do not proceed to the update form.

**Movement Update Screen fields (mobile, pre-filled from scan):**
- Job: e.g. JC001-1, Product: ABC
- Qty at this stage: e.g. 500
- Input: Qty Processed
- Input: Qty Forwarded
- Input: Qty Rejected → if `> 0`, show Rejection Reason dropdown
- Submit validates: `forwarded ≤ processed`, `rejected` accounted within `processed`, `processed ≤ received` (TRD §5)

**Submit — online/offline branch (Phase-1 default is online-only; see PRD §13 / TRD §10):**
```
[Submit] → validates
   ┌────┴────┐
   ▼         ▼
Offline?   Online →
Queue      Submit to
locally,   server →
show       Success
"pending   toast →
sync"      back to
icon       Scanner
```
Even though Phase 1 targets online-only, design the submit action's client-side contract to already carry an idempotency key (TRD §10), so this offline branch can be turned on later without a screen redesign.

---

### Journey E — Supervisor: Monitoring, Kanban Tracking & Rejection Handling
*Covers `FR-6.1`, `FR-5.1`.*

```
Dashboard → [Job Cards] → Job Card List
   (filters: status, product, customer, date)
                    │
                    ▼
            Click a Job Card
                    │
                    ▼
        Job Card Live Tracking View
        ┌─────────────────────────────┐
        │ Stage-1 → Stage-2 → ... →    │  Kanban-style board:
        │ Stage-N                      │  columns = stages,
        │                              │  cards/chips =
        │ Sub-job cards shown as       │  sub-job-cards at
        │ cards/chips at their         │  their current stage
        │ current stage                │
        └─────────────────────────────┘
                    │
              ┌─────┴─────┐
              ▼           ▼
   Click a sub-job-card   Views stage-wise WIP
   → Full Traceability     summary cards on
     Log (every movement,  Dashboard → taps a
     user, qty, timestamp, stage card → Stage
     rejections)           Detail Screen (all
                            sub-job-cards at
                            that stage) → taps
                            a flagged rejection
                            → Rejection Detail
                            Screen (qty, reason,
                            logged user) →
                            Approve / Escalate /
                            Request rework note
```

> **Build note:** the Job Card Live Tracking View is effectively a **kanban board** — recommended UI pattern for stage-movement visibility (TRD §5's Stage Engine data, rendered).

---

### Journey F — Reports
*Covers `FR-6.1`.*

```
Dashboard → [Reports] → Report Type Selector
        │
   ┌────┼──────┬──────────┬───────────┬────────────┐
   ▼         ▼          ▼            ▼            ▼
Stage-wise  WIP    Job Launch   Rejection    Dispatch
Output     Report    Status      Summary      Status
   │         │          │            │            │
   └─────────┴──────────┴────────────┴────────────┘
                    │
                    ▼
        Each report: Date range filter
        + Table view + Chart view
        + [Export PDF] [Export Excel]
```

Also includes Lead Time Report (per Job Card), accessible from the same selector.

---

### Journey G — User Management
*Covers `FR-9.1`. Admin only.*

```
Dashboard → [Users] → User List
                            │
                    ┌───────┴───────┐
                    ▼               ▼
            [+ New User]     [Click existing user]
                    │               │
                    ▼               ▼
            User Creation      User Detail
            Form:              - [Edit] [Deactivate]
            - Name, Email,     - Activity log
              Phone
            - Role (dropdown:
              Admin / Production
              Manager / Process
              User / Dispatch User)
            - If Process User:
              Assign Stage
              (dropdown)
                    │
                    ▼
            [Save] → Auto-email
            with login credentials
            → Confirmation
```

---

### Journey H — Dispatch: Gate Dispatch & Delivery Confirmation
*Covers `FR-8.1`, `FR-8.2`.*

| Step | Screen | User Action | Leads To |
|---|---|---|---|
| 1 | Dispatch Queue (web) | Selects a completed Job Card ready for dispatch | Dispatch Entry Screen |
| 2 | Dispatch Entry Screen | Confirms dispatched quantity, destination, clicks "Dispatch" | Notification auto-sent to responsible person; status → In Transit |
| 3 | Mobile App — Delivery Screen | Delivery person opens the assigned dispatch on mobile after physical delivery | Delivery Confirmation Form |
| 4 | Delivery Confirmation Form | Enters delivery date/time, captures a photo, enters delivered-by name | Submits |
| 5 | Confirmation Submitted | Delivery status → Delivered; confirmation notification sent | Reflected instantly on Customer Portal (Journey I) |

**Admin/PM oversight view (Dispatch List):** Pending vs. Delivered tabs; clicking a Job Card shows qty ready, customer, EDD, delivery status, and the delivery photo once confirmed.

---

### Journey I — Customer Portal: Order Tracking
*Covers `FR-10.1`.*

| Step | Screen | User Action | Leads To |
|---|---|---|---|
| 1 | Portal Login | Customer logs in with their dedicated credentials | Portal Home — Order List |
| 2 | Order List | Sees only their own POs, with status badges (In Production / Dispatched / Delivered) | Taps an order |
| 3 | Order Detail Screen | Views current manufacturing stage (e.g. "Stage 6 of 10"), pending quantity, EDD | Taps "Traceability" |
| 4 | Traceability View | Sees a simplified stage-by-stage progress timeline for their order — internal rejection detail and user names hidden | Back to Order List |
| 5 | Order Detail Screen | Once dispatched, sees dispatch status; once delivered, sees delivery confirmation | — |

> **No navigation exists to any other customer's data** — enforced by the backend (TRD §9), and on the frontend there must be no UI path (URL, dropdown, search) that even attempts to reference another customer's records.

---

## 5. Screen Inventory

Use this flat list for route/component scaffolding, alongside the journey diagrams in §4.

### 5.1 Internal Web App
| Screen | Purpose |
|---|---|
| Login | Authenticate internal users |
| Dashboard | Role-specific summary and shortcuts |
| Product Master List / Form | Create and manage product specifications |
| Process Flow Builder | Define ordered manufacturing stages per product |
| PO Entry / List / Detail | Capture and track customer purchase orders |
| Job Card Detail | Launch, monitor, and drill into a job card and its sub-job-cards |
| Job Card Split Screen | Divide a job card into sub-job-cards, with quantity validation |
| Job Card Live Tracking (Kanban) | Stage-by-stage visual view of all sub-job-cards |
| Stage Detail | WIP and pending quantity at a specific process stage |
| Movement History (Timeline) | Full traceability log for a sub-job-card |
| Rejection Detail | Review a flagged rejection; approve / escalate / request rework |
| Reports | Daily production, WIP, job launch status, lead time, rejection, dispatch reports |
| Dispatch Queue / Entry | Record outbound dispatch from the factory gate |
| User Management (List / Form / Detail) | Admin creates/deactivates users, assigns roles and process access |

*(~18–20 screens once list/detail/form pairs are counted individually — useful for wireframe/estimation planning.)*

### 5.2 Mobile App / PWA
| Screen | Purpose |
|---|---|
| Login | Authenticate Process/Dispatch users |
| Home / Scan Shortcut | Quick access to camera scanner; shows assigned stage |
| Scanner | Scan QR/barcode on a job card tag |
| Sub-Job-Card Detail | View current stage and quantities after scan |
| Movement Update Form | Log processed/forwarded/rejected quantities |
| Dispatch Home | Scan-for-dispatch and confirm-delivery entry points |
| Delivery Confirmation Form | Capture delivery photo, date/time, delivered-by |

*(~6–8 screens.)*

### 5.3 Customer Portal
| Screen | Purpose |
|---|---|
| Portal Login | Customer authentication, scoped credentials |
| Order List | All of the customer's own orders, with status |
| Order Detail | Stage, pending qty, EDD, dispatch status |
| Traceability View | Simplified progress timeline, customer-safe detail only |

*(~3–4 screens.)*

---

## 6. Cross-Cutting Screens (All Surfaces)

| Screen | Applies To | Notes |
|---|---|---|
| Login | All | Role-based redirect after auth (§3) |
| Forgot Password | All | Standard reset-via-email flow |
| Error / 404 | All | Generic fallback |
| Session Expired | All | Redirect to login with message |
| Notifications Panel | Admin, Dispatch | Dispatch/delivery/rejection alerts, bell icon |

---

## 7. Empty & Error States to Design For

- Product list with zero products (brand-new setup) — show "No data yet — start by creating your first Product" with a CTA button.
- Job Card with zero sub-job-cards yet (before split).
- Stage Update submitted but rejected qty = full qty (job effectively stuck) — flag visually on the Kanban/tracking view.
- QR scan of an invalid/unknown code.
- QR scan of a job not assigned to the scanning user's stage (see Journey D validation).
- Customer Portal — order with no movement yet ("Production not yet started").
- Offline submission failure after retries (mobile) — needs a manual retry option, not just silent queuing.

---

## 8. Notes for Design & Engineering (Hard Requirements)

- **Movement Update Form (Journey D, step 5) is the single highest-usage screen** — optimize for large touch targets and minimal typing (numeric steppers over free text), since it will be used hundreds of times a day.
- **Scanner screen should auto-advance** to the Sub-Job-Card Detail screen on a successful scan, with **no intermediate confirmation tap**, to keep floor throughput fast.
- **Customer Portal Traceability view must never expose rejection reasons or internal user names** — only stage and quantity — this is a hard requirement from the PRD's customer-data-isolation rule (`FR-10.1`), not just a design preference.
- All web screens should have a **mobile-responsive fallback** for supervisors checking status away from a desktop, even though the primary floor interaction is via the dedicated mobile app.

---

## 9. Screen Count Summary (for Wireframe Planning)

| Surface | Approx. Screens |
|---|---|
| Internal Web App | ~18–20 (list + detail + form pairs across 6 modules) |
| Mobile / PWA | ~6–8 |
| Customer Portal | ~3–4 |

---

## 10. Next Steps

1. Convert this flow into **low-fidelity wireframes** (Figma or similar), screen by screen, matching §4's journeys.
2. Validate the **Job Card Kanban view (Journey E)** and the **Movement Update Form (Journey D, step 5)** with the client early — these are the most-used screens on the shop floor and worth getting right before full build.
3. Once wireframes are approved, move to high-fidelity UI and component-level frontend task breakdown, mapped to the TRD's Milestones (TRD §13).
