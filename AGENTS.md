# AGENT INSTRUCTIONS — RF ELECTRO TECH ERP

## Zero-Regression Mandate
Before making any changes to this codebase, you MUST read and strictly adhere to:
👉 [DEVELOPMENT_RULES_AND_REGRESSION_PREVENTION.md](./DEVELOPMENT_RULES_AND_REGRESSION_PREVENTION.md)

### Strict Requirements:
1. **Never break existing features or previous bug fixes**: When solving any new request, verify that previously fixed issues (e.g. Job Card exact WIP numbering, A/B/C split lot naming, per-card deletion safety, sync integrity, stage-scoped operator views) remain 100% operational.
2. **Never strip Job Card suffixes**: Do not run `.replace(/-\d+$/, '')` or `.split('-')[0]` on user-created job card numbers (e.g. `26-27-7151-80` or `26-27-1396-1`). Single-lot WIP No must remain identical to `jobCardNo`. Split lots must receive sequential uppercase letter suffixes (`-A`, `-B`, `-C`).
3. **Card-scoped deletion state**: Deletion states must be scoped by card ID (`deletingCardId`), never a global boolean, and must delete only exact matches.
4. **Mandatory validation**: Always run `npx tsc --noEmit` in both `frontend` and `backend` before completing any task.

---

## Strict Regression Prevention Rules

1. **Pre-edit Checklist**: Before making any change, first list which files/functions you plan to touch.
2. **Strict Scope Control**: NEVER modify, refactor, or "clean up" any file or function that is not directly related to the current task, even if it looks improvable.
3. **Finality of Fixed Features**: Any feature or bug fix confirmed as "done"/"working" is FINAL. Do not alter its logic in future tasks unless explicitly instructed: "modify X again."
4. **Safety Gate for Shared Code**: If completing the current task requires changing shared/common code that affects an already-fixed feature, STOP and ask the user before making that change — do not proceed silently.
5. **Change Transparency**: After every change, summarize exactly which files were modified and why, so the user can verify nothing outside scope was touched.
6. **Minimal Delta Principle**: Prefer the smallest possible change that solves the current task. Do not do large refactors unless explicitly asked.
