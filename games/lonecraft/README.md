# Lonecraft

Lonecraft is a clean-room browser reimplementation of the gameplay loop of **Minicraft (2011)** by Markus Persson, created for the GameRoom project.

## Clean-room boundary

The original Minicraft source was published publicly, but the original repository does not provide an explicit software license. Lonecraft therefore does **not** copy or redistribute the original Java source, sprites, sounds, or other assets. The browser implementation, generated world logic, interface, audio synthesis, mobile controls, and gameplay code in this folder are new GameRoom code.

The original game is credited as the design reference for mechanics such as five linked world levels, resource gathering, tiered tools, crafting stations, stamina, slimes/zombies, and the Air Wizard objective.

## 2.1 Sprite Edition

Lonecraft 2.1 replaces the flat code-drawn actors with animated pixel-art sprite sheets while preserving the existing mechanics, hitboxes, saves, world generation, combat, crafting, and AI.

Runtime sprite sources are intentionally limited to assets explicitly released under **CC0 / Public Domain**:

- **Ninja NPC Sprite Sheet** — Superpowers Asset Packs, mirrored on OpenGameArt by josepharaoh99. CC0. Used for the player and as the visual base for the Air Wizard treatment. https://opengameart.org/content/ninja-npc-sprite-sheet
- **Zombie RPG sprites** — Curt. CC0 / Public Domain. https://opengameart.org/content/zombie-rpg-sprites
- **Slimes 32x32** — RodHakGames. CC0. https://opengameart.org/content/slimes-32x32

The original flat renderer remains underneath as a graceful fallback if a sprite image cannot load.

## Controls

- Move: WASD or arrow keys
- Action / attack: C or Space
- Use / inventory: X or Enter
- Cycle equipped item: Q
- Pause: Escape
- Touch devices: on-screen direction and Action/Use controls

## Goal

Gather resources on the Surface, descend through the Dry, Water, and Lava Caves for iron, gold, and gems, craft a Gem Pickaxe, open the hard-rock gate to the Sky, and defeat the Air Wizard.
