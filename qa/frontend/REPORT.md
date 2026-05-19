# Frontend QA Report — 2차 E2E 검증 (소규모 폴리시 + 표준 QA)

- **Verification of implementation issue:** `019e3f76-1f02-70e2-b3de-8ef11e03fd73`
- **Commit under review:** `022e29e` — "Stackline Workflow Sprint - 2차 E2E 검증 (소규모 폴리시 + 표준 QA) (#6)"
- **QA phase:** frontend_qa
- **Verdict:** **PASS** — no release blockers found.

## Scope of this QA

Standard frontend gating for the 2nd E2E review of the small game-over
polish drop. Per the issue scope, the QA must:

1. Confirm `npm run lint`, `npm test`, `npm run build` all succeed on a
   clean checkout (these are the same commands `.github/workflows/pages.yml`
   runs in CI).
2. Confirm the game-over polish (distinct "Game Over" title + clearer
   restart hint + `.overlay.is-over` styling hook) is present in both
   source and the production bundle.
3. Confirm no trade-dress / forbidden-terminology regressions leaked into
   source or built assets.
4. Confirm deploy workflow and shipped asset paths were not modified
   beyond what is required for the polish (read-only check on
   `.github/workflows/pages.yml`).

QA is read-only with respect to game source, deploy config, and
dependencies, per the scope boundary. No source edits were made.

## Checks performed

### 1. Install + lint + tests + build

| Command         | Result | Evidence                                         |
|-----------------|--------|--------------------------------------------------|
| `npm ci`        | OK (238 packages installed)                  | terminal log (omitted; reproducible from lockfile) |
| `npm run lint`  | **PASS** (eslint, no warnings/errors)        | `evidence/lint.txt`        |
| `npm test`      | **PASS** — 3 files, 22/22 tests              | `evidence/test.txt`        |
| `npm run build` | **PASS** — `tsc --noEmit` + `vite build`     | `evidence/build.txt`       |

Test files exercised:

- `tests/engine.test.ts` — 16 reducer / scoring / key-mapping tests.
- `tests/overlay.test.ts` — **5 game-over-polish tests** (the focus of
  this drop): idle title, distinct "Game Over" title + restart hint,
  recovery to default title on restart, hide-on-play, and a forbidden
  trade-dress string guard across all four overlay states.
- `tests/dom-smoke.test.ts` — 1 jsdom smoke test that the playable
  canvas is the first thing under `<main>` (no landing page in front).

All 22 tests pass; no flaky suites observed.

### 2. Game-over polish is wired through to the shipped bundle

The implementation adds a `.overlay.is-over` style hook and swaps the
overlay title/subtitle in `src/render.ts`:

- `src/styles.css` adds two rules — `.overlay.is-over .title` (uses
  `var(--danger)`, uppercased, wider tracking) and
  `.overlay.is-over .subtitle` (full-strength `--ink`, weight 600).
- `src/render.ts::renderOverlay` swaps innerHTML to `"Game Over"` and
  the subtitle to a multi-path restart hint ("press any key, tap here,
  or click Restart"). It also resets `is-over` / `is-paused` / `is-idle`
  classes on every render so state never leaks between transitions.

Both polish hooks survive the build pipeline:

```
Occurrences of 'is-over' in built CSS: 2
Occurrences of 'is-over' in built JS:  1
Occurrences of 'Game Over' in built JS: 1
```

(See `evidence/build-artifacts.txt`.) The asserted polish is therefore
delivered to end users, not just present in source.

### 3. Originality / trade-dress scan (frontend-visible)

Ran a case-insensitive scan for `tetr`, `tetr.io`, `tetrio`, `SRS`,
`ARS` across the source tree (excluding the audit doc `ORIGINALITY.md`
and `qa/`) and against the built `dist/` bundle.

- Source hits are exclusively reference mentions: two audit links in
  `README.md`, one author comment in `src/engine.ts`, and the
  `FORBIDDEN` array in `tests/overlay.test.ts` (which exists precisely
  to assert these strings never appear in the rendered overlay).
- **Built `dist/` bundle: zero hits.**

See `evidence/originality-scan.txt`. The polish drop did not introduce
any disallowed terminology, palette change, or branding regression.

### 4. Deploy workflow untouched (read-only)

Per the scope boundary I did not edit `.github/workflows/pages.yml`.
For evidence I recorded its SHA256 and the lines that determine deploy
behavior (`evidence/deploy-workflow.txt`):

- Steps remain `checkout → setup-node@v4 (node 20) → npm ci → npm run
  lint → npm test → npm run build (BASE_PATH=/<repo>/) → configure-pages
  → upload-pages-artifact (path: dist) → deploy-pages`.
- Permissions remain `contents: read`, `pages: write`, `id-token: write`.
- Artifact path is still `dist`, matching the assets that Vite emits.

No workflow drift relative to what README.md documents in §"CI & Deploy".

## Build output summary

```
dist/index.html                3,381 B
dist/assets/index-*.css        4,999 B   (5.00 kB / gzip 1.76 kB)
dist/assets/index-*.js        10,703 B   (10.70 kB / gzip 4.10 kB)
```

Hashes in `evidence/build-artifacts.txt`. Note: filenames contain Vite
content hashes that will differ on every build; the QA assertion is
structural (an `index.html`, one CSS asset, one JS asset under
`dist/assets/`), not byte-equal — that is what CI deploys.

## Findings

- **Blockers:** none.
- **Non-blocking observations:**
  - `npm ci` prints 5 moderate-severity advisories from transitive dev
    deps (jsdom / glob / inflight family). These do not affect the
    shipped bundle (devDependencies only) and the issue scope explicitly
    forbids dependency changes here. Recommended for a future
    dependency-bump PR; **not a release blocker for this drop**.
  - Several `npm WARN deprecated` notices for the same dev-only deps
    (eslint 8, rimraf 3, etc.). Same disposition — track separately.

## Conclusion

The 2차 E2E verification gates are all green:

- Lint clean, 22/22 tests passing (including 5 dedicated overlay
  polish tests).
- Production build succeeds; game-over polish (`.overlay.is-over` and
  the literal "Game Over" title swap) is present in the shipped CSS/JS.
- No trade-dress regressions in source or bundle.
- Deploy workflow and artifact path unchanged.

**Verdict: PASS.** No blockers; plan may proceed.
