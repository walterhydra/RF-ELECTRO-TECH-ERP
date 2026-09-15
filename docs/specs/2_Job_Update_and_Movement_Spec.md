# Job Update / Job Movement — Build Spec (Phase 2)

> Prerequisite: Phase 1 (Job Card Launch) must already be working — jobs exist in `job_cards` table with a `current_stage`.
> Scope: Build ONLY the Job Update page + the three actions (Job Card View, Full Movement, Uncompleted Movement). No barcode, no user rights, no reports yet — those are separate phases.

## Page: "Job Update" (a.k.a. Job Movement dashboard)

Shows a table/list of all **active** jobs (jobs not yet at PACKING/completed). Columns:

| Column | Source |
|---|---|
| Job Card No. | job_cards.job_card_no |
| Customer Part No. | job_cards.customer_part_no |
| Customer Code | job_cards.customer_code |
| Quantity (PNL) | current remaining qty at this stage |
| Area (Sqm) | current remaining area at this stage |
| Target Date | job_cards.target_date |
| Priority | job_cards.priority |
| Current Stage | job_cards.current_stage |
| Delay Status | computed: if today > target_date → "OVERDUE" (red), else "ON TIME" (green) |

- Sortable/filterable by stage and priority if easy to add — not mandatory for v1.
- Must be responsive (works on desktop + Android browser).

## Clicking a Job Row → 3 Options

When a user taps/clicks a job, show 3 options:

### A. Job Card View
- Opens a read-only view showing the `job_card_photo_url` (full size) and the key job details (same fields as launch form).
- No editing allowed here.

### B. Full Job Movement
1. Show a confirmation dialog: **"Are you sure you want to move Job Card [Job Card No.] to the next process?"**
2. Show a **Remark** field (optional text, e.g. for rejection/rework/process issue notes).
3. On confirm:
   - Look up the next stage in the job's `job_flow` sequence (from `current_stage`).
   - Move the **entire remaining quantity** (PNL qty + Sqm area) to that next stage.
   - Update `job_cards.current_stage` to the new stage.
   - Log this movement (see Movement History table below) with full qty, remark, user, timestamp.
   - If current stage is the last stage (PACKING), mark job as completed instead of moving further.

### C. Uncompleted / Partial Job Movement
1. Show a form: input for **quantity to move** (must be ≤ remaining quantity at current stage) + Remark field.
2. On submit:
   - Split the job at this stage into two portions:
     - Moved portion (entered qty) → advances to next stage, carrying its own qty/area (calculate area proportionally or ask user for area too — recommend also asking "Area to move (Sqm)" explicitly to avoid rounding errors).
     - Remaining portion → stays at current stage with the balance qty/area.
   - Log this partial movement (see Movement History table).
   - The Job Update table should now show BOTH portions as separate rows (same Job Card No., different stage), OR show the job at its "primary" stage with remaining qty, and the moved portion appears at the next stage as a new line — pick whichever data model is simpler for you, but **totals must always add up correctly** (moved + remaining = original total at that stage).

## Suggested Data Model Addition

Since a job can now be split across stages, don't just use one `current_stage` field on `job_cards` — instead track **job splits/lots**:

### Table: `job_lots` (tracks quantity currently sitting at each stage)
| Column | Type |
|---|---|
| id | auto |
| job_card_id | FK to job_cards |
| current_stage | string |
| qty_pnl | int |
| area_sqm | decimal |
| created_at | timestamp |

- On Job Launch (Phase 1): create ONE row here with full qty at stage 1 (SHEARING).
- On Full Movement: update this row's `current_stage` to next stage (qty stays same).
- On Partial Movement: reduce this row's qty/area by moved amount, and INSERT a new row at the next stage with the moved qty/area.

### Table: `job_movements` (history log — needed for Phase 8 reporting)
| Column | Type |
|---|---|
| id | auto |
| job_card_id | FK |
| from_stage | string |
| to_stage | string |
| qty_moved | int |
| area_moved | decimal |
| movement_type | enum: FULL / PARTIAL |
| remark | text |
| moved_by_user_id | FK |
| moved_at | timestamp |

## Acceptance Test

1. Job Update page shows all active jobs with correct stage, qty, delay status.
2. Click a job → see 3 options (View / Full / Partial).
3. Full Movement moves 100% of qty to next stage, logs it, shows confirmation + remark saved.
4. Partial Movement (e.g. move 35 of 40) creates two lots: 35 at next stage, 5 remaining at current stage — both visible and correct.
5. Movement history table has a row for every movement made.
