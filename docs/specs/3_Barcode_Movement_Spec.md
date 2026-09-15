# Barcode-Based Job Movement — Build Spec (Phase 3)

> Prerequisite: Phase 2 (Job Update/Movement) must be working.
> Scope: Add a barcode scan entry point that jumps straight to the same 3 options (View / Full / Partial Movement) from Phase 2. Do not duplicate movement logic — just add a faster way to reach it.

## What the barcode contains

- Each Job Card has a barcode encoding its **Job Card No.** only (e.g. `26-27-1729`).
- Barcode generation: when a Job Card is launched (Phase 1), generate a barcode image (e.g. Code128) from `job_card_no` and store/display it (can be shown on the Job Card View screen and optionally printed).

## Scan Flow

1. Add a **"Scan Barcode"** button on the Job Update page (and prominently on the Android app home screen).
2. Clicking it opens the device camera (use a standard web barcode-scanning library for desktop/browser, and native camera API for Android).
3. On successful scan:
   - Extract the Job Card No. from the barcode.
   - Look up the job in `job_cards` / `job_lots`.
   - If found: open the same job detail screen used in Phase 2, showing Job Card View / Full Movement / Uncompleted Movement options.
   - If not found: show a clear error — "No job found for scanned code: [code]".
4. If a job currently has multiple lots at different stages (from partial movements), and the scanned Job Card No. matches more than one active lot, show a small picker: "This job has multiple active lots — select which one to move" (list by current stage + qty).

## Manual fallback

- Keep the existing manual entry (typing Job Card No. or clicking from the list) as-is — barcode is an additional, faster path, not a replacement.

## Acceptance Test

1. Scan a valid barcode → correct job opens with the 3 movement options.
2. Scan an invalid/unknown code → clear error shown, no crash.
3. Manual selection from Job Update list still works exactly as before.
