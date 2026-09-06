# Lonecraft

Lonecraft is a clean-room browser reimplementation of the gameplay loop of **Minicraft (2011)** by Markus Persson, created for the GameRoom project.

## Clean-room boundary

The original Minicraft source was published publicly, but the original repository does not provide an explicit software license. Lonecraft therefore does **not** copy or redistribute the original Java source, sprites, sounds, or other assets. The browser implementation, generated world logic, interface, audio synthesis, mobile controls, and gameplay code in this folder are new GameRoom code.

The original game is credited as the design reference for mechanics such as five linked world levels, resource gathering, tiered tools, crafting stations, stamina, slimes/zombies, and the Air Wizard objective.

## 2.3 Renderer Rebuild

Lonecraft 2.3 replaces the fragile 2.1/2.2 overlay renderer with calibrated sprite substitution. The old procedural actor is suppressed when its replacement sprite is available, so player, zombie, slime, and boss visuals no longer stack on top of the legacy shapes. Sprite geometry is centralized in `sprite-config.js` and is shared with the Sprite Lab.

Key calibrated source geometry:

- Player: 64x112 source, 4 direction columns x 7 animation rows, 16x16 cells.
- Zombie: 192x256 source, 3 animation columns x 4 direction rows, 64x64 cells.
- Slime: 256x256 source, 8x8 grid, 32x32 cells.
- Air Wizard: separate 32x32 Pixel Mage animation sheet; the boss no longer reuses the player art.
- Trees: dedicated top-down CC0 tree art replaces the old trunk/canopy rectangles when the image is available.

The Air Wizard uses a fixed ground shadow, a small sprite-only hover offset, a magic aura, and casting frames to read as intentionally airborne rather than mis-anchored.

Mobile movement now uses a thumb joystick with 8-way directional output. Desktop keyboard controls are unchanged.

`tests/lonecraft-renderer.mjs` protects the calibrated renderer by asserting that each procedural actor/tree draw is replaced exactly once and uses the expected source and render dimensions.

## Sprite Lab

`sprite-lab.html` is the visual calibration utility for inspecting source sheets, grid dimensions, source rectangles, animation rows/columns, render size, anchors, and collision placement before values are moved into the game.

## Art sources

Runtime sprite sources are intentionally limited to assets explicitly released under **CC0 / Public Domain**:

- **Ninja NPC Sprite Sheet** — Superpowers Asset Packs, mirrored on OpenGameArt by josepharaoh99. CC0. Player sprite. https://opengameart.org/content/ninja-npc-sprite-sheet
- **Zombie RPG sprites** — Curt. CC0 / Public Domain. https://opengameart.org/content/zombie-rpg-sprites
- **Slimes 32x32** — RodHakGames. CC0. https://opengameart.org/content/slimes-32x32
- **Pixel Mage** — tbbk. CC0. Air Wizard visual. https://opengameart.org/content/pixel-mage
- **Tree 16x16** — isaiah658. CC0. Surface tree visuals. https://opengameart.org/content/tree-16x16

The original flat actor/tree rendering remains available as a graceful fallback when an external sprite image has not loaded.

## Controls

- Move: WASD or arrow keys
- Action / attack: C or Space
- Use / inventory: X or Enter
- Cycle equipped item: Q
- Pause: Escape
- Touch devices: thumb joystick plus Action/Use controls

## Goal

Gather resources on the Surface, descend through the Dry, Water, and Lava Caves for iron, gold, and gems, craft a Gem Pickaxe, open the hard-rock gate to the Sky, and defeat the Air Wizard.
