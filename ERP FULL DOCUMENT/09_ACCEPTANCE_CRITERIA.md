# 09_ACCEPTANCE_CRITERIA.md — PCB Manufacturing ERP

> Each item below is testable. "Done" for any feature means every acceptance
> criterion under it passes — not "code is written." Use these directly as QA
> test cases and as the Definition of Done for each user story.

---

## Module 1 — Product Master

**AC-1.1** Given a user with product-creation permission, when they fill all
required spec fields (PCB size, layers, thickness, copper, solder mask, legend,
surface finish) and select a Process Flow, then the Product Master saves
successfully and a **unique, sequential Product Specification Card No.**
(D001, D002...) is generated and displayed.

**AC-1.2** Given a Product Master already has Spec Card No. D001, when a second
product is created, then it must receive D002 — never a reused or duplicate
number, even after deletions.

**AC-1.3** Given a user tries to save a Product Master without selecting a
Process Flow, then the system blocks save with a clear validation error (a
product cannot exist without a defined process flow).

**AC-1.4** Given a Product Master is already linked to an active PO/Job Card,
when a user tries to delete it, then the system blocks deletion (soft-delete/
archive only, to preserve historical traceability).

---

## Module 2 — Customer PO

**AC-2.1** Given a valid Product Specification Card exists, when a user creates
a PO and links it to that card, then the PO saves with an auto-generated PO No.
(or accepts a manually entered customer PO No., per client decision) and shows
the linked Product Spec Card details.

**AC-2.2** Given a user attempts to create a PO without linking a Product Spec
Card, then the system blocks save.

**AC-2.3** Given a PO exists, when viewed, then it clearly displays the linked
product, order quantity (panels), and order/required delivery dates.

---

## Module 3 — Job Card & Sub-Job Card

**AC-3.1** Given a saved PO with order quantity, when a user generates a Job
Card from it, then the system creates a Job Card with a unique sequential
number (JC001...) and total quantity matching the PO quantity exactly.

**AC-3.2** Given a Job Card JC001 with 1000 panels, when a user splits it into
10 sub-cards, then the system creates JC001-1 through JC001-10, and the **sum
of all sub-card quantities always equals the parent's total quantity** — the
system must reject any split where quantities don't reconcile.

**AC-3.3** Given a Job Card has already been split, when a user attempts to
further split an individual sub-job card, then the system allows it (nested
split) and continues to enforce quantity reconciliation at every level.

**AC-3.4** Given any Job/Sub-Job Card, at any time, then the system can show
its full current state: current stage(s), quantity at each stage, quantity
completed, quantity rejected — numbers must always sum correctly to the total.

---

## Module 4 — Process Flow Engine & Stage Movement

**AC-4.1** Given a Job/Sub-Job Card is newly generated, when it is "launched,"
then it enters Stage-1 of its product's defined Process Flow and a movement
log entry is created with Qty Received = full quantity, Qty Processed = 0.

**AC-4.2** Given a Sub-Job Card is at Stage-N with quantity Q, when a user
records that P quantity is processed and forwarded and R quantity is rejected
(P + R ≤ Q), then:
  - A movement log entry is created for Stage-N (Qty Received=Q, Qty
    Processed=P+R, Qty Forwarded=P, Qty Rejected=R).
  - If R > 0, a Rejection Reason is mandatory — system blocks save without it.
  - The system either creates a new Sub-Job Card for the forwarded quantity P
    at Stage-N+1, or updates the existing card's stage — behavior must be
    consistent and documented (confirm approach during design).
  - The remaining (Q − P − R) stays at Stage-N as pending quantity.

**AC-4.3** Given a Sub-Job Card completes the final stage in its process flow,
then its status automatically updates to "Completed" / "Ready for Dispatch."

**AC-4.4** Given any two quantities are entered that don't reconcile (e.g.
Processed + Forwarded ≠ what's claimed, or Forwarded+Rejected > Received),
then the system blocks the entry with a clear validation message — quantity
integrity is never allowed to break.

**AC-4.5** Given a movement log entry has been saved, then it can **never be
edited or deleted** through the UI — corrections require an explicit new
offsetting/correction entry, preserving full audit history.

---

## Module 5 — Process Tracking / Traceability

**AC-5.1** Given any Job Card or Sub-Job Card, when a user views its
traceability history, then every stage movement is listed chronologically with
Date/Time, User, Process Name, Qty Received/Processed/Forwarded/Rejected, and
Rejection Reason (if any).

