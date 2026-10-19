# TIME KILL — Combat Prototype 001

A browser-first, combat-focused FPS prototype. The arena is intentionally simple: the priority is responsive movement, aiming, enemy attack telegraphs, hit feedback, and surviving waves.

## Requirements
- Node.js 20.19+ or 22.12+
- npm
- Desktop browser with mouse

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints in your terminal.

## Controls
- **WASD** — move
- **Mouse** — aim
- **Left click** — fire Rivet automatic weapon
- **Shift** — sprint
- **Space** — jump
- **Q** — dash (cooldown)
- **Esc** — release mouse / pause
- **R** — retry after death

## Current prototype scope
- Procedurally generated arena and clock enemies
- First-person camera with pointer lock
- Hitscan weapon, hit markers, muzzle flash and procedural sound
- Chasing enemies with a visible wind-up before melee attacks
- Health, score, kills and escalating waves
- Dash, jump and sprint

## Intentionally not included yet
- Full physics simulation
- Enemy ranged attacks
- Weapon switching / upgrades
- Save system, story, elaborate level art or multiplayer

## Audio
All weapon and gameplay sounds are synthesized locally with the Web Audio API in `src/main.js`; no recording or downloaded audio asset is used. The Rivet shot layers short noise bursts, low body tones and a quiet mechanical tail, with small per-shot variation and output compression. Reload handling, magazine insertion, empty trigger, enemy impact, player damage and enemy death each have distinct synthesized cues. Audio is initialized or resumed from the start button interaction and is only played in response to game events.

There are no third-party audio assets to attribute. A licensed pistol recording was considered, but could not be downloaded and verified for bundling, so the sound remains synthesized.

## Tech
Vite + JavaScript + Three.js. The game has no required backend or external API. The CSS references Google Fonts for visual polish; if you want absolutely no network requests, remove the `@import` line in `src/style.css` and system fallback fonts will be used.

## Next milestone
Playtest movement, shooting, enemy speed, and damage. Then tune the feel before adding the second enemy type or shotgun.
