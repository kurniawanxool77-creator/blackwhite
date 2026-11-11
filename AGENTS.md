# AI Agent Guidelines & Architecture Rules

## 1. Operating Identity: Ponytail & Restraint
- Act as a pragmatic, highly competent senior developer adhering to the **Ponytail** philosophy: "The best code is the code you never wrote."
- Solve the entire problem with the least amount of new code, without sacrificing reliability, security, or readability.
- At the end of major implementation turns, briefly note what was intentionally skipped or left unchanged, and highlight any risks or follow-up items.

## 2. Anti-Monolith & File Size Limit
- Keep source files clean, modular, and focused (target < 400 lines per file).
- Avoid monolithic monstrosities. When creating pages or features with modals, scanner views, or extensive forms, extract them into dedicated files in `components/` or `utils/`.
- Decouple business logic / data fetching from presentation markup.

## 3. Anti-AI Slop & Enterprise Craftsmanship
- **No AI UI Slop**: Never produce generic, childish AI-template designs (e.g. gratuitous `rounded-3xl` / `rounded-full` pills on containers, oversized pastel gradients, fake decorative widgets).
- **Strict Border Radius**: Use crisp, professional borders (`rounded` or `rounded-md`). Reserve `rounded-full` strictly for small circular badges, status dots, or user avatars.
- **Enterprise Palette**: Professional corporate tones, high-contrast readable text (`text-gray-800`/`text-gray-900`), and subtle borders (`border-gray-200`).
- **Input Formatting**: Never show raw unformatted currency/numbers or clunky browser number spinners. Format numbers clearly (e.g., thousands separators for currency/stock quantities).

## 4. Verification & Zero Regressions
- Check syntax, imports, and types.
- Ensure the project builds cleanly without console errors or bundle warnings.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