**AC-5.2** Given a QR code is scanned for a Job/Sub-Job Card, then the system
retrieves and displays its complete traceability history within [target: 2
seconds] on both desktop and mobile.

---

## Module 6 — Production Reports

**AC-6.1** Given production activity happened on a given day, when the daily
report is generated (automatically, e.g. via scheduled job), then it includes:
stage-wise output, pending qty per process, WIP, job launch status, lead time
per job card, process-wise productivity, rejection summary, dispatch status —
all matching the underlying movement log data exactly (report totals must
reconcile with raw logs).

**AC-6.2** Given a user requests a report for a custom date range, then the
system generates it on demand, not only via the daily scheduled version.

**AC-6.3** Given rejection data exists across multiple stages, when viewing
the Rejection Summary, then it is filterable/groupable by stage and by
rejection reason.

---

## Module 7 — QR Code / Barcode

**AC-7.1** Given a Job Card or Sub-Job Card is created, then a unique QR code
is auto-generated and can be printed/displayed immediately.

**AC-7.2** Given a QR code is scanned on a desktop (webcam/USB scanner) or a
mobile device, then the correct Job/Sub-Job Card record opens with options to:
record movement, confirm quantity, or view traceability — with identical data
and behavior on both platforms.

**AC-7.3** Given an invalid/unrecognized QR code is scanned, then the system
shows a clear error rather than failing silently or opening the wrong record.

---

## Module 8 — Dispatch & Delivery

**AC-8.1** Given a Job Card's material physically leaves the factory gate and
a user marks it "Dispatched," then the system immediately sends a notification
to the responsible person(s) (channel per client decision).

**AC-8.2** Given a dispatched Job Card, when the delivery partner marks it
delivered via mobile app (with Delivery Status, Date/Time, Photo, Delivered
By), then the ERP updates the record and **a confirmation notification is
sent**.

**AC-8.3** Given a delivery confirmation photo is required, then the system
blocks marking "Delivered" without an attached photo.

**AC-8.4** Given a Job Card has not yet been dispatched, then it must not be
markable as "Delivered" (state-machine order enforced: Launched → In-Process →
Completed → Dispatched → Delivered).

---

## Module 9 — User Management

**AC-9.1** Given the system is freshly set up, then exactly one Master/Admin
account exists initially, with full access to all modules.

**AC-9.2** Given an Admin creates a new user and assigns them to a specific
process/department, then that user can log in and see/act **only** on their
assigned process's job cards and functions — attempting to access another
process's data (via UI or direct API call) is blocked.

**AC-9.3** Given the system supports at least 20 concurrent internal user
accounts at launch, then performance and access control both hold correctly
at that scale (load-tested).

**AC-9.4** Given a user account is deactivated by Admin, then that user can no
longer log in, but their historical movement log entries remain intact and
attributed to them (never deleted).

---

## Module 10 — Customer Portal

**AC-10.1** Given a customer logs into the portal, then they see only POs and
Job Cards linked to their own customer account — verified by both UI testing
and direct API/URL manipulation testing (IDOR test: attempt to access another
customer's Job Card ID directly — must be blocked with 403/404).

**AC-10.2** Given a customer views a Job Card, then they see: Production
Status, Job Progress, Traceability, Current Manufacturing Stage, Pending
Quantity, Estimated Delivery Date, Dispatch Status — but not internal-only
data (e.g., internal user names, internal rejection notes meant for staff
only, unless client wants those visible — confirm).

**AC-10.3** Given a Job Card's stage updates on the shop floor, then the
customer portal reflects the updated status within [target: a few minutes],
not next-day.

---

## Cross-Cutting Acceptance Criteria (apply to all modules)

**AC-X.1** Every create/update/delete action is attributable to a logged-in
user with a timestamp (audit trail).

**AC-X.2** All auto-generated numbers (Spec Card, PO, Job Card, Sub-Job Card)
are strictly sequential and unique — no duplicates, no gaps due to failed
transactions (use DB-level sequences/transactions, not application-level
counters that can race).

**AC-X.3** All quantity fields across the system reconcile at all times —
this is validated both at data-entry time and via a periodic consistency
check/report.

**AC-X.4** The system is usable on both desktop browsers and mobile devices
for all shop-floor-facing functions (Job movement, QR scan, quantity entry).

**AC-X.5** No module is considered "done" until its acceptance criteria pass
in a staging environment with realistic data volume (min. 20 users, multiple
concurrent job cards, multi-stage flows).
