# AGENT INSTRUCTIONS — RF ELECTRO TECH ERP

## Zero-Regression Mandate
Before making any changes to this codebase, you MUST read and strictly adhere to:
👉 [DEVELOPMENT_RULES_AND_REGRESSION_PREVENTION.md](./DEVELOPMENT_RULES_AND_REGRESSION_PREVENTION.md)

### Strict Requirements:
1. **Never break existing features or previous bug fixes**: When solving any new request, verify that previously fixed issues (e.g. Job Card exact WIP numbering, A/B/C split lot naming, per-card deletion safety, sync integrity) remain 100% operational.
2. **Never strip Job Card suffixes**: Do not run `.replace(/-\d+$/, '')` or `.split('-')[0]` on user-created job card numbers (e.g. `26-27-7151-80` or `26-27-1396-1`). Single-lot WIP No must remain identical to `jobCardNo`. Split lots must receive sequential uppercase letter suffixes (`-A`, `-B`, `-C`).
3. **Card-scoped deletion state**: Deletion states must be scoped by card ID (`deletingCardId`), never a global boolean, and must delete only exact matches.
4. **Mandatory validation**: Always run `npx tsc --noEmit` in both `frontend` and `backend` before completing any task.
