# GameRoom

A static GitHub Pages arcade containing six browser games. Each game is an independent project under `games/<slug>/`.

## Games

- Ultimate Tic Tac Toe
- Space Sabotage
- Deal or No Deal
- Rogue Quest
- Tide & Tranquility
- Blockforge: Deep Mine

## Architecture

The three largest games are organized by domain rather than by arbitrary file size. Their state, gameplay systems, rendering, interface, input, and version-specific features live in named files. Smaller games use the same approach at a scale appropriate to their codebase.

There is no server dependency and no bundling step. GitHub Pages serves the checked-in HTML, CSS, and JavaScript directly.

## Validation

Run:

```bash
node tests/validate.mjs
node tests/smoke.mjs
```
