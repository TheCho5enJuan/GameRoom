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

Artwork metadata is loaded at runtime from the **Art Institute of Chicago Open Access API**. Streetblend requests curated artwork searches and only accepts records where:

- `is_public_domain === true`
- an `image_id` exists
- the artwork is not marked non-zoomable

Images are displayed from the Art Institute IIIF image service. Each active scene links back to its Art Institute artwork record.

Curated search targets currently include:

- Paris Street; Rainy Day
- A Sunday on La Grande Jatte
- Arrival of the Normandy Train, Gare Saint-Lazare
- The Child's Bath
- The Bedroom
- Cliff Walk at Pourville
- Water Lilies
- At the Moulin Rouge

The runtime rights check is deliberate: a title being present in a museum collection is not treated as sufficient permission by itself.

## Files

- `index.html` — UI shell
- `styles.css` — responsive layout
- `game.js` — artwork loading, canvas rendering, painting tools, multiplayer and scoring
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

