# Skill: quill-table-up — Learn & Develop

Related skill: `agent-customization` (use its template and principles when editing this file)

Purpose
- Help a developer or agent quickly learn, run, test, and extend the `quill-table-up` module (Quill v2.x table support).
- Provide a deterministic, repeatable workflow for exploring the codebase, running the demo/tests, and implementing changes.

Triggers
- `quill-table-up`, `table-up`, `learn quill-table-up`, `dev quill-table-up`, `quill table module`

Scope
- Workspace-scoped: tailored to the repository at the workspace root. Assumes the caller is working inside this repository.

Prerequisites (explicit — do not assume)
- Confirm Node.js is installed: run `node -v`.
- Confirm a package manager: this repo declares `pnpm` in `package.json` (`packageManager: pnpm@...`). If `pnpm` is not available, `npm` or `yarn` may work but confirm before proceeding.
- Confirm you have permissions to install dev dependencies and run Playwright (if running e2e tests).

Quick setup (commands — run in repo root)
- Install deps: `pnpm install` (or `npm install` if you do not use pnpm).
- Build once: `pnpm run build`.
- Dev build (watch): `pnpm run dev`.
- Start local server (serves demo): `pnpm run server`.
- Run unit tests: `pnpm run test:unit`.
- Run e2e tests: `pnpm run test:e2e` (Playwright browsers may require `npx playwright install` first).

Repository map (quick orientation)
- Source: `src/` — core implementation.
  - `src/index.ts` — package entrypoint, re-exports.
  - `src/table-up.ts` — main module (`TableUp` class), registration, options, and module glue.
  - `src/formats/` — DOM/Quill format definitions (table cell, row, head, body, etc.).
  - `src/modules/` — modular features (TableSelection, TableMenu, TableResize, TableClipboard, etc.).
  - `src/__tests__/` — unit and e2e test suites.
- Docs/demo: `docs/` and `test.html` / `index.html`.
- Build scripts: `scripts/` (`build.ts`, `server.ts`).
- Styles: `style/` and packaged CSS (`index.css`, `table-creator.css`).

Exploration checklist (step-by-step)
1. Verify environment: `node -v`, `pnpm -v`.
2. Install dependencies: `pnpm install`.
3. Run unit tests to sanity-check: `pnpm run test:unit`.
4. Start `pnpm run dev` to watch builds and open demo (`docs/index.html` or `test.html`).
5. Inspect `src/table-up.ts` to understand lifecycle, registration, and options.
6. Inspect `src/formats/*` to learn how DOM structure and blots are defined.
7. Inspect `src/modules/*` to learn modular feature boundaries (selection, menu, resize, clipboard).
8. Locate and run a single unit test to understand test patterns (Vitest + jsdom).
9. If working on UI changes, open `docs/index.html` or `test.html` in served server to verify visually.

Decision points & branching logic
- If a change only touches UI text/constants: prefer editing `utils/constants` and `defaultTexts` and update `updateTableConstants` where constants are re-bound.
- If a change affects Quill blots or formats: update `src/formats/*` and ensure `table-up.ts` registration is consistent (`Quill.register(...)`).
- If adding behavior (resize, selection, menu), check whether it should be a new `modules/` module, or extend an existing one.
- When modifying build/file-export behavior (CSS, index export), update `scripts/` and `package.json` exports, and verify `pnpm run build` output under `dist/`.

Quality criteria / completion checks
- All unit tests in `src/__tests__/unit` pass.
- E2E tests pass (after installing Playwright browsers) if the change touches runtime interaction.
- `pnpm run build` completes without errors and `dist/` contains `index.js`, `index.d.ts`, `index.css` as expected.
- Demo pages (`docs/index.html`, `test.html`) render and the changed feature behaves interactively.
- Lint passes: run `pnpm run lint` (repo uses ESLint config).

Common tasks and where to start
- Add a new module: create `src/modules/my-module.ts`, export it from `src/modules/index.ts`, add to `TableUp` `modules` default or allow via `modules` option.
- Modify format: edit `src/formats/*`, update blot names in `updateTableConstants` if necessary.
- Update texts/localization: edit `defaultTexts` and ensure `resolveTexts()` picks them up.
- Debugging in browser: run `pnpm run dev` and open `docs/index.html` or `test.html`; use devtools to inspect generated DOM and blots.

Example prompts to use this skill (for human or agent)
- "List the modules implemented under `src/modules/` and their responsibilities."
- "Run unit tests and show failures."
- "Find where the `MergeCell` menu action is implemented."
- "Add an option to set default table border color and list affected files."

Clarifying questions (please answer before the agent executes changes)
1. Scope: Should the skill be workspace-scoped (this repository) or installed globally for your account? (recommended: workspace-scoped)
2. Depth: Do you want a short orientation checklist or a fully automated onboarding script (install + run tests + open demo)?
3. Tests: Do you want the skill to run e2e Playwright tests automatically (requires installing browsers and may be slower)?
4. Automation: Should the skill add npm scripts or CI job templates (GitHub Actions) for the tasks above?

Iterate
1. Draft (this file) — done.
2. Answer clarifying questions above.
3. I will update the skill with your preferences and add optional automation (scripts or CI) if requested.

Notes & safe-guards
- Do not run Playwright e2e tests automatically without explicit confirmation.
- Always re-verify Node / package-manager availability before running install scripts.

Where to save
- This file is expected at `.agents/skills/quill-table-up/SKILL.md` inside the repository so local agents or teammates can find it.

Progress tracking
- Use the todo list created by the agent to track exploration and authoring steps.

---

End of skill draft. Please answer the Clarifying questions above so I can finalize and add optional automation or CI templates.