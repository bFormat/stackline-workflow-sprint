# Originality Checklist — Stackline Workflow Sprint

This document is an audit trail confirming that Stackline Workflow Sprint contains
no content copied from TETR.IO (the third-party falling-block game at tetr.io).
The game shares only the unprotectable mechanic of placing falling tetromino-shaped
pieces on a 10×20 grid to clear horizontal rows — the same public-domain mechanic
predating any modern stacker. All code, names, palette, copy, sounds, and UI
chrome were authored from scratch for this repository.

## What I checked

- [x] **Project & game name.** "Stackline Workflow Sprint" is original to this
      repository. Neither "Stackline", "Workflow Sprint", nor the combined name
      is used by TETR.IO. No TETR.IO branding, logos, marks, or trade-dress are
      reproduced.
- [x] **Piece names.** Pieces are named `LINE`, `SQUARE`, `WEDGE`, `ZIG`, `ZAG`,
      `HOOK`, `CRANK`. No SRS-letter ("I/O/T/S/Z/L/J") branding is rendered to
      the user. The single-letter shape mnemonics are unprotectable industry
      convention; they do not appear as on-screen names in this game.
- [x] **Color palette.** The seven piece colors (`#f25f5c`, `#ffe066`, `#a78bfa`,
      `#4ade80`, `#f97316`, `#38bdf8`, `#ec4899`) were selected for this project
      and do not replicate TETR.IO's palette or any of its skin packs.
- [x] **Art / sprites.** There are no bitmap or vector sprites copied from any
      third party. Pieces are drawn in code with simple rectangles, a top
      highlight band, and a bottom shadow band — all from `src/render.ts`.
- [x] **Sounds / music.** The game ships no audio assets. There are no audio
      file references in the bundle. No sound cues are copied from TETR.IO.
- [x] **UI copy.** All on-screen copy ("Stackline Workflow Sprint", "Press any
      key or tap to begin", "Stack lines — sprint a fresh run", labels for
      Hold/Next/Score/Level/Lines/Pause/Restart) was written for this repo.
      No TETR.IO menu copy, tooltips, lobby strings, or marketing taglines
      were used.
- [x] **Trade dress.** Layout (a centered playfield with a left rail for
      Hold/HUD and a right rail for Next) is a common convention shared by
      decades of falling-block games and is not unique to TETR.IO. The visual
      treatment (dark gradient background, rounded rails, soft glow, two-stop
      title gradient from teal to violet) was designed for this project.
- [x] **Game modes / menus.** No copy of TETR.IO modes, menus, profile UI,
      multiplayer flows, garbage rules, or zen modes is present. The game is a
      single solo "sprint" with level-up gravity and standard line scoring.
- [x] **Mechanics.** The 7-bag piece sequencer and the line-clear score
      schedule (`100, 300, 500, 800` per 1–4 lines × level) are commonly used,
      pre-existing falling-block mechanics that predate and are independent of
      TETR.IO. Their implementation here is original code in `src/engine.ts`.
- [x] **Source files audit.** A repository-wide search for the strings
      `tetr`, `TETR`, `tetrio`, `Tetrio`, `TETR.IO` returns no hits in any
      source, asset, configuration, or markup file.

## Source authorship

All TypeScript, CSS, HTML, and CI workflow files in this repository were
authored as new work for the Stackline Workflow Sprint capsule. No code was
copied from TETR.IO, its open-source clones, or any commercial stacker.

## Re-verification

To re-run the textual portion of this audit:

```bash
grep -r -i -nE 'tetr(\\.io|io)?' . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude=ORIGINALITY.md
```

The expected result is no matches outside this file.
