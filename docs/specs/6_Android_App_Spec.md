# Android App — Build Spec (Phase 6, Final)

> Prerequisite: Phases 1-4 (Launch, Movement, Barcode, User Rights) must be stable on the web/desktop ERP first, with working backend APIs. This phase is about exposing the SAME functionality on Android — do not build new logic here, just a mobile client for the existing APIs.

## Scope for Android App (v1)

Only these features — nothing extra:
1. Login (username/password), respecting the same role/stage permissions as Phase 4.
2. **View assigned jobs**: Normal User sees only their assigned stage(s); Master/Super User sees all.
3. **View current job status**: same data as the Job Update page (stage, qty, area, target date, delay status).
4. **Job Card View**: view the uploaded photo + job details.
5. **Full Job Movement**: same confirmation + remark flow as web.
6. **Uncompleted Job Movement**: same partial-qty entry as web.
7. **Barcode scanning**: use the device camera to scan and jump directly to a job (same as Phase 3 logic).
8. **Remarks entry**: same remark + remark_type fields as web.
9. Stage-wise access control enforced by hitting the SAME backend APIs from Phase 4 (server already blocks unauthorized moves — app just needs to handle 403 responses gracefully with a clear message).

## Explicitly OUT of scope for v1

- No offline mode.
- No push notifications.
- No admin/user-management screens (that stays web-only, Master ID use).
- No daily report screen on mobile for v1 (can be added later if client wants it).

## Technical Approach

- Build as a thin client calling the existing REST APIs used by the web ERP — do not duplicate business logic in the app.
- Simple bottom navigation: Home (Job List) → Job Detail (View/Full/Partial) → Scan (camera).
- Keep screens minimal — this is for shop-floor workers, so large buttons, minimal text entry, clear stage labels.

## Acceptance Test

1. Login as a Normal User assigned to PLATING → app shows only PLATING jobs.
2. Scan a barcode for a PLATING job → opens job detail with movement options.
3. Full/Partial movement from the app updates the same database the web ERP reads from (verify by checking Job Update page on web reflects the change immediately).
4. Attempting (via a modified/rooted request) to move a job from an unassigned stage is rejected by the backend, and the app shows a clear "Not authorized for this stage" message.
