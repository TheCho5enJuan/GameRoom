/* Space Sabotage state and crisis deck */
'use strict';
const Game = {
state: 'INIT',
gameMode: 'TABLETOP',
currentPlayerIndex: 0,
players: [],
hull: 3,
maxHull: 3,
round: 1,
maxRounds: 5,
timeLeft: 45,
timerPaused: false,
timerInt: null,
hbTimeout: null,
captainId: 0,
benchedId: null,
silenceEnforced: false,
crisesDeck: [
            { name: "OXYGEN LEAK", dmg: 1, effect: "Standard" },
            { name: "REACTOR MELTDOWN", dmg: 2, effect: "High Damage" },
            { name: "COMMS BLACKOUT", dmg: 1, effect: "Silence Enforced" },
            { name: "NAV FAILURE", dmg: 1, effect: "Standard" },
            { name: "HULL BREACH", dmg: 1, effect: "Standard" }
        ],
currentCrisis: null
};
