# Daily Job Movement & WIP Report — Build Spec (Phase 5)

> Prerequisite: Phase 2's `job_movements` and `job_lots` tables must be populated correctly first — this report is purely a read/aggregation layer on top of that data.

## Report Page: "Daily Job Movement & WIP Report"

- Date filter (defaults to today).

### Section 1: Stage-Wise Job Status
Table with one row per stage, columns:
| Stage | Total Jobs at Stage | Total PNL Qty | Total Sqm | Current WIP Sqm |
|---|---|---|---|---|

- Computed by grouping `job_lots` (current, non-completed) by `current_stage`.

### Section 2: Delay Monitoring
Three counts/lists:
- **Overdue jobs**: jobs where `target_date` < today and not yet completed.
- **Over-delayed jobs**: overdue by more than X days (make X configurable, default e.g. 3 days).
- **Jobs exceeding target date**: same as overdue — list job_card_no, stage, days overdue.

### Section 3: Quality / Loss Monitoring (for the selected date)
- **Total Rework**: count/sum of movements on that date where `job_movements.remark` was tagged as Rework.
- **Total Rejection**: count/sum of movements on that date tagged as Rejection.
- To make this reliable, add a `remark_type` dropdown (enum: NONE / REWORK / REJECTION / PROCESS_ISSUE / OTHER) next to the free-text remark field in Phase 2's movement forms — don't rely on parsing free text.

## Data Model Addition

Update `job_movements` table (from Phase 2) to include:
| Column | Type |
|---|---|
| remark_type | enum: NONE / REWORK / REJECTION / PROCESS_ISSUE / OTHER |

## Acceptance Test

1. Report for today shows correct job count, qty, and Sqm per stage matching what's actually in `job_lots`.
2. A job with target_date in the past shows up under Overdue.
3. A movement marked "Rejection" today is correctly counted in Total Rejection for today's report.
4. Changing the date filter updates all three sections accordingly.
