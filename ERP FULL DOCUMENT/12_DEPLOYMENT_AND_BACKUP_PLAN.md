# 12_DEPLOYMENT_AND_BACKUP_PLAN.md — PCB Manufacturing ERP

> This system runs a live factory floor — downtime or data loss directly stops
> production tracking. This plan treats reliability as a first-class requirement,
> not an afterthought.

---

## 1. Environments

| Environment | Purpose | Notes |
|---|---|---|
| **Local/Dev** | Individual developer machines | Seeded with fake data, never real customer data |
| **Staging** | Client demo + UAT + pre-release testing | Mirrors production config, separate DB, safe to reset |
| **Production** | Live factory operations | Real data, strict access control, monitored |

**Rule**: No feature goes to Production without first passing through Staging
and being checked against `09_ACCEPTANCE_CRITERIA.md`.

---

## 2. Hosting Decision (needs client input — see MASTER_CONTEXT open questions)

Two viable paths — decide with client based on factory network reliability and
IT comfort level:

### Option A — Cloud-hosted (recommended default)
- E.g. a VPS/cloud provider (AWS/DigitalOcean/Azure/GCP) running the app +
  managed PostgreSQL.
- Pros: easier backups, easier remote access for customer portal, easier
  scaling, less on-site hardware to maintain.
- Cons: **factory floor now depends on internet connectivity** for every QR
  scan/update — if factory internet is unreliable, this hurts shop-floor
  usability badly. Mitigate with a PWA that queues updates offline and syncs
  when back online (confirm as a requirement).

### Option B — On-premise local server + cloud relay
- A local server inside the factory handles shop-floor operations (fast, LAN-
  only, works even if internet drops); syncs to a cloud instance periodically
  for the Customer Portal and remote reporting access.
- Pros: shop floor never blocked by internet issues.
- Cons: more infrastructure to maintain (physical server, UPS/power backup,
  local backups, someone responsible for it on-site), sync logic adds
  complexity.

**Recommendation for Phase 1**: Start with Option A (cloud) for simplicity
and faster delivery, but build the mobile/shop-floor client with offline-
queue capability from the start so migrating to Option B later (if the
factory's internet proves unreliable) doesn't require a rewrite.

---

## 3. Deployment Architecture (cloud option)

```
                     ┌─────────────────────┐
                     │   Load Balancer /    │
                     │   Reverse Proxy      │
                     │   (Nginx / Caddy)    │
                     └─────────┬────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                                  │
     ┌────────▼────────┐              ┌──────────▼─────────┐
     │  App Server(s)   │              │  App Server(s)      │
     │  (API + Web)      │              │  (can scale out)    │
     └────────┬─────────┘              └──────────┬──────────┘
              │                                    │
              └───────────────┬────────────────────┘
                               │
                     ┌─────────▼──────────┐
                     │  PostgreSQL          │
                     │  (Primary + Replica) │
                     └─────────┬─────────────┘
                               │
                     ┌─────────▼──────────┐
                     │  Object Storage      │
                     │  (delivery photos,    │
                     │   QR images, reports) │
                     └───────────────────────┘
```

- SSL/TLS termination at the reverse proxy — everything HTTPS, no exceptions
  (customer portal + internal auth tokens must never travel unencrypted).
- Separate subdomain or path for Customer Portal (`portal.company-erp.com`)
  vs internal app (`app.company-erp.com`) — makes access control and future
  scaling cleaner.

---

## 4. CI/CD Pipeline

1. Push to feature branch → run automated tests (unit + integration) on CI.
2. PR merged to `main` → auto-deploy to **Staging**.
3. Manual approval/tag → deploy to **Production** (never auto-deploy to
   Production directly — this is a factory system, deploy deliberately).
4. Every Production deploy runs DB migrations as a controlled step (not
   silently on app boot) — with a rollback migration ready before deploying.
5. Deploy during a **low-production-activity window** communicated to the
   factory in advance (e.g. shift change, not mid-batch).

---

## 5. Backup Strategy

### Database
- **Automated daily full backups**, retained for at least 30 days.
- **Point-in-time recovery (PITR)** enabled via WAL archiving (PostgreSQL) —
  critical for a traceability system, so a bad data entry or accidental
  action can be recovered to an exact moment, not just "yesterday."
- Backups stored in a **separate region/location** from the primary DB (never
  back up to the same disk/server as production — that's not a backup).
- Weekly test-restore of a backup into a scratch environment to verify
  backups actually work (an unverified backup is not a real backup).

### File Storage (delivery photos, generated reports, QR images)
- Object storage with versioning enabled + cross-region replication if the
  provider supports it.

### Application Code / Config
- Source of truth is Git (already versioned). Environment secrets stored in
  a secrets manager, not in the repo — and the secrets manager itself is
  backed up per provider's guidance.

### Backup Schedule Summary

| Data | Frequency | Retention |
|---|---|---|
| Full DB backup | Daily | 30 days |
| DB transaction log (PITR) | Continuous | 7 days rolling |
| File storage (photos/reports) | Continuous (versioned) | 90 days minimum |
| Config/secrets | On every change | Full history via secrets manager |

---

## 6. Disaster Recovery (DR)

- Define and document **RTO (Recovery Time Objective)** and **RPO (Recovery
  Point Objective)** with the client — e.g. "max 4 hours downtime, max 15
  minutes of data loss" — this decision drives how much DR infrastructure is
  worth investing in.
- Maintain a written runbook: "if production DB fails, here are the exact
  steps to restore from backup and bring the app back up" — don't rely on
  tribal knowledge.
- If Option B (on-prem) is chosen, ensure the factory has UPS/power backup
  for the local server, and a documented failover to a cloud instance if the
  local server has a hardware failure.

---

## 7. Monitoring & Alerting

- Application uptime monitoring (e.g. health-check endpoint pinged
  externally) with alerts (email/SMS) to the responsible dev/admin if the
  system goes down — this is a live factory system, downtime must be caught
  immediately, not discovered next morning.
- Error tracking (e.g. Sentry or similar) for backend + frontend exceptions.
- DB performance monitoring — watch for slow queries as job card/movement
  log volume grows over time.
- Track and alert on **failed notification deliveries** (dispatch/delivery
  notifications) — a silently-failed notification defeats the purpose of
  that feature.

---

## 8. Security Basics for Deployment

- All secrets (DB passwords, API keys, JWT signing keys) in environment
  variables / secrets manager — never committed to Git.
- Regular dependency updates (automated vulnerability scanning, e.g. Dependabot
  or equivalent).
- Rate limiting on public-facing endpoints (especially Customer Portal login
  and QR scan endpoints) to prevent abuse.
- Database access restricted to app servers only (no public DB port
  exposure).
- Regular access review — especially for the Master/Admin account and any
  server/infra-level access.

---

## 9. Go-Live Checklist (summary — expand at Phase 6)

- [ ] All Acceptance Criteria (`09_ACCEPTANCE_CRITERIA.md`) passing in Staging
- [ ] Backup + restore tested successfully at least once
- [ ] Monitoring/alerting live and tested (trigger a test alert)
- [ ] SSL certificates valid and auto-renewing
- [ ] RTO/RPO documented and agreed with client
- [ ] Internal users trained, Admin account credentials securely handed over
- [ ] Rollback plan documented for the go-live deploy itself
