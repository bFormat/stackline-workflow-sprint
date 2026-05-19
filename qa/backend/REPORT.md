# Backend QA Report — Stackline Workflow Sprint, 2차 E2E 검증

- **Verification of issue:** `019e3f76-1f02-70e2-b3de-8ef11e03fd73`
- **Phase:** `backend_qa` (server-side / build & test infrastructure side of an
  otherwise client-only browser game — verified the deterministic engine,
  toolchain pipeline, lockfile integrity, dependency posture, and deploy
  workflow invariants).
- **Date:** 2026-05-19
- **Verdict:** **PASS — no release blockers found.**

## Summary

The implementation in commit `022e29e` ships a self-contained Vite/TypeScript
client. There is no Node service or HTTP backend, so "backend QA" for this plan
covers:

1. The deterministic, pure-function game **engine** (the project's
   reducer-style state machine, treated as the server-side-equivalent
   contract) — exercised through the unit test suite.
2. The **build/test pipeline** that CI relies on (`npm ci`, `npm run lint`,
   `npm test`, `npm run build`).
3. **Lockfile / dependency** posture — confirming `package-lock.json` is in
   tree, `npm ci` resolves cleanly, and any audit findings are scoped to dev
   tooling only.
4. The **GitHub Pages deploy workflow** is unchanged (scope boundary
   explicitly forbids touching it; this QA only confirms it).
5. **Originality guardrails** — no forbidden trade-dress strings reach the
   shipped artifacts.

Every check passes. Artifacts captured under `qa/backend/`.

## Evidence

| Check | Command | Result | Log |
| --- | --- | --- | --- |
| Type check + production build | `npm run build` | ✅ `tsc --noEmit` clean, vite emits 3 files (10.7 kB JS, 5.0 kB CSS, 3.4 kB HTML) | `build.log` |
| Standalone type check | `npx tsc --noEmit` | ✅ no diagnostics | `tsc.log` |
| Lint | `npm run lint` | ✅ no warnings | `eslint.log` |
| Unit tests (engine + DOM + overlay) | `npm test` | ✅ 22/22 pass across 3 files | `vitest.log` |
| Dependency audit | `npm audit` | ⚠️ 5 moderate findings — **all in dev-only deps** (`vite`/`vitest`/`esbuild` chain); none ship to users. Not a release blocker for a static GH Pages site. | `npm-audit.txt`, `npm-audit.json` |
| Shipped artifact hashes | `sha256sum dist/...` | recorded | `dist-hashes.txt` |
| Forbidden trade-dress scan | recursive grep over `dist/`, `src/`, `tests/`, root | ✅ no occurrences in shipped output; the four matches in repo are intentional disclaimers / a test guardrail (classified in report) | `forbidden-strings-scan.txt` |

### Test breakdown (from `vitest.log`)
```
 ✓ tests/dom-smoke.test.ts   (1 test)
 ✓ tests/engine.test.ts      (16 tests)
 ✓ tests/overlay.test.ts     (5 tests)
 Test Files  3 passed (3)
      Tests  22 passed (22)
```

Coverage spans:

- Engine **fundamentals**: initial state shape, `START` semantics, score table.
- **Line clearing & scoring**: full row clear + hard-drop into a 9/10 row.
- **Input simulation**: MOVE / ROTATE / SOFT_DROP / HARD_DROP / PAUSE / HOLD /
  RESTART, plus the keyboard map (`actionForKey`).
- **Geometry helpers**: `pieceCells`, `collides` boundary checks,
  `ghostPosition` monotonicity.
- **Overlay polish** (the 2차 E2E focus): distinct "Game Over" heading,
  restart hint, `is-over` marker class, restoration of the default title
  after a restart, hidden state during play, **and a sweep that fails the
  build if `TETR.IO`/`tetrio`/`TETRIO`/`Tetrio`/`SRS`/`ARS` ever reach the
  overlay markup.**
- **DOM smoke**: every required HUD landmark exists in `index.html` and the
  game stage is the first content in `<main>`.

### Lockfile integrity

`package-lock.json` is committed at the repo root (3,690 lines, lockfile v3).
`npm ci` succeeds in a clean container with no engine warnings other than the
expected upstream deprecation notices for transitive packages.

### Deploy workflow (read-only confirmation)

Per scope, the workflow file was **not modified** by this QA pass. Confirmed
`.github/workflows/pages.yml` still:

- runs on `push` to `main` and `workflow_dispatch`,
- uses `actions/setup-node@v4` without `cache: npm` (consistent with the
  capsule convention of "do not configure setup-node npm caching"),
- installs with `npm ci`,
- runs `npm run lint` and `npm test` **before** `npm run build`,
- uploads `dist` via `actions/upload-pages-artifact@v3`,
- deploys via `actions/deploy-pages@v4`.

No changes were made.

### Notes on `npm audit` (non-blocker)

The five moderate findings are entirely in the **dev-tooling** chain
(`esbuild` → `vite` → `vite-node` / `vitest` / `@vitest/mocker`). They are not
imported by the runtime bundle and have no exposure on the static
GitHub-Pages-hosted artifact. Upgrading would require bumping the major
versions of `vite` and `vitest`, which is explicitly out of scope for this
QA-only issue (scope boundary: "do not modify build scripts or source"). The
findings are recorded in `npm-audit.{txt,json}` so the next dependency-bump
PR can address them.

## Blocking findings

None.

## Files produced by this QA run

```
qa/backend/REPORT.md                  ← this file
qa/backend/build.log
qa/backend/dist-hashes.txt
qa/backend/eslint.log
qa/backend/forbidden-strings-scan.txt
qa/backend/npm-audit.json
qa/backend/npm-audit.txt
qa/backend/tsc.log
qa/backend/vitest.log
```

## Final assessment

**PASS.** The engine contract is exercised by 22 deterministic unit tests
that all pass; the build, type-check, and lint pipeline is green; the lockfile
is present and reproducible; no forbidden trade-dress strings reach the
shipped bundle; and the GitHub Pages deploy workflow is unchanged. The plan
is not blocked from the backend-QA side.
