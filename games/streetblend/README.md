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
