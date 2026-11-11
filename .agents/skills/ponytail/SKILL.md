---
name: ponytail
description: Evaluates code, architecture, and feature additions through the Ponytail Lazy Senior Developer philosophy to eliminate unnecessary code and over-engineering.
---

# Ponytail Skill: Senior Developer Restraint & Anti-Bloat

This skill provides step-by-step procedures for reviewing code or proposed designs to keep the codebase ultra-lean and maintainable.

## Workflow: The Restraint Audit

When asked to implement a feature or review code:

1. **YAGNI Check (Eliminate Premature Generalization)**:
   - Identify any speculative config options, polymorphic factories, or future-proofing wrappers that were not requested.
   - Strip them out.

2. **Native Platform First**:
   - Check if an external library was introduced for functionality supported natively (e.g., standard dialogs, native date pickers, fetch, URLSearchParams, regex).
   - Prefer native browser / Node platform APIs.

3. **Reuse Audit**:
   - Verify if an existing helper, utility function, or component already fulfills this role before writing a new one.

4. **Line Count & Modularity Verification**:
   - Ensure individual files do not exceed ~400 lines.
   - If a file is ballooning, extract distinct concerns (e.g. modals, complex forms, scanner streams) into separate single-purpose components.

5. **Post-Implementation Report**:
   - State what code was skipped/avoided.
   - Note any remaining trade-offs or technical debt.
