# Streetblend

Streetblend is a two-player remote camouflage game for GameRoom.

## Gameplay

- Roles alternate between **Hider** and **Seeker**.
- The Hider receives a close-up view of a painting, positions a small figure, samples colors from the artwork, and paints the figure.
- The Seeker starts with the full painting and can pan and zoom to search.
- A wrong guess removes 5 seconds from the seek clock.
- A successful find rewards the Seeker based on time remaining; the Hider earns points for time survived and wrong guesses.
- Match lengths of 2, 4, or 6 rounds are supported.
- A solo practice mode is included for testing the camouflage tools.

## Remote rooms

Streetblend uses the shared GameRoom PeerJS/WebRTC room layer. The host creates a six-character room code and shares an invite URL containing `?room=XXXXXX`.

The host is authoritative for:
- phase changes
- round timers
- role assignment
- guesses
- scoring

## Artwork source and rights filter

Streetblend builds its runtime catalog from **Wikimedia Commons**. Search results are filtered to public-domain/CC0-compatible metadata, require a usable image file and minimum dimensions, and are deduplicated before entering the randomized deck.

Artwork categories currently include Mixed Collection, Impressionism, Landscapes, City & Street, Interiors, People & Markets, Water & Coast, and Gardens & Parks. A successful category catalog is cached locally for seven days.

The game attempts a CORS-enabled image load first so the eyedropper can read source pixels. If pixel access is unavailable, it falls back to normal image display so the round can still render.

## Files

- `index.html` — UI shell
- `styles.css` — responsive layout
- `art-library.js` — public-domain catalog discovery, caching, and secure deck shuffle
- `settings.js` / `settings-ui.js` — persisted rules and settings interface
- `flow.js` — legal phases, role seats, readiness barriers, and action validation
- `view-ui.js` — scoreboard, clocks, reveal/final displays, and stage messages
- `avatar-studio.js` — masked waiting-room player-icon painter
- `sample-utils.js` — brush-aware color aggregation and eyedropper loupe
- `game.js` — gameplay orchestration, canvas interaction, scoring, and authoritative session coordination
- `MULTIPLAYER.md` — Streetblend multiplayer protocol and failure/recovery contract
- `game.json` — machine-readable game metadata

## Image delivery

Streetblend v1.0.3 uses a curated set of public-domain reproductions hosted by Wikimedia Commons. The selected works are from the Art Institute of Chicago collection, but the game no longer depends on the museum's IIIF service or artwork API during a match.

Each scene first attempts a CORS-enabled Wikimedia image load so the eyedropper can read image pixels. If pixel access is blocked, Streetblend retries the same image as a normal browser image so gameplay can continue; the paint swatch remains available as a manual color picker.

The current catalog includes Paris Street; Rainy Day, A Sunday on La Grande Jatte, Water Lilies, Two Sisters, The Child's Bath, Arrival of the Normandy Train, and The Bedroom.

## Touch controls (v1.1.0)

### Hider
- Drag the figure directly to move it.
- Pinch on the figure to resize it; twisting the pinch rotates it.
- Drag the painting background to pan.
- Pinch the painting background to zoom.
- Use **Sample** to pick a color and **Paint** to camouflage the figure.
- Figure height is constrained to 8%–18% of the source image height so it cannot become microscopic.

### Seeker
- Drag to pan.
- Pinch to zoom.
- Quick tap to guess.
- A wrong guess removes 5 seconds from the seek timer. It does not directly subtract score points.


## Start screen and settings

Streetblend v1.2.0 uses a menu-style start screen with Create Game, Join Game, Practice, and Settings.

Host settings are saved locally and copied into each newly created match. Current configurable rules are:

- match length: 2, 4, or 6 rounds
- hide timer: 30, 45, 60, 75, or 90 seconds
- seek timer: 45, 60, 90, 120, or 150 seconds
- wrong-guess penalty: no penalty or a configurable time penalty of 3, 5, 10, or 15 seconds

The settings model already includes game mode and player count. Classic currently supports two players; additional modes/player counts are surfaced as coming-soon options rather than pretending they are playable.


## v1.3 artwork pool and figure builds

Streetblend now builds a public-domain artwork catalog from Wikimedia Commons rather than relying on only the seven seed scenes. It searches multiple painting genres and public-domain master-painter queries, filters Commons metadata to public-domain/CC0 files, requires usable image dimensions, deduplicates results, and caches a successful catalog for seven days.

The target catalog is at least 50 paintings. Match selection uses a cryptographically shuffled deck: every discovered scene is used once before the deck reshuffles, and the first scene of a new deck is prevented from immediately repeating the previous scene.

Hider figures now support Slim, Regular, and Bold builds. Minimum figure height was raised to 10% of the source painting height, the default is 14%, and the maximum is 24%. Figure build affects silhouette thickness, rendered width, painting hit-testing, and Seeker hit detection.

## v1.4 hider control refinements

Streetblend now provides explicit player-focused manipulation controls:

- **Focus Player** centers and zooms tightly around the selected figure.
- **Fit Artwork** returns to the full painting.
- The player selection box has interactive **ROTATE** and **SIZE** handles.
- Dragging the body moves the player.
- Two-finger pinch/twist remains supported for resize and rotation.
- Sample mode supports a quick tap or long-press-and-slide continuous sampling.
- Continuous sampling displays a magnified color loupe with a crosshair and the current hex color.
- Sampling no longer automatically switches into Paint mode, allowing several colors to be inspected before painting.

## v1.5 waiting-room player icons

Streetblend now gives the inactive player a lightweight drawing activity instead of a passive waiting screen.

