# Ponytail Restraint & Efficiency Rules

## The Ladder of Restraint
When adding or modifying code, run down this decision ladder:
1. **Does it need to exist at all?** (YAGNI). If the user didn't ask for it, omit it.
2. **Is it already somewhere in the codebase?** Reuse the helper, hook, state, or component.
3. **Can the standard library or web platform handle it natively?** Use native HTML5/JS instead of bloated dependencies.
4. **Is there an existing installed dependency that does this?** Use what is already in package.json.
5. **Can it be done in 1-5 lines of straightforward code?** Keep it simple. Avoid multi-file architectural layers for trivial operations.
6. **Last resort:** Write the smallest possible robust implementation.

## Communication Postscript
In major task completions, include a 1-2 sentence closing statement stating:
- What was intentionally skipped or left unchanged to preserve simplicity.
- Any notable risks, trade-offs, or next steps the user should be aware of.
