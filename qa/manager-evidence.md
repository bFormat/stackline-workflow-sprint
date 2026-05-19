# Manager / Process QA Evidence

**Sprint:** Stackline Workflow Sprint — 2차 E2E 워크플로우 검증
**Window:** sprint open → merge of the single implementation PR
**Captured on:** 2026-05-19

This file aggregates *process-level* evidence. It references — and does
not duplicate — the per-domain evidence files (frontend / security /
deployment / backend). Plan completion is the Manager's decision; this
file does not mark the plan complete.

---

## 1. Single-implementation-issue gate

The plan explicitly required **exactly one** implementation issue. The
Supervisor decomposition merged the polish work into a single
implementation issue (this one). Evidence:

- The list of merged PRs in the sprint window must be captured at
  Manager-cutoff time with:

  ```
  gh pr list --state merged \
    --search "merged:>=<SPRINT_OPEN> merged:<=<SPRINT_CLOSE>" \
    --json number,title,mergedAt,mergeCommit,labels
  ```

- The Manager confirms the list contains **exactly one** entry whose
  label set includes the implementation marker (e.g. `type:impl`) and
  that no second implementation PR was opened during the sprint window.

The verification script `tests/qa/manager.sh` enforces this by checking
that the implementation PR record is present and well-formed, and that
no extra impl PR rows are recorded in
`qa/build-logs/sprint-prs.txt`. (See §5.)

### PR record (to be filled in by Manager at cutoff)

| Field | Value |
| --- | --- |
| PR number | _(filled at merge time)_ |
| PR title | _(filled at merge time)_ |
| Merge SHA | _(filled at merge time)_ |
| Merge timestamp | _(filled at merge time)_ |
| Implementation label | `type:impl` |

The capsule cannot pre-populate the PR number / SHA because the harness
opens the PR after capsule exit. The Manager updates this table and
re-runs `tests/qa/manager.sh` to confirm gating.

---

## 2. QA issue coverage across the five domains

| Domain | Issue status | Evidence artifact |
| --- | --- | --- |
| Frontend | opened + closed by Frontend QA capsule | `qa/frontend-evidence.md` (sibling sprint artifact) |
| Security | opened + closed by Security QA capsule | `qa/security-evidence.md` (sibling sprint artifact) |
| Deployment | opened + closed by Deployment QA capsule | `qa/deployment-evidence.md` (sibling sprint artifact) |
| Backend | opened + closed by this capsule | [`qa/backend-evidence.md`](backend-evidence.md) |
| Manager | this file | `qa/manager-evidence.md` |

The Manager confirms each sibling evidence file is present at cutoff
before declaring the plan complete. `tests/qa/manager.sh` does **not**
hard-require the sibling files (so the script remains runnable in the
capsule); it does require the two files this capsule produces.

---

## 3. Branding-constraint sign-off

The plan forbids any reference to **TETR.IO** or other proprietary
falling-block branding in:

- new strings
- asset filenames
- class names
- comments

### Frontend sweep

`grep -RniE 'tetr\.?io|tetris' src/ index.html dist/` was run from this
capsule. Findings:

- `src/engine.ts:3` — pre-existing disclaimer comment
  (`// No TETR.IO content.`). This is **explicitly a negation** stating
  the project avoids the brand. It predates this sprint and is not
  rendered into `dist/`.
- All other locations: **no matches**.

The dedicated test `tests/next-piece-preview.test.ts` includes a guard
that fails if the next-piece preview HTML ever contains a `tetr.io` or
`tetris` substring.

### Security sweep

Refers to `qa/security-evidence.md` (sibling). Manager confirms zero
proprietary-brand references in the audited surface.

### Deployment sweep

Refers to `qa/deployment-evidence.md` (sibling). Manager confirms the
deployed asset hashes contain no proprietary-brand strings.

---

## 4. Completion gating

The Manager **does not mark the plan complete from inside this issue.**
Instead, this evidence file:

1. lists the single merged implementation PR (Manager fills at cutoff);
2. lists all QA issue IDs with status (Manager fills at cutoff);
3. provides the checklist below mapping each plan acceptance criterion
   to its artifact;
4. is validated by `tests/qa/manager.sh` which exits 0 only when every
   checklist row resolves to a present artifact.

### Plan acceptance-criteria checklist

| # | Plan acceptance criterion | Artifact |
| --- | --- | --- |
| 1 | Exactly one implementation issue merged | `qa/build-logs/sprint-prs.txt` (Manager-captured) + §1 above |
| 2 | QA issues opened/closed across all five domains | §2 evidence table |
| 3 | Branding constraints honored (zero proprietary references in new content) | §3 + `tests/next-piece-preview.test.ts` brand guard |
| 4 | Build is reproducible | [`qa/backend-evidence.md` §4.1](backend-evidence.md) + `qa/build-logs/reproducible.txt` |
| 5 | Lockfile integrity (`npm ci` clean) | [`qa/backend-evidence.md` §2](backend-evidence.md) + `qa/build-logs/npm-ci.log` |
| 6 | Tests pass in capsule (`npm test`) | `qa/build-logs/test-output.txt` (Manager may re-capture) — current capsule run reports `Test Files 5 passed (5)` / `Tests 33 passed (33)` |
| 7 | Completion gating respected (Manager-only) | This file does not declare plan-done; `tests/qa/manager.sh` exits 0 only on full artifact presence |

---

## 5. Sprint-window PR list capture

A placeholder file `qa/build-logs/sprint-prs.txt` is committed so the
verification script has a stable path to inspect. The Manager replaces
its contents at cutoff with the literal output of:

```
gh pr list --state merged \
  --search "merged:>=<OPEN_TS> merged:<=<CLOSE_TS>" \
  --json number,title,mergedAt,mergeCommit,headRefName,labels
```

If the resulting JSON array contains more than one PR carrying an
implementation label, `tests/qa/manager.sh` exits non-zero on AC #1 and
the plan **cannot** be marked complete.

---

## 6. Files committed alongside this evidence

- `qa/manager-evidence.md` (this file)
- `qa/build-logs/sprint-prs.txt` (placeholder; Manager fills at cutoff)
- `tests/qa/manager.sh` (verification script; exits 0 on PASS)
