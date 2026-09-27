# Streetblend Multiplayer Protocol

Streetblend 2.0 uses a host-authoritative WebRTC session. Gameplay state is never advanced by a client independently.

## Authority

The host owns:

- round number and role assignment
- phase transitions
- selected artwork
- accepted Hider figure
- timer start, pause, resume, and expiry
- guesses and penalties
- scoring and reveal results

Guests send actions. They do not directly mutate authoritative game state.

## Round state machine

A round follows one legal path:

```
LOBBY
  -> HIDE_PREPARE
  -> HIDE
  -> SEEK_PREPARE
  -> SEEK
  -> REVEAL
  -> HIDE_PREPARE (next round)
  -> FINAL (after last round)
```

Illegal transitions are rejected.

### HIDE_PREPARE

The host selects one artwork and sends the exact scene to every active seat.

The round does not enter HIDE until every required seat has loaded and rendered that scene.

### HIDE

The Hider's timer does not start merely because the host entered HIDE. The Hider's device must first acknowledge that the active HIDE state was applied.

Only the active Hider may send draft or lock actions.

### SEEK_PREPARE

Locking the hiding spot does **not** start the Seek timer.

The host freezes the final figure, enters SEEK_PREPARE, and sends the final camouflage asset to the Seeker. The Seeker must load the artwork, import the final painted figure, render the search view, and report readiness.

### SEEK

After SEEK_PREPARE readiness, the host publishes SEEK. The Seek timer begins only after every active Seeker seat has applied that SEEK state.

Only active Seeker seats may submit guesses.

### REVEAL

The host calculates the result and publishes REVEAL. The host cannot advance to the next round until all active remote seats have acknowledged that Reveal state.

## State identity

Every host state has:

- `round`
- `phase`
- `phaseToken`
- monotonically increasing `syncSeq`

Guests ignore older revisions. Asynchronous image/figure rendering is cancellable: a newer revision invalidates an older in-progress UI render.

Every gameplay action includes the round and phase token it belongs to. A late action from an older phase is rejected and causes a targeted authoritative resync.

## Reliable critical actions

Critical guest actions have an `actionId`.

Examples:

- Lock Hiding Spot
- Guess

The guest retries an unacknowledged critical action. The host deduplicates action IDs, so retrying cannot apply a lock, guess, score, or penalty twice.

The host acknowledges an action only after processing it. Duplicate retries receive the same acknowledgement without being processed again.

## Readiness and acknowledgement recovery

Readiness and state acknowledgement do not depend on a single packet.

The host sends a heartbeat approximately once per second. Guests respond with:

- latest fully applied state sequence
- current phase-readiness token

Therefore a dropped standalone ready or ACK packet is repaired automatically by the next heartbeat exchange.

## Connection recovery

Guests have a stable per-room player identity stored for the browser tab.

On reconnect:

1. The transport reclaims the player's previous seat.
2. A stale previous connection for that identity is replaced.
3. The host sends that seat a full recovery snapshot.
4. The game remains paused while that state is rendered.
5. The timer resumes only after the reconnecting seat acknowledges the recovery state.

A stale old connection cannot later remove the newly reclaimed seat.

## Heartbeat failure

The host tracks the last message received from each connected seat.

During a timed phase:

- an unresponsive player pauses the authoritative timer;
- a prolonged stale connection is closed so automatic reconnect can establish a fresh WebRTC channel.

Guests also track the host heartbeat. A late heartbeat triggers a state resync; a sufficiently stale channel triggers a forced reconnect.

## Mobile lifecycle

If the host page is backgrounded during a timed turn, Streetblend pauses the authoritative timer before suspension when the browser delivers the visibility event.

When the page returns, current state is resynchronized before the timer resumes.

Network offline/online events use the same pause/recovery path.

## Payload strategy

Routine state snapshots contain only dynamic gameplay information and lightweight player name/score data.

Large assets are separated:

- avatar images use dedicated avatar messages;
- the final painted Hider figure is sent at SEEK_PREPARE and explicit recovery, rather than on every timer/guess state update.

This becomes increasingly important as player count grows.

## Future multiple-player support

Synchronization bookkeeping is seat-based rather than hard-coded to Player 2.

The flow model supports:

- `activeSeats`
- multiple `hiderSeats`
- multiple `seekerSeats`
- readiness barriers across multiple seats
- timer activation only after all active role screens are applied
- Reveal acknowledgement across all active remote seats

Classic mode currently exposes two players. A future multiplayer mode must define role assignment/scoring rules, but it should use this protocol rather than creating a second synchronization path.

## Known P2P limitation

There is no server-hosted authoritative game process and no host migration yet.

Transient host/guest network interruptions, stale channels, backgrounding, and guest reconnection are recoverable. If the host page is fully closed or the host device disappears permanently, the current match cannot continue on another device.

Adding true host migration would require either:

- replicating authoritative state to one or more standby peers with an election protocol, or
- moving authoritative session state to a small hosted backend.

Until one of those is implemented, Streetblend should clearly treat the host as the session owner.
