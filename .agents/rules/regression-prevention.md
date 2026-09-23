# Regression Prevention Rules — RF ELECTRO TECH ERP

1. **Pre-edit Checklist**: Before making any change, first list which files/functions you plan to touch.
2. **Strict Scope Control**: NEVER modify, refactor, or "clean up" any file or function that is not directly related to the current task, even if it looks improvable.
3. **Finality of Fixed Features**: Any feature or bug fix confirmed as "done"/"working" is FINAL. Do not alter its logic in future tasks unless explicitly instructed: "modify X again."
4. **Safety Gate for Shared Code**: If completing the current task requires changing shared/common code that affects an already-fixed feature, STOP and ask the user before making that change — do not proceed silently.
5. **Change Transparency**: After every change, summarize exactly which files were modified and why, so the user can verify nothing outside scope was touched.
6. **Minimal Delta Principle**: Prefer the smallest possible change that solves the current task. Do not do large refactors unless explicitly asked.
