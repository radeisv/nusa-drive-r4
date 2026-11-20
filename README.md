# nusa-drive-r4

[![Make GTA 6](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/radeisv/nusa-drive-r4/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/radeisv/nusa-drive-r4/reward.svg)](https://make.fun/bounty/gta6-01)

**Nusa Drive** — a 3D open-world crime game set in Kota Nusa, an original
Indonesian island city at golden hour. Play as Raka, a driver fresh out of
luck: steal the orange Komodo GT, lose the Polisi Nusa heat, and run four
story jobs for Sinta the fixer — from the pier to the airport island.

## What is in the game

- **Open city** — beach boulevard, downtown towers, central plaza, harbour,
  and a bridge to the airport island with a runway, control tower and a
  parked plane. Traffic and pedestrians live on the streets.
- **Drive and steal** — five invented cars (Komodo GT, Badak SUV, Kancil
  Hatch, Elang Coupe, Hiu Sedan). Press E to get in; a parked car you take
  raises your wanted level.
- **Wanted system** — 0–5 stars. Polisi Nusa cruisers chase and ram, give up
  when you escape, and a helicopter with a spotlight joins at 3+ stars.
- **Four story missions** — dialogue, objective beacon, timers and cash
  rewards, from the first car theft to the harbour heist.
- **Combat** — pistol and SMG with muzzle flash and tracers, harbour guards
  with health bars, health and armour pickups.
- **HUD** — mission panel with stage bar and timer, wanted stars, cash,
  respect rank, weapon slots, crew cards, NPC dialogue, coloured circular
  minimap, speed, car condition, nitro and radio.
- **Save** — progress saves to the browser (ESC menu), plus a start screen
  with Continue / New Game.
- **Sound** — fully synthesized WebAudio: engine, sirens, gunshots and a
  looping radio melody. No audio files, no network requests.

## Run it

```sh
npx serve game
# or
node serve.ts
```

Then open http://localhost:8080 — WASD to drive or walk, E to enter a car,
SPACE to brake, SHIFT for nitro, mouse to aim, click to shoot, 1 / 2 to
swap weapons, M for the radio, ESC to pause and save.

Built with three.js (vendored under `game/vendor/`), all art and code
original. No Rockstar or GTA assets of any kind.

https://make.fun/?ref=f62prjm7
