# Job Card Launch — Build Spec (Phase 1 Only)

> Scope: Build ONLY this page. Do not build Job Update, Movement, Barcode, or Reports yet — those come in later phases.

## Page: "New Job Card Launch"

- This page shows exactly ONE button in the center/top: **"ADD NEW JOB CARD"**
- Clicking it opens a form (modal or new page — your choice, keep it simple).

## Form Fields (in this exact order)

| # | Field Name | Input Type | Required | Notes |
|---|-----------|-----------|----------|-------|
| 1 | Job Card Photo | File upload (image: jpg/png) | Yes | Preview thumbnail after upload |
| 2 | Job Card No. | Text | Yes | Must be unique, e.g. `26-27-1729` |
| 3 | Customer Part No. | Text | Yes | e.g. `EV-900W-WP-TO247-VORS-25082026` |
| 4 | R.F.E. Part Code | Text | Yes | e.g. `D3625` |
| 5 | Customer Code | Text | Yes | e.g. `CUST-RF045` |
| 6 | Target Date | Date picker | Yes | e.g. `08-Sep-26` |
| 7 | Priority | Dropdown | Yes | Options: `MOST URGENT`, `URGENT`, `NORMAL` |
| 8 | Total Production PNL Qty | Number | Yes | e.g. `40` |
| 9 | Total Customer PNL Qty | Number | Yes | e.g. `80` |
| 10 | Total PCB Qty | Number | Yes | e.g. `160` |
| 11 | Total Production PNL Area (Sqm) | Number (decimal) | Yes | e.g. `50` |
| 12 | Total Customer PNL Area (Sqm) | Number (decimal) | Yes | e.g. `45` |
| 13 | Job Flow Selection | Dropdown | Yes | Options: `PF-01` (add more flows later) |

## Job Flow Logic (critical — must be exact)

When user selects **PF-01** in "Job Flow Selection", the system must internally map this job to the following fixed 19-stage sequence (store as an ordered list, e.g. `stage_order` field):

```
1. SHEARING
2. DRILLING
3. DRL-QC
4. DML
5. PIT
6. PIT-QC
7. PLATING
8. ETCHING
9. PREMASK-QC/AOI
10. PISM
11. PISM-QC
12. HASL
13. HASL-QC
14. LEGEND PRINT
15. ROUTING & VG
16. BBT
17. FQC (AI)
18. PDI-AQL
19. PACKING
```

- This mapping should be stored as configurable data (a table: `job_flow_id`, `stage_order`, `stage_name`) — NOT hardcoded in the UI — so new flows (PF-02, etc.) can be added later without code changes.

## Submit Behavior

- Button label: **"LAUNCH JOB"**
- On click:
  1. Validate all required fields.
  2. Save the job record to the database with a `current_stage` field.
  3. Automatically set `current_stage = "SHEARING"` (the first stage of the selected Job Flow).
  4. Show a success message: "Job Card [Job Card No.] launched successfully."
  5. Redirect back to the "New Job Card Launch" page (ready to add another).

## Suggested Database Table: `job_cards`

| Column | Type |
|---|---|
| id | auto |
| job_card_no | string, unique |
| job_card_photo_url | string |
| customer_part_no | string |
| rfe_part_code | string |
| customer_code | string |
| target_date | date |
| priority | enum |
| total_production_pnl_qty | int |
| total_customer_pnl_qty | int |
| total_pcb_qty | int |
| total_production_pnl_area_sqm | decimal |
| total_customer_pnl_area_sqm | decimal |
| job_flow_id | foreign key |
| current_stage | string |
| created_at | timestamp |

## UI Requirements

- Clean, single-column form. No extra fields, no extra buttons.
- Mobile/tablet responsive (form should work fine on Android browser too — no need for a native app yet).
- Do NOT build Job Update page, Movement options, Barcode scanning, or Reports in this pass — only this launch form and its save logic.

## Acceptance Test (what "done" looks like)

1. Click "ADD NEW JOB CARD" → form opens.
2. Fill all fields, select Job Flow = PF-01, upload photo.
3. Click "LAUNCH JOB".
4. New record appears in database with `current_stage = SHEARING`.
5. Success message shown, form resets for next entry.
