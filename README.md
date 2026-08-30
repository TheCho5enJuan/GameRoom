# GameRoom

A static GitHub Pages launcher for the browser games in this repository. Every game runs directly in the browser with no server-side dependency.

## Games

| Game | Path | Build layout |
|---|---|---|
| Rogue Quest | `games/rogue-quest/` | Modular HTML / CSS / JavaScript |
| Tide & Tranquility | `games/tide-and-tranquility/` | Modular HTML / CSS / JavaScript |
| Blockforge: Deep Mine | `games/blockforge/` | Modular HTML / CSS / JavaScript |
| Space Sabotage | `games/space-sabotage/` | Single-file build |
| Deal or No Deal | `games/deal-or-no-deal/` | Single-file build |
| Ultimate Tic Tac Toe | `games/tic-tac-toe/` | Single-file build |

## Repository structure

```text
GameRoom/
├─ index.html                       # Game launcher
├─ README.md
└─ games/
   ├─ rogue-quest/
   │  ├─ index.html
   │  ├─ build-manifest.json
   │  ├─ css/
   │  │  └─ game.css
   │  └─ js/
   │     ├─ game-01.js
   │     ├─ game-02.js
   │     ├─ game-03.js
   │     └─ game-04.js
   ├─ tide-and-tranquility/
   │  ├─ index.html
   │  ├─ build-manifest.json
   │  ├─ css/game.css
   │  └─ js/game-01.js ... game-05.js
   ├─ blockforge/
   │  ├─ index.html
   │  ├─ build-manifest.json
   │  ├─ css/game.css
   │  └─ js/game-01.js ... game-03.js
   ├─ space-sabotage/index.html
   ├─ deal-or-no-deal/index.html
   └─ tic-tac-toe/index.html
```

## Working on a large game

The three largest games are intentionally split into normal web-project files instead of one very large HTML document.

- `index.html` contains the page markup and loads the assets.
- `css/game.css` contains the extracted styles.
- `js/game-XX.js` files contain the original JavaScript in execution order.
- `build-manifest.json` records the SHA-256 of the exact uploaded source and the ordered script list used by the build.

Keep the JavaScript files in the order listed by `build-manifest.json` and by the `<script>` tags in `index.html`. The split points were chosen only where each resulting classic script is syntactically valid, and concatenating the JavaScript chunks reproduces the extracted source script body exactly.

## Validation

GitHub Actions validates the launcher, all six game entry points, JavaScript syntax, modular asset references, script ordering, and the script-body hashes stored in the build manifests.
