# GameRoom

A single static launcher for my browser games.

## Library

| Game | Latest build located | Repo path | Status |
|---|---|---|---|
| Rogue Quest | `RogueQuest_Production_v3_1.html` | `games/rogue-quest/index.html` | Source located; migration pending |
| Tide & Tranquility | `TideAndTranquility_Professional_v10_1.html` | `games/tide-and-tranquility/index.html` | Source located; migration pending |
| Mining Game | — | `games/mining-game/index.html` | Latest source still needed |

## Structure

```text
GameRoom/
├─ index.html
└─ games/
   ├─ rogue-quest/
   │  └─ index.html
   ├─ tide-and-tranquility/
   │  └─ index.html
   └─ mining-game/
      └─ index.html
```

The launcher and games are intended to remain plain HTML/CSS/JavaScript with no server dependency.
