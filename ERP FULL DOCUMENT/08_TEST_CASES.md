# PCB Manufacturing ERP — Master Specification & Test Case Document
### (Merged for Antigravity — Business Flow + Consolidated QA Test Cases)

| | |
|---|---|
| **Document Type** | Merged Functional Spec + Test Cases (for AI coding agent / dev handoff) |
| **Derived From** | Client's ERP Flow description, `PCB_ERP_Test_Cases.docx`, `PCB_Manufacturing_ERP_Test_Cases.md` |
| **Status** | Consolidated Draft — ready to hand to Antigravity for build & self-check |
| **Version** | 1.0 (merged) |
| **Date** | 03 July 2026 |
| **Total Test Cases** | 103 (78 original + 25 new, added to close gaps found while merging) |

---

## 0. How This Document Was Built (read this first)

Two separate QA documents existed for the same system — one written as UI-level scenarios (`TC-001…TC-070`), one written as backend/API-level test cases (`TC-<MODULE>-##`). Both covered the same ten modules but from different angles, with some overlap and some gaps.

This document merges them into **one single source of truth**:

- **ID scheme used:** `TC-<MODULE>-##` (from the technical doc) — kept because it's easier to extend and query per module.
- **Priority scale used:** `P1` (blocks release) / `P2` (important, not blocking) / `P3` (edge case / nice-to-verify) — the scenario doc's High/Medium/Low were mapped to P1/P2/P3 respectively.
- **Duplicate test cases** (same intent, different wording) were merged into a single entry — the more precise/technical wording was kept.
- **New test cases** that existed in only one of the two docs, or that surfaced as a genuine gap while comparing them, are marked **🆕** in the ID column. There are 25 of these — see Section 4 modules below and the updated Open Items in Section 6.
- Section 1 below is the **client's own ERP process flow**, reformatted for reference so Antigravity has the business context before touching the test cases — build against this, verify against Section 4.

**Instruction to Antigravity:** Treat Section 1 as the functional requirement. Treat Section 4 as the acceptance criteria — a feature is not "done" until its P1 test cases pass. Section 6 (Open Items) lists the handful of behaviors that are ambiguous in the source material — flag these back to the client/product owner rather than silently assuming an answer.

---

## 1. ERP Process Flow — Business Requirement Reference

### 1.1 Product Creation
- A **Product Master** is created in the ERP first.
- All product specifications are captured: PCB size, layer count, thickness, copper weight, solder mask, legend, surface finish, process flow, etc.
- On save, a unique **Product Specification Card** is auto-generated.
  - Example: Product `ABC` → Product Specification Card No. `D001`

### 1.2 Customer Purchase Order (PO)
- Customer PO is entered into the ERP.
- The PO is linked to its corresponding Product Specification Card.
  - Example: PO No. `P001` linked to Product Specification Card `D001`

### 1.3 Job Card Generation
- Based on the order quantity, the ERP generates a **Production Job Card**.
  - Example: Order Qty `1000 Panels` → Job Card No. `JC001`
- For production movement and traceability, a Job Card can be split into multiple **sub-job cards**.
  - Example: `JC001-1`, `JC001-2`, … `JC001-10`

### 1.4 Process Flow & Stage Movement
- The full manufacturing process flow (e.g., 10 total stages) is selected while creating the Product Specification Card.
- Launching a Job Card into Stage-1 means the production job has started.
  - Example: Stage-1 processes 500 panels → `JC001-1` to `JC001-5` move to Stage-2; the rest continue at Stage-1 until processed.
- The same partial-movement logic repeats at every subsequent stage.

### 1.5 Process Tracking
For every Job Card movement, the ERP must record:
- Date & Time
- User Name
- Process Name
- Quantity Received
- Quantity Processed
- Quantity Forwarded
- Quantity Rejected
- Rejection Reason (if any)

This is what gives the system complete production traceability.

### 1.6 Production Reports
The ERP auto-generates daily production reports covering:
- Stage-wise production output
- Pending quantity at each process
- WIP (Work in Progress)
- Job launch status
- Lead time of every Job Card
- Process-wise productivity
- Rejection summary
- Dispatch status

