# Security QA Report — Stackline Workflow Sprint (2차 E2E)

- **Verification of issue:** `019e3f76-1f02-70e2-b3de-8ef11e03fd73`
- **QA phase:** `security_qa`
- **Scope:** the merged Stackline Workflow Sprint implementation (game source,
  Vite build config, GitHub Pages workflow). The game is a static, offline,
  client-side falling-block browser game with no backend, no network calls,
  no auth surface, and no user-generated content.
- **Verdict:** ✅ **PASS — no release blocker.**
- **Date:** 2026-05-19

## Evidence collected

| File | Source |
| --- | --- |
| `qa/security/npm-audit-production.txt` | `npm audit --omit=dev` |
| `qa/security/npm-audit-all.json`       | `npm audit --json` |
| `qa/security/grep-findings.txt`        | grep for risky JS sinks + secret-shaped strings |
| `qa/security/workflow-permissions.txt` | permissions block of `.github/workflows/pages.yml` |
| `qa/security/scan.sh`                  | reproducible POSIX-sh scanner used to regenerate the above |

Re-run with `sh qa/security/scan.sh` from the repository root.

## Findings

### 1. Dependency vulnerabilities

- **Production runtime: 0 vulnerabilities** (`npm audit --omit=dev` →
  `found 0 vulnerabilities`). The shipped Pages artifact has **no** transitive
  runtime dependencies that npm flags.
- **Dev tree: 5 moderate** — all in the Vite/Vitest/esbuild dev-server stack:
  - `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99, dev-server SSRF-like, CVSS 5.3)
  - `vite <=6.4.1` (GHSA-4w7w-66w2-5vf9, dev-server path traversal in `.map`)
  - Transitive: `vite-node`, `@vitest/mocker`, `vitest`
  - **Reach:** local-dev only. None of these execute in CI build (`vite build`
    does not start the dev server) or in the static artifact served by Pages.
  - **Severity for this release:** non-blocking. Recommend tracking a follow-up
    to bump Vite/Vitest to the next major (semver-major change, out of scope
    for this E2E sprint).

### 2. Source code (XSS / injection sinks)

Grep flagged exactly one `innerHTML` site:

```
src/render.ts:185:    if (title.innerHTML !== wantHtml) title.innerHTML = wantHtml;
```

`wantHtml` is one of two **module-level constants** (`DEFAULT_TITLE_HTML`,
`GAME_OVER_TITLE_HTML`) containing only the literal strings
`"Stackline<br>Workflow Sprint"` and `"Game Over"`. No user, network, or
storage input ever reaches this sink — **not exploitable**.

No `eval`, `new Function`, `document.write`, `insertAdjacentHTML`,
`setTimeout("string", …)`, or `setInterval("string", …)` usage anywhere in
`src/` or `index.html`.

### 3. Data egress / persistence

- No `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`,
  `localStorage`, `sessionStorage`, `indexedDB`, or `document.cookie` usage in
  source (verified via grep). The game is fully offline; no telemetry, no
  tracking, no user data leaves the page.

### 4. Secrets

- No hardcoded secrets found (`grep-findings.txt` only matches the scanner
  script's own regex literal). The lockfile was excluded from the secret
  scan but contains only public npm metadata. The two `id-token: write`
  matches are the OIDC permission line in `pages.yml` and its mirror in
  `README.md`, both expected for `actions/deploy-pages@v4`.

### 5. CI/CD workflow (`.github/workflows/pages.yml`)

- Minimum-privilege permissions block:
  `contents: read`, `pages: write`, `id-token: write` — the standard,
  documented set required by `actions/deploy-pages@v4` OIDC. No
  `contents: write`, no `packages: write`, no `actions: write`.
- Triggered only on `push` to `main` and `workflow_dispatch` — no
  `pull_request_target`, no `issue_comment`, no `workflow_run` chaining,
  no untrusted-fork exposure.
- All actions are pinned to a major version (`@v4`, `@v5`, `@v3`); SHA
  pinning would be stronger but is acceptable for a non-secret-bearing
  Pages deployment.
- `npm ci` is used (lockfile-enforced installs).
- No third-party scripts injected into the built page; CSP would be a
  future hardening item but is not a blocker for a static, no-input game.
- **Per scope boundary, the workflow file is NOT modified by this QA.**

### 6. Lint / unit tests

Re-ran the pre-merge gate as a sanity check (read-only, no source edits):

- `npm run lint` → clean.
- `npm test` → 22/22 tests pass across 3 files.

## Blocking findings

**None.** All five dependency advisories are dev-only and have no reach into
the deployed Pages artifact. No exploitable XSS, no secrets, no over-broad
workflow permissions.

## Recommendations (non-blocking, future sprint)

1. Bump `vite` → 6.x or 7.x and `vitest` → 4.x to clear dev-only advisories.
2. Consider replacing the one constant `innerHTML` assignment in
   `src/render.ts:185` with `textContent` for the literal cases and a
   small DOM-builder for the `<br>` case, purely as defense-in-depth.
3. Add a `Content-Security-Policy` `<meta>` tag (e.g.
   `default-src 'self'; img-src 'self' data:; style-src 'self'`) to
   `index.html` as further hardening.
4. Pin GitHub Actions to commit SHAs.
