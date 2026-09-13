# Stage-Wise User Rights / Access Control — Build Spec (Phase 4)

> Prerequisite: Phases 1-3 working. This phase secures them.
> Critical requirement: Access control MUST be enforced at backend/API/database level — NOT just by hiding UI buttons. Even a direct API call or URL edit by an unauthorized user must be blocked server-side.

## User Levels

### 1. Master ID
Full access to everything:
- Launch jobs, view all jobs at every stage, move jobs from any stage (Full + Partial), view Job Card Photo, barcode movement, delete Job Cards, all reports, manage users, manage stage/job-flow config, manage system settings.

### 2. Super User
Same as Master for day-to-day production, EXCEPT:
- Cannot delete Job Cards.
- Cannot change Master/system configuration.
- Cannot create/modify Master-level settings.
- Can still: launch jobs, view all jobs, move jobs from ANY stage, view reports.

### 3. Normal User
Restricted to their **assigned stage(s)** only:
- Can view jobs only at their assigned stage(s).
- Can move jobs only from their assigned stage(s) — Full + Partial movement, Job Card View, barcode movement, remarks.
- Cannot: launch new jobs, delete jobs, change job flow, change user rights, access system config.
- Example: a user assigned to PLATING can move PLATING → next stage, but cannot touch DRILLING → DRL-QC even via API/URL manipulation.

## Data Model

### Table: `users`
| Column | Type |
|---|---|
| id | auto |
| name | string |
| username / email | string |
| password_hash | string |
| role | enum: MASTER / SUPER_USER / NORMAL_USER |

### Table: `user_stage_permissions` (only relevant for NORMAL_USER role)
| Column | Type |
|---|---|
| id | auto |
| user_id | FK |
| stage_name | string (e.g. "PLATING") |

- A Normal User can have multiple rows here if assigned multiple stages.

## Enforcement Rules (apply on every relevant API endpoint)

1. **Launch Job endpoint**: allow only if `role IN (MASTER, SUPER_USER)`.
2. **View Jobs endpoint**:
   - MASTER / SUPER_USER: return all jobs.
   - NORMAL_USER: return only jobs where `current_stage` is in the user's assigned stages.
3. **Move Job (Full/Partial) endpoint**:
   - MASTER / SUPER_USER: allow for any `from_stage`.
   - NORMAL_USER: before processing, check `from_stage` is in `user_stage_permissions` for this user_id. If not, reject with `403 Forbidden` — do this check server-side regardless of what the request body claims.
4. **Delete Job endpoint**: allow only for `role = MASTER`.
5. **User Management / Stage Config / System Config endpoints**: allow only for `role = MASTER`.
6. Log every rejected unauthorized attempt (user_id, attempted stage, timestamp) for audit purposes — optional but recommended.

## Login / Session

- Simple username+password login.
- Session/token should carry `user_id` and `role` (and cached list of assigned stages for Normal Users) — re-validated server-side on every movement request, never trusted from client alone.

## Acceptance Test

1. Master can launch, view all, move any stage, delete, manage users.
2. Super User can launch, view all, move any stage — but delete button/API is blocked (403 if forced via API).
3. Normal User assigned to PLATING only sees PLATING jobs, can move them; attempting to move a DRILLING job via direct API call (Postman/manual request) returns 403, even if UI is bypassed.
