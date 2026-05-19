# Stackline Workflow Sprint

An original falling-block browser game, built with vanilla TypeScript + Vite.
The game is the first thing the user sees on the deployed URL — no landing
page, just the board.

## Quick start

```bash
npm ci
npm run dev        # local dev server (Vite)
npm run lint       # ESLint
npm test           # Vitest (engine + DOM smoke)
npm run build      # produces dist/index.html + assets
npm run preview    # serve the built artifact locally
```

## Controls

| Action       | Keyboard                  | Touch              |
|--------------|---------------------------|--------------------|
| Shift left   | `Left arrow`              | `Left` button      |
| Shift right  | `Right arrow`             | `Right` button     |
| Rotate       | `Up arrow` / `X` / `Z`    | Rotate button      |
| Soft drop    | `Down arrow`              | `Down` button      |
| Hard drop    | `Space`                   | `Drop` button      |
| Hold         | `C` / `Shift`             | `Hold` button      |
| Pause/Resume | `P` / `Esc` / Pause btn   | Pause button       |
| Restart      | Restart button            | Restart button     |

The on-screen touch pad appears at narrow viewports (<=480px) so mobile
players have full control without a keyboard.

## HUD

The HUD displays a **ghost piece** projected on the board, a **Hold slot**,
the **next queue** of upcoming pieces, plus **Score**, **Level**, and
**Lines** cleared. Pause and Restart buttons sit alongside the HUD.

## Project layout

```
index.html              # the only entry point (board is first-paint)
src/
  main.ts               # boots the loop, wires DOM + input
  engine.ts             # pure-function game engine (testable)
  render.ts             # canvas rendering
  input.ts              # keyboard + touch handlers
  styles.css            # responsive layout (360/768/1280 + <=480 touch)
tests/
  engine.test.ts        # reducer + scoring + key-mapping unit tests
  dom-smoke.test.ts     # jsdom smoke test for index.html landmarks
.github/workflows/
  pages.yml             # CI: lint -> test -> build -> deploy to GH Pages
ORIGINALITY.md          # checklist confirming no TETR.IO content is copied
```

## CI & Deploy

`.github/workflows/pages.yml` runs on every push to `main`:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build` (with `BASE_PATH=/<repo-name>/` so asset URLs resolve on
   a GitHub Pages project site)
5. Uploads `dist/` as the Pages artifact and deploys it.

Permissions are scoped:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## Responsive layout

The stage uses CSS Grid with breakpoint stacking:

- **1280px**: full three-column layout with both rails visible.
- **768px**: tighter columns; HUD remains beside the board.
- **360-480px**: rails collapse to a two-column row on top with the board
  below, and the on-screen touch pad becomes visible.

## Originality

See [ORIGINALITY.md](./ORIGINALITY.md). All names, art, palette, sounds, and
UI copy are original. The repository contains no TETR.IO names, assets,
branding, trade-dress, or UI copy.