### 1.7 QR Code / Barcode
- Every Job Card carries a unique QR Code/Barcode.
- Scannable from both desktop and mobile, for: job movement, production update, quantity confirmation, traceability.

### 1.8 Dispatch Notification
- When a Job Card / finished material is dispatched from the factory gate, the ERP auto-notifies the responsible person.
- Once the delivery partner confirms delivery, the ERP/mobile app updates: Delivery Status, Delivery Date & Time, Delivery Confirmation Photo, Delivered By.
- A notification is also sent confirming successful delivery.

### 1.9 User Management
- One Master/Admin user.
- Separate users per production process, department-wise, role-based access.
- Minimum 20 internal user accounts to start.
- Each user only accesses functions relevant to their assigned process.

### 1.10 Customer Portal
- Dedicated login per customer, restricted to their own products/orders.
- Customers can view: Production Status, Job Progress, Traceability, Current Manufacturing Stage, Pending Quantity, Estimated Delivery Date (EDD), Dispatch Status.
- No customer can see another customer's data.

---

## 2. Module Overview (Merged)

| # | Module | Test Case Prefix | Total Cases (incl. new) |
|---|---|---|---|
| 1 | Product Master / Spec Card | TC-PM | 13 |
| 2 | Customer Purchase Order | TC-PO | 12 |
| 3 | Job Card Generation & Sub-Job Cards | TC-JC | 12 |
| 4 | Stage Movement Engine (core logic) | TC-SM | 15 |
| 5 | Traceability & History | TC-TR | 6 |
| 6 | QR Code / Barcode Scanning | TC-QR | 7 |
| 7 | Production Reports | TC-RP | 8 |
| 8 | Dispatch & Delivery | TC-DS | 7 |
| 9 | User Management & RBAC | TC-UM | 9 |
| 10 | Customer Portal | TC-CP | 7 |
| 11 | Non-Functional / Cross-Cutting | TC-NF | 7 |
| | **Total** | | **103** |

---

## 3. Legend