- While the Hider prepares the scene, the Seeker can color and draw their personal icon.
- Once the hunt begins, the Hider sees the Seeker's completed icon while waiting for the search.
- During that same search period, the Hider can customize their own icon.
- Player icons synchronize over the room connection and appear beside player names in the match header.
- The studio provides freehand color drawing, brush size, eraser, and reset controls.

## v1.5.1 brush-aware eyedropper

The Sample tool now uses the same brush-size control to determine its source-pixel sampling footprint.

- Brush size 1 samples one exact source pixel.
- Larger brush sizes use a circular source-pixel area with the brush-size value as the sampling diameter.
- RGB values from all non-transparent pixels inside that circle are averaged into one sampled color.
- The sampling loupe shows the active footprint and the resulting aggregate hex color.
- The central DRAG label was removed from the selected player box; direct drag behavior remains unchanged.

## v1.6 control and visual audit

Streetblend v1.6 received a full control/visual pass.

- Hider primary tools remain only Place, Sample, and Paint.
- Pose and Build were reduced from seven separate buttons to two compact selectors.
- Focus Player and Fit Artwork were moved from the control panel onto the artwork as small floating view controls.
- Transform handles and the player selection box are visible only in Place mode, keeping Sample and Paint visually clean.
- The player is clamped fully inside the source artwork so a hiding position cannot be moved partly off-canvas.
- The paint-color swatch is a real button for manual color selection.
- Brush size now displays its live pixel value because the same value controls eyedropper aggregation.
- Commons titles/artist/year metadata are sanitized before display, and the artwork cache version was advanced so old malformed metadata is discarded.
- Obsolete lobby CSS was removed.
- Streetblend is included in the repository validation suite, including a control-ID integrity check for missing/duplicate DOM IDs.

## v1.7 painting workflow and artwork categories

- Releasing a sampled color now automatically switches the Hider into Paint mode.
- Manual color selection also switches directly into Paint mode.
- Paint opacity is adjustable from 10% to 100% in 5% steps.
- The former Reset White / Clear Paint control was removed.
- Host Settings now include an Artwork category. Available categories are Mixed Collection, Impressionism, Landscapes, City & Street, Interiors, People & Markets, Water & Coast, and Gardens & Parks.
- Each category builds and caches its own randomized public-domain Wikimedia Commons pool. Mixed Collection continues to use the curated seed paintings as fallbacks.

## v1.8 multiplayer synchronization, avatar painting, and longer timers

- Multiplayer round state is host-authoritative and every full state snapshot carries a sequence number.
- Older state snapshots are ignored, and asynchronous artwork/figure renders are cancelled if a newer round or phase arrives while they are still loading.
- Timer packets include their round and phase. A guest that reaches 0:00 without receiving a transition requests an immediate full-state resync from the host.
- The host's Next Round button stays blocked until the guest has received and rendered the Reveal state, preventing one device from advancing while the other is still on the previous search.
- A reconnecting guest resumes the existing match instead of causing the host to create a new lobby state.
- Waiting-room avatar paint is clipped to the white player silhouette. The canvas is larger and paint outside the player is discarded.
- The hidden opponent-icon block is now truly hidden when it is not supposed to be shown.
- Default Hide time is now 3 minutes and default Seek time is 4 minutes.
- Hide time choices extend from 1 to 10 minutes; Seek choices extend from 1:30 to 10 minutes.
- Existing v1.7 settings are migrated so rounds, penalties, and artwork category are preserved while the timer defaults are upgraded.

## v2.0 authoritative multiplayer revamp

Streetblend 2.0 replaces the earlier optimistic two-phone synchronization with an explicit host-authoritative session protocol.

### Round barriers

The legal flow is:

`LOBBY → HIDE_PREPARE → HIDE → SEEK_PREPARE → SEEK → REVEAL → next round / FINAL`

- **HIDE_PREPARE:** every required seat must load and render the same painting before hiding begins.
- **HIDE:** the timer starts only after the active Hider screen has applied the phase.
- **SEEK_PREPARE:** locking the Hider does not start the search. The Seeker must first load the final painted figure and render the search view.
- **SEEK:** the timer begins only after every active Seeker screen acknowledges the Seek state.
- **REVEAL:** the host cannot advance until all active remote seats have rendered the result.

### Self-healing session messages

- Every state uses a monotonically increasing revision plus round and phase token.
- Late/stale actions are rejected and receive a targeted authoritative resync.
- Lock and Guess actions carry IDs, are acknowledged after host processing, retried if necessary, and deduplicated by the host.
- Heartbeat replies repeat each seat's latest fully applied state and readiness token, so a single lost ACK or ready message cannot permanently freeze a turn.

### Connection recovery

- A guest keeps a stable identity for the room and reclaims the same seat after reconnect.
- Stale WebRTC channels are replaced without letting the old channel later remove the new seat.
- Timed play pauses when a player disconnects or stops responding.
- Guests detect a stale host heartbeat, request a resync, and eventually force a fresh WebRTC connection if required.
- Mobile background/offline events use the same pause-and-resynchronize path.

### Future player counts

Readiness and acknowledgement tracking are seat-based, not hard-coded to Player 2. The flow module already accepts multiple Hider and Seeker seat arrays, although Classic mode still exposes exactly two players until multiplayer role/scoring rules are designed.

### Remaining P2P limitation

The host remains the authoritative session owner. Transient host/guest network failures are recoverable, but **true host migration is not implemented**. If the host page/device permanently exits, the match cannot continue on another peer without either a host-election protocol or a small authoritative backend.

See [MULTIPLAYER.md](./MULTIPLAYER.md) for the protocol contract.
