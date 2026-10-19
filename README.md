# TIME KILL — Combat Prototype 001

A browser-first, combat-focused FPS prototype built around responsive movement, readable attacks, and escalating waves of clockwork enemies. Gameplay, models, effects, and sounds are generated locally.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- Desktop browser with mouse and pointer lock

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints in your terminal.

## Controls

- **WASD** — move
- **Mouse** — aim
- **Left click** — fire the Rivet pistol
- **R** — reload during combat; retry after defeat
- **Shift** — sprint
- **Space** — jump
- **Q** — dash (cooldown)
- **Esc** — release the mouse and pause

The Rivet has a 7-round magazine and unlimited reserve ammunition. Reloads take about 1.35 seconds. Firing is disabled during the reload animation.

## Current prototype scope

- First-person camera with pointer lock, sprint, jump, and dash
- Procedurally built arena, cover props, lighting, and clock-themed enemy models
- Hitscan Rivet pistol with recoil, muzzle flash, hit markers, and an animated reload with a removable procedural magazine
- Three enemy archetypes introduced over successive waves:
  - **Runner:** small, fast melee attacker with low health and a short attack wind-up
  - **Tank:** heavily armored, high-health attacker that leaps toward the player, uses a slower close-range attack, and takes extra damage during its recovery window
  - **Striker:** ranged attacker that maintains distance, strafes to seek a firing lane, and launches slow, slightly homing projectiles after a clear telegraph
- Striker shots are checked against arena walls before launch and during flight
- Health, kills, score, enemy counts, and increasing wave sizes
- Locally synthesized Web Audio effects for firing, reloading, magazine insertion, empty trigger pulls, impacts, damage, and deaths

Runners appear first; tanks join in wave 3 and strikers in wave 5. Each wave increases the enemy count up to the current cap, and the archetype mix grows gradually in later waves.

## Current limitations

- Cover props are visual only; they do not block player or enemy movement or shots
- No full physics simulation, weapon switching, upgrades, save system, story, or multiplayer
- No third-party audio files are bundled. Sounds are synthesized with the Web Audio API and audio begins after the player interacts with the start screen

## Audio assets and licensing

There are no third-party audio assets to attribute. The Rivet gunshot and all other gameplay cues are synthesized in `src/main.js`; no remote audio URLs or runtime audio services are used.

## Tech

Vite + JavaScript + Three.js. No backend or external gameplay APIs are required. The CSS references Google Fonts for visual polish; remove the `@import` line in `src/style.css` to use system fonts without that font request.

## Next milestone

**Combat balance and functional cover.** Playtest the early and mid-game waves, tune enemy health, damage, telegraphs, and spawn ratios, then add movement and shot collision for the existing cover props so players can use them to break Striker firing lanes.
