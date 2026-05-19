# Backend / Build-Pipeline QA Evidence

**Sprint:** Stackline Workflow Sprint — 2차 E2E 워크플로우 검증
**Date captured:** 2026-05-19
**Capsule:** static GitHub Pages game (Vite + TypeScript, no server runtime)

---

## 1. Runtime architecture summary

This repository is a **static client-only browser game**. The "backend"
domain therefore covers:

- the **build pipeline** (`tsc --noEmit && vite build`)
- the **bundled artifact tree** produced into `dist/`
- any **client-side data layer** (none currently exists — see §5)

No Node process, edge function, or server-side handler runs at runtime.
The deployed artifact is served as a flat directory of static files
from GitHub Pages.

---

## 2. `npm ci` lockfile integrity

`npm ci` was executed in the capsule against the committed
`package-lock.json`. Full log: [`build-logs/npm-ci.log`](build-logs/npm-ci.log).

Tail:

```
added 238 packages, and audited 239 packages in <10s
```

Result: **lockfile integrity verified** — `npm ci` completed successfully
with no drift errors. (Deprecation and audit warnings are advisory only
and do not affect determinism.)

---

## 3. Build command output

Command: `npm run build` → `tsc --noEmit && vite build`.

Two consecutive builds were performed (logs:
[`build-logs/build-1.log`](build-logs/build-1.log) and
[`build-logs/build-2.log`](build-logs/build-2.log)). Both produced:

```
dist/index.html                  3.38 kB │ gzip: 1.08 kB
dist/assets/index-qB3-yBdr.css   5.66 kB │ gzip: 1.92 kB
dist/assets/index-D172m5oq.js   12.60 kB │ gzip: 4.69 kB
✓ built in ~200ms
```

`tsc --noEmit` completed without diagnostics — the project type-checks
cleanly against `tsconfig.json`.

---

## 4. Artifact tree (`dist/`)

Full listing: [`build-logs/dist-tree-2.txt`](build-logs/dist-tree-2.txt).

```
dist/
├── assets/
│   ├── index-D172m5oq.js
│   └── index-qB3-yBdr.css
└── index.html
```

Three artifacts total. No server-side files, no `.node`, no native
binaries, no environment-coupled config.

### 4.1 Reproducibility — two-build hash comparison

`sha256sum` of every file in `dist/`, sorted:

| Hash (sha256) | Path |
| --- | --- |
| `9736bc830f6e72d407ea384b67ce9399230855916f384b2d574d78496243a9f6` | `dist/assets/index-D172m5oq.js` |
| `0e1376bf6cf8ef1c3b21827c5550cba79586584c8efddb74cac3e6747a5def77` | `dist/assets/index-qB3-yBdr.css` |
| `5e6c7992b77dc2382948c510b1b6660a41dfdcfd1ba17c656671143079586f1a` | `dist/index.html` |

Both build runs produced **identical hashes** for all three files.
The marker file [`build-logs/reproducible.txt`](build-logs/reproducible.txt)
records `REPRODUCIBLE: hashes match`.

Note: Vite's content-addressed filenames (`-qB3-yBdr`, `-D172m5oq`) are
themselves a hash of bundle content; identical filenames across the two
runs already imply byte-identical inputs, which the sha256 comparison
confirms.

---

## 5. Client-data-layer audit

`tests/qa/backend.spec.ts` (loaded by `tests/qa/backend.test.ts` so
vitest's include pattern picks it up) asserts that no source file uses:

- `fetch()` / `XMLHttpRequest` / `WebSocket` / `navigator.sendBeacon`
- `localStorage` / `sessionStorage` / `indexedDB` / `serviceWorker`

…and that `package.json` declares **zero** runtime dependencies (the
`dependencies` field is empty; everything is in `devDependencies`).
Those tests **pass** in this capsule:

```
✓ tests/qa/backend.test.ts (6 tests) 37ms
```

In addition, the spec exercises the deterministic seeded engine reducer
— the only "data contract" surface this project exposes — and verifies:

1. The same seed produces the same starting piece queue (determinism).
2. Different seeds diverge (the PRNG is actually being seeded).
3. `RESTART` resets `score`, `lines`, and `level` invariants.

**Conclusion:** there is currently **no client-data layer** to test for
read/write contracts. The deterministic engine spec stands in as the
closest analogue and is committed to lock the contract.

---

## 6. No-server confirmation

- `package.json` `scripts`: `dev`, `build`, `preview`, `lint`, `test`
  — all build- or test-time only. No `start`, no `server`, no
  `migrate` / `seed`.
- `dependencies` is empty; only dev-tooling exists.
- `dist/` contains only HTML/CSS/JS — no `.mjs` server bundle, no
  `worker.js`, no `manifest.json` service-worker registration.
- Repository static-host target is GitHub Pages; no Node runtime is
  involved past build time.

---

## 7. Branding sweep within the build artifact

`grep -RniE 'tetr\.?io|tetris' dist/` → **no matches**.

A single occurrence appears in `src/engine.ts` as a pre-existing
disclaimer comment ("No TETR.IO content."), explicitly asserting that
the project avoids the brand. It is not present in the built artifact
and was not introduced or modified by this sprint.

---

## 8. Files committed alongside this evidence

- `qa/backend-evidence.md` (this file)
- `qa/build-logs/build-1.log`
- `qa/build-logs/build-2.log`
- `qa/build-logs/npm-ci.log`
- `qa/build-logs/dist-tree-1.txt`
- `qa/build-logs/dist-tree-2.txt`
- `qa/build-logs/dist-hashes-1.txt`
- `qa/build-logs/dist-hashes-2.txt`
- `qa/build-logs/reproducible.txt`
- `tests/qa/backend.spec.ts` (spec)
- `tests/qa/backend.test.ts` (vitest entry point that loads the spec)