- **Priority:** P1 = blocks release · P2 = important, not blocking · P3 = edge case / nice-to-verify.
- **🆕** = added while merging the two source documents (either it existed in only one, or it's a genuine gap found by comparing both).
- **⚠** = flagged as an open item — behavior needs a decision before this test can be finalized (see Section 6).

---

## 4. Test Cases by Module

### 4.1 Module: Product Master / Product Specification Card

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-PM-01 | Create product with valid data | Fill all required fields (PCB size, layer, thickness, copper, solder mask, legend, surface finish, process flow), save | Product saved, unique Spec Card No. (e.g., D001) auto-generated | P1 |
| TC-PM-02 | Create product with missing required field | Omit a mandatory field (e.g., PCB size), try save | Validation error shown, save blocked | P1 |
| TC-PM-03 | Process Flow builder — add stages in order | Select stages, sequence 1-N, save | Process flow rows created with correct sequence number, linked to the Spec Card | P1 |
| TC-PM-04 | Process Flow — duplicate stage in same flow | Try adding the same stage twice to one product | Blocked with a clear error | P2 |
| TC-PM-05 | Process Flow — non-contiguous sequence | Try saving sequence 1, 2, 4 (skip 3) | Validation error — sequence must be contiguous | P2 |
| TC-PM-06 | Edit existing product | Change surface finish, save | Update persisted, `updated_at` changes | P1 |
| TC-PM-07 | Deactivate product with active POs | Deactivate a product currently linked to an open PO | Warn user before deactivating, or block — confirm expected behavior with client ⚠ | P2 |
| TC-PM-08 | Non-Admin attempts product creation | Log in as a process-level user, try to create a product via UI or API | 403 Forbidden | P1 |
| TC-PM-09 | Spec Card No. uniqueness | Attempt to force-create a duplicate spec card no. | Rejected — unique constraint holds | P2 |
| TC-PM-10 🆕 | Product Code uniqueness | Create a product with code "ABC"; attempt to create another with the same code | Duplicate product code blocked with a clear error message (distinct from Spec Card No. uniqueness in TC-PM-09) | P2 |
| TC-PM-11 🆕 | Spec Card numbering is sequential & gapless | Create 3 products consecutively, note the generated numbers | Numbers are unique and follow the defined pattern with no gaps (e.g., D001, D002, D003) | P3 |
| TC-PM-12 🆕 | View / print / export Spec Card | Open a saved Spec Card, click Print/Export | A formatted card with all specs and process flow is generated as a PDF/print-ready output | P3 |
| TC-PM-13 🆕 | Edit retains audit/version history | Edit surface finish, save | Old value, new value, editing user, and timestamp are retained in a change history/audit log | P2 |

---

### 4.2 Module: Customer Purchase Order (PO)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-PO-01 | Create PO with valid data | Select customer + product, enter qty, save | PO saved, status = OPEN | P1 |
| TC-PO-02 | Duplicate PO number | Create PO with an already-used PO No. | Rejected with a clear error message | P1 |
| TC-PO-03 | Order qty ≤ 0 | Enter qty = 0 or negative | Validation error, save blocked | P1 |
| TC-PO-04 | Link PO to inactive product | Try linking PO to a deactivated product | Blocked or warned (confirm expected UX) ⚠ | P2 |
| TC-PO-05 | Non-Admin attempts PO creation | Log in as a process-level user, try to create a PO | 403 Forbidden | P1 |
| TC-PO-06 | Customer views own PO | Log in as Customer, view their orders | Only their own POs returned | P1 |
| TC-PO-07 | Customer attempts to view another customer's PO by ID | Guess/edit another customer's PO id in the URL | Not Found (should not reveal existence with a 403) | P1 |
| TC-PO-08 🆕 | Block PO save without linking a Spec Card | Fill PO details but skip linking a Product Specification Card, save | System blocks save and prompts the user to select a valid Spec Card | P1 |
| TC-PO-09 🆕 | Link PO to a non-existent / inactive Spec Card | Search for a deleted or inactive card number, attempt to link | Linking blocked; error shown that the card is invalid/inactive | P2 |
| TC-PO-10 🆕 | PO quantity correctly flows into Job Card generation | Save PO with qty 1000, proceed to generate Job Card | Order quantity (1000) is correctly available/prefilled at Job Card generation | P1 |
| TC-PO-11 🆕 | Edit PO quantity after Job Card already generated | Open a PO that already has a Job Card generated, change the order quantity, save | System either restricts the change or generates an amendment/revision log — existing Job Card must not be silently altered ⚠ | P2 |
| TC-PO-12 🆕 | Search and filter PO list | Filter PO list by customer, date range, and status | List correctly filters and shows only matching records | P3 |

---

### 4.3 Module: Job Card Generation & Sub-Job Cards

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-JC-01 | Generate Job Card from PO | Confirm PO for production | Job Card created, status = NOT_LAUNCHED, total qty matches PO qty | P1 |
| TC-JC-02 | Split into equal parts | Split a 1000-qty Job Card into 10×100 | 10 sub-job-cards created, numbered JC00X-1 to -10, each qty = 100 | P1 |
| TC-JC-03 | Split with unequal parts | Split 1000 into custom amounts (e.g., 300/300/400) | Splits accepted if the sum equals the total | P1 |
| TC-JC-04 | Split sum mismatch | Attempt a split where the sum ≠ total qty (e.g., sums to 950) | Error shown, split blocked | P1 |
| TC-JC-05 | Split with zero/negative qty in one part | One split entry = 0 | Validation error on that entry | P2 |
| TC-JC-06 | Launch Job Card | Click Launch after splitting | All sub-job-cards move to Stage-1, launch timestamp set, status = IN_PROGRESS | P1 |
| TC-JC-07 | Launch without splitting first | Launch a Job Card that was never split | Treated as one sub-job-card at full quantity, moves to Stage-1 | P2 |
| TC-JC-08 | QR generation on split | After split, check each sub-job-card | Each has a unique, scannable QR code | P1 |
| TC-JC-09 | Attempt to split an already-launched Job Card | Try to split after status = IN_PROGRESS | Blocked — splitting only allowed pre-launch (clarify if mid-process re-splitting is ever needed) ⚠ | P2 |
| TC-JC-10 🆕 | Prevent over-allocation across multiple partial splits | Split 600 of 1000 into sub-cards first, then attempt to allocate 500 more (only 400 remain unallocated) | Blocked — system tracks unallocated remainder and shows an appropriate error | P2 |
| TC-JC-11 🆕 | View Job Card parent-child hierarchy | Open a Job Card, view the "Sub-Job Cards" tab | All linked sub-job-cards are visible with their individual status and quantity | P3 |
| TC-JC-12 🆕 | Job Card / Sub-Job Card number uniqueness across the system | Generate Job Cards for several different POs | Every Job Card / sub-job-card number is globally unique, no duplication | P2 |

---

### 4.4 Module: Stage Movement Engine (Highest Priority — Core Logic)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-SM-01 | Full quantity forward, no rejection | Sub-job-card qty = 500 at Stage-1, submit processed = 500, forwarded = 500, rejected = 0 | Sub-job-card fully advances to Stage-2, movement log entry written | P1 |
| TC-SM-02 | Partial quantity forward | Same sub-job-card, submit processed = 500, forwarded = 300, rejected = 0 | New sub-job-card created for 300 qty at Stage-2; original record retains 200 qty at Stage-1 | P1 |
| TC-SM-03 | Partial forward + partial rejection | processed = 500, forwarded = 400, rejected = 100, reason provided | 400 qty forwards, 100 marked rejected (does not forward); `forwarded + rejected ≤ processed` holds | P1 |
| TC-SM-04 | Rejection without reason | rejected = 50, rejection_reason = null | Validation error — reason required when rejected > 0 | P1 |
| TC-SM-05 | Over-processing attempt | Sub-job-card has 500 remaining at stage, submit processed = 600 | Error — cannot process more than received/remaining | P1 |
| TC-SM-06 | Forwarded + rejected exceeds processed | processed = 500, forwarded = 400, rejected = 200 (sums to 600) | Error — constraint violation caught before save | P1 |
| TC-SM-07 | Stage mismatch — wrong operator | A user assigned to "Plating" tries to update a job at "Drilling" | Blocked with a stage-mismatch error | P1 |
| TC-SM-08 | Last stage completion | Sub-job-card completes the final stage in its product's flow, full qty forwarded | Sub-job-card status = COMPLETED; when all siblings complete, parent Job Card status = COMPLETED | P1 |
| TC-SM-09 | Admin override on non-own stage | Admin logs a stage update for any stage | Allowed; audit log entry created marking it as an override | P2 |
| TC-SM-10 | Duplicate offline submission (idempotency) | Submit the same request twice (simulating a mobile retry) | Second submission is rejected as a duplicate; no duplicate log row created | P1 |
| TC-SM-11 | Concurrent updates on same sub-job-card | Two requests submitted near-simultaneously for the same sub-job-card | No data corruption — verify locking/transaction handling (define expected behavior with dev team) ⚠ | P2 |
| TC-SM-12 | Multi-stage product with variable length | Product A (10 stages) and Product B (5 stages) both in production | Each follows its own process flow correctly, no cross-contamination | P1 |
| TC-SM-13 🆕 | Prevent skipping a process stage | Attempt to move a Job Card directly from Stage-1 to Stage-3, bypassing Stage-2 | Blocked — the process flow defined on the Spec Card must be followed sequentially | P1 |
| TC-SM-14 🆕 | Rework/reprocess rejected quantity at the same stage | Select rejected quantity at a stage, mark for rework, reprocess at the same stage | Reworked quantity is tracked separately with a rework flag; quantity updates correctly after rework completes ⚠ | P2 |
| TC-SM-15 🆕 | Quantity-balance equation enforced on every submission | Enter Qty Received = 100, Qty Processed = 70, Qty Rejected = 10; submit with totals that don't reconcile | System validates `Received = Processed + Rejected + Pending` and blocks save on mismatch (distinct from the forwarded/rejected ≤ processed check in TC-SM-06) | P1 |

---

### 4.5 Module: Traceability & History

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-TR-01 | View full history (Admin) | Open a sub-job-card's history after several stage moves | All movements shown chronologically with user, qty, timestamp | P1 |
| TC-TR-02 | Process-level user views history | Log in as a process user, view the same sub-job-card | Only entries for their own assigned stage are shown | P1 |
| TC-TR-03 | Customer views simplified traceability | Log in as Customer, view own order's traceability | Stage names + timestamps shown, no internal user names/IDs | P1 |
| TC-TR-04 | Movement log immutability | Attempt to edit or delete a movement log row directly | Rejected — no update/delete path exists | P1 |
| TC-TR-05 🆕 | Logged-in user auto-captured on every movement | Log in as User A, perform a stage update | "User A" is auto-captured as the operator; the field is read-only and cannot be manually edited | P2 |
| TC-TR-06 🆕 | Support multiple rejection reasons within a single stage entry | At one stage, in the same submission reject 15 panels for "Copper Etching Defect" and 5 for "Drill Miss" | System stores multiple rejection reasons with their corresponding split quantities against that single movement entry ⚠ | P2 |

---

### 4.6 Module: QR Code / Scanning

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-QR-01 | Scan valid QR (own stage) | User scans a sub-job-card QR at their assigned stage | Stage update form opens, pre-filled with the correct remaining quantity | P1 |
| TC-QR-02 | Scan valid QR (wrong stage) | User scans a sub-job-card currently at a different stage | Error shown: "This job is not at your stage" | P1 |
| TC-QR-03 | Scan invalid/unrecognized QR | Scan a random/garbage QR code | Clear error, no crash | P2 |
| TC-QR-04 | Scan on low-end Android device | Test scan speed/accuracy on an older/budget device | Scan completes within an acceptable time (define threshold, e.g., <2s) | P2 |
| TC-QR-05 | Offline scan submission | Turn off network, submit a stage update via scan | Update queued locally as "pending sync"; syncs automatically once online | P1 |
| TC-QR-06 🆕 | QR scan for quantity confirmation at dispatch gate | At the dispatch gate, scan the QR of a finished Job Card, confirm quantity | System matches scanned quantity against expected dispatch quantity and flags a mismatch if any | P2 |
| TC-QR-07 🆕 | Scan a duplicated QR code | Scan a QR code value that exists more than once in the system | Clear error shown, no ambiguous match, no crash | P3 |

---

### 4.7 Module: Reports

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-RP-01 | Stage-wise output report | Generate report for a date range with known movement data | Numbers match manual sum of movement logs for that range | P1 |
| TC-RP-02 | WIP report accuracy | Compare WIP report total to the sum of all in-stage sub-job-card quantities | Matches | P1 |
| TC-RP-03 | Rejection summary grouping | Log rejections with different reasons across stages, generate report | Correctly grouped by stage and reason | P1 |
| TC-RP-04 | Lead time calculation | Job Card launched and completed on known dates | Reported lead time = completion date − launch date | P1 |
| TC-RP-05 | Report export (PDF) | Export any report as PDF | File downloads, data matches the on-screen table | P2 |
| TC-RP-06 | Report export (Excel) | Export any report as Excel | File downloads, opens correctly, data matches | P2 |
| TC-RP-07 | Non-Admin/PM attempts report access | Process or Dispatch user calls the reports endpoint | 403 Forbidden | P1 |
| TC-RP-08 | Daily snapshot job / scheduled auto-generation runs correctly | Trigger the nightly aggregation job manually (or wait for the scheduled run, e.g., 8 PM), inspect the stored snapshot | Correct pre-aggregated values written/emailed automatically without manual trigger | P2 |

---

### 4.8 Module: Dispatch & Delivery

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-DS-01 | Create dispatch record | Mark a completed Job Card as dispatched at the gate | Dispatch record created, notification triggered to the responsible person | P1 |
| TC-DS-02 | Confirm delivery with photo | Upload delivery photo + details | Delivery status = DELIVERED, photo stored, delivered timestamp set | P1 |
| TC-DS-03 | Confirm delivery without photo | Try submitting without the required photo | Validation error (confirm if photo is mandatory with the client) ⚠ | P2 |
| TC-DS-04 | Delivery notification sent | Confirm delivery | Notification sent to both the responsible internal person and, per spec, the customer | P1 |
| TC-DS-05 | Dispatch user views only own dispatches | Log in as a Dispatch-role user, view dispatch list | Only their own created records shown, not company-wide | P1 |
| TC-DS-06 | Admin views all dispatches | Log in as Admin, view dispatch list | All records visible, filterable | P1 |
| TC-DS-07 🆕 | Capture and display "Delivered By" | During delivery confirmation, enter/select the delivery person's name | Field correctly saved and displayed in the Job Card's dispatch/delivery history | P3 |

---

### 4.9 Module: User Management & RBAC

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-UM-01 | Create new user with role | Admin creates a process-level user, assigns a stage | User created, credentials issued, stage assignment saved | P1 |
| TC-UM-02 | Deactivate user | Deactivate an active user | User can no longer log in | P1 |
| TC-UM-03 | Deactivated user's existing session | Deactivate a user with an active session, then make a request with the old session/token | Request rejected — session invalidated, not just blocked at login | P1 |
| TC-UM-04 | Non-Admin attempts user management | A non-admin tries to create/edit users | 403 Forbidden | P1 |
| TC-UM-05 | Audit log entry on user creation | Create a user, check the audit log | Entry logged with actor, action, timestamp | P2 |
| TC-UM-06 | Role change reflected immediately | Change a user's role while they're logged in | New permissions apply on the next request (or require re-login — confirm expected behavior) ⚠ | P2 |
| TC-UM-07 🆕 | Module/menu visibility restricted to assigned process | Log in as a single-process user (e.g., Drilling) | Only Drilling-related functions are visible; unrelated modules (e.g., Dispatch) are not shown at all, not just access-blocked | P2 |
| TC-UM-08 🆕 | Password policy & login lockout | Attempt to create a user with a weak password; attempt login with wrong credentials multiple times | Weak password rejected per policy; account locks/warns after repeated failed attempts | P2 |
| TC-UM-09 🆕 | Admin has unrestricted access across all modules | Log in as Master/Admin, navigate PO, Job Card, Reports, Dispatch, User Management | Full access with no restriction anywhere | P2 |

---

### 4.10 Module: Customer Portal

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-CP-01 | Customer login | Valid customer credentials | Logs in, sees only their own dashboard | P1 |
| TC-CP-02 | Customer sees correct order progress | Compare portal's stage display to the internal Admin view for the same order | Matches, reflects the true current stage | P1 |
| TC-CP-03 | Data isolation — cross-customer access attempt | Customer A tries every plausible way to view Customer B's data (URL edit, API call with a different id) | Always blocked, across all portal endpoints | P1 |
| TC-CP-04 | EDD displayed correctly | Check Estimated Delivery Date shown vs. the PO's expected delivery date | Matches | P2 |
| TC-CP-05 | Portal shows no internal jargon/user names | Review all portal screens/API responses | No internal sub-job-card codes, internal user names, or internal stage codes leaked | P2 |
| TC-CP-06 🆕 | Customer portal session timeout & re-authentication | Remain idle beyond the session timeout, then attempt an action | Session expires automatically; user is redirected to login and must re-authenticate | P3 |
| TC-CP-07 🆕 | Dispatch Status visible and accurate on portal | Dispatch a Job Card in the ERP, check the same order on the customer portal | Portal reflects Dispatched/In-Transit/Delivered status in near real-time, matching the ERP | P2 |

---

### 4.11 Non-Functional / Cross-Cutting Tests

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-NF-01 | Mobile responsiveness | Load the Admin dashboard on tablet-width and phone-width screens | Layout adapts appropriately | P2 |
| TC-NF-02 | Keyboard focus visibility | Tab through forms without a mouse | Focus states clearly visible | P3 |
| TC-NF-03 | Reduced motion respected | Enable "prefers-reduced-motion" OS setting, use the app | Animations become instant, no motion | P3 |
| TC-NF-04 | Color-blind safe status indicators | Check rejection/pending/complete indicators | Icon/label present alongside color, not color-only | P2 |
| TC-NF-05 | Load test — concurrent stage updates | Simulate 20 users submitting stage updates simultaneously (shift-change scenario) | System responds within acceptable time, no data loss/corruption | P1 |
| TC-NF-06 | Large dataset report performance | Generate reports with 6+ months of movement log data | Report loads within an acceptable time (define SLA, e.g., <5s) | P2 |
| TC-NF-07 | Session expiry handling | Let a session expire mid-use, attempt an action | Graceful redirect to login with a clear message, no silent failure | P2 |

---

## 5. Regression Suite (Run Before Every Release)

Minimum P1 set to re-run before any production deployment:

```
TC-PM-01, TC-PM-08
TC-PO-01, TC-PO-02, TC-PO-07, TC-PO-08, TC-PO-10
TC-JC-01 through TC-JC-06, TC-JC-08
TC-SM-01 through TC-SM-10, TC-SM-12, TC-SM-13, TC-SM-15
TC-TR-01, TC-TR-02, TC-TR-03, TC-TR-04
TC-QR-01, TC-QR-02, TC-QR-05
TC-RP-01, TC-RP-02, TC-RP-03, TC-RP-04, TC-RP-07
TC-DS-01, TC-DS-02, TC-DS-04, TC-DS-05, TC-DS-06
TC-UM-01, TC-UM-02, TC-UM-03, TC-UM-04
TC-CP-01, TC-CP-02, TC-CP-03
TC-NF-05
```

---

## 6. Open Items / Decisions Needed Before Final Sign-off

These behaviors are ambiguous or undecided in the source material. Antigravity should flag these to the client/product owner rather than assuming a default — a wrong assumption here touches the core data model.

1. **TC-PM-07, TC-PO-04:** What happens when deactivating a product / linking a PO that's tied to active records — warn, or hard-block? Needs client confirmation.
2. **TC-JC-09:** Whether mid-process re-splitting of an already-launched Job Card should ever be allowed.
3. **TC-SM-11:** Concurrency strategy — pessimistic locking vs. optimistic concurrency — to be decided by the dev team.
4. **TC-DS-03:** Whether the delivery confirmation photo is strictly mandatory.
5. **TC-PO-11:** Whether editing PO quantity after Job Card generation should be blocked outright or logged as a formal amendment.
6. **TC-SM-14 (🆕):** Whether rework/reprocessing of rejected quantity at the same stage is in scope for Phase 1 at all, and if so, how it's represented in the data model (a flag on the existing movement vs. a new movement type).
7. **TC-TR-06 (🆕):** Whether a single stage movement record needs to support multiple rejection reasons with split quantities, or whether one reason per movement (the current assumption elsewhere in this doc) is sufficient for Phase 1.
8. **TC-UM-06:** Whether a role change takes effect on the user's very next request, or requires them to log out and back in.

---

## 7. Next Steps

1. Import this table into a tracker (TestRail, Jira/Xray, or a shared spreadsheet) with Not Run / Pass / Fail / Blocked status columns.
2. Resolve the Section 6 open items before finalizing exact expected results for those specific cases.
3. Build and automate the P1 **Stage Movement Engine** (§4.4) first — this is the core logic, touched most often during development, and regressions here are the costliest to catch late.
4. Run each module's full test group as it's completed, not just at the end — then re-run the full P1 regression set (§5) before UAT.
