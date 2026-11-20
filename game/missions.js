// Missions: 4 story jobs in sequence — dialogue, objective marker, timer,
// cash rewards and progression. Sinta the fixer calls the shots.
import { raiseWanted } from './police.js';
import { playCash } from './audio.js';

export const MISSIONS = [
  {
    chapter: 'CHAPTER 1 · FIRST LIGHT',
    title: 'MEET SINTA AT THE PIER',
    stages: [
      { objective: 'Drive to the yellow marker on Pantai Boulevard', next: 'Talk to Sinta', say: ['SINTA · FIXER', 'Raka! You finally made it. The Komodo GT is yours — if you can lose the cops who want it back.'] },
      { objective: 'Steal the orange Komodo GT parked by the pier', next: 'Get in the Komodo GT', say: ['SINTA · FIXER', 'Orange, parked by the pier. Keys are in it. Take it — and do not get caught, sayang.'] },
      { objective: 'Lose the heat — escape the police search zone', next: 'Reach Garage 7 downtown', say: ['SINTA · FIXER', 'They are on you! Shake them off before you come near my garage.'] },
      { objective: 'Park the Komodo GT inside Garage 7', next: 'Mission complete', say: ['SINTA · FIXER', 'Clean. The crew is yours now, Raka. Welcome to Kota Nusa.'] },
    ],
    reward: 2400,
    timer: 300,
  },
  {
    chapter: 'CHAPTER 2 · THE BIG ONE',
    title: 'THE AIRPORT RUN',
    stages: [
      { objective: 'Meet Bayu at the airport bridge', next: 'Talk to Bayu', say: ['BAYU · MECHANIC', 'The plane lands in ten minutes. We grab the cargo, you drive. No heroes.'] },
      { objective: 'Drive across the bridge to the airport island', next: 'Reach the terminal', say: ['SINTA · FIXER', 'Bridge is clear — for now. Keep it under the speed limit, funny guy.'] },
      { objective: 'Grab the cargo crate at the terminal', next: 'Pick up the crate', say: ['BAYU · MECHANIC', 'Crate is heavy, crate is ours. Move! The tower called security.'] },
      { objective: 'Escape the airport with 3 stars and reach the plaza', next: 'Lose the heat', say: ['SINTA · FIXER', 'Three stars and a crate of gold. You drive like the island owes you.'] },
    ],
    reward: 5200,
    timer: 360,
  },
  {
    chapter: 'CHAPTER 3 · STREET HEAT',
    title: 'THE BEACH RACE',
    stages: [
      { objective: 'Meet Kiki at the beach start line', next: 'Talk to Kiki', say: ['KIKI · LOOKOUT', 'Three laps of the boulevard, Raka. Beat Hiu-3 or walk home.'] },
      { objective: 'Race Hiu-3 down Pantai Boulevard', next: 'Stay ahead of the rival', say: ['KIKI · LOOKOUT', 'He is on your bumper! Nitro on the straight, brake late!'] },
      { objective: 'Win the race at the pier finish line', next: 'Cross the finish', say: ['KIKI · LOOKOUT', 'One more corner! The whole beach is watching you!'] },
      { objective: 'Collect the race winnings at the pier', next: 'Mission complete', say: ['SINTA · FIXER', 'Beach champion. The crews will remember this night.'] },
    ],
    reward: 6800,
    timer: 240,
  },
  {
    chapter: 'CHAPTER 4 · THE BIG ONE',
    title: 'THE HARBOUR HEIST',
    stages: [
      { objective: 'Meet the crew at the harbour warehouse', next: 'Talk to Sinta', say: ['SINTA · FIXER', 'Last job, Raka. The harbour vault, the guards, the boat. Then we are free.'] },
      { objective: 'Fight through the harbour guards', next: 'Guards down: 0/4', say: ['BAYU · MECHANIC', 'Guards incoming! Keep your head down and your finger ready.'] },
      { objective: 'Grab the vault cash and reach the boat', next: 'Reach the boat at the pier', say: ['SINTA · FIXER', 'Cash is ours! The boat leaves in two minutes — RUN!'] },
      { objective: 'Escape with the cash — lose the 5-star heat', next: 'Mission complete', say: ['SINTA · FIXER', 'Kota Nusa is ours now, Raka. Drive into the sunset.'] },
    ],
    reward: 12000,
    timer: 420,
  },
];

const STAGE_SPOTS = [
  // mission 1 spots: pier, parked car, escape zone, garage
  [[-118, 20], [-112, -20], [40, -40], [38, -38]],
  // mission 2: bridge, airport, terminal, plaza
  [[158, 60], [196, 60], [178, 60], [0, 0]],
  // mission 3: beach, boulevard, pier, pier
  [[-150, 60], [-120, -60], [-118, 20], [-118, 20]],
  // mission 4: harbour, guards, pier, boat
  [[-118, 100], [-118, 90], [-118, 20], [-118, 30]],
];

export function startMission(G, index) {
  const m = MISSIONS[index % MISSIONS.length];
  G.mission.index = index % MISSIONS.length;
  G.mission.stage = 0;
  G.mission.timer = m.timer;
  G.mission.active = true;
  G.beacon.visible = true;
  moveBeaconToStage(G);
  sayLine(G, m.stages[0].say[0], m.stages[0].say[1]);
  G.toast(m.chapter + ' — ' + m.title);
}

export function moveBeaconToStage(G) {
  const spots = STAGE_SPOTS[G.mission.index] || STAGE_SPOTS[0];
  const spot = spots[G.mission.stage] || spots[0];
  G.beacon.position.set(spot[0], 0, spot[1]);
  G.mission.target = { x: spot[0], z: spot[1] };
}

export function sayLine(G, name, text) {
  G.dialogue = { name, text, t: 7 };
}

export function currentMissionDef(G) {
  return MISSIONS[G.mission.index % MISSIONS.length];
}

export function advanceStage(G) {
  const m = currentMissionDef(G);
  G.mission.stage++;
  if (G.mission.stage >= m.stages.length) {
    completeMission(G);
    return;
  }
  moveBeaconToStage(G);
  const stage = m.stages[G.mission.stage];
  sayLine(G, stage.say[0], stage.say[1]);
  G.flashObjective(stage.objective);
  playCash();
  // mission 2 stage 3 and mission 4 stage 2 raise the heat
  if (G.mission.index === 1 && G.mission.stage === 2) raiseWanted(G, 3);
  if (G.mission.index === 3 && G.mission.stage === 1) raiseWanted(G, 2);
  if (G.mission.index === 3 && G.mission.stage === 3) raiseWanted(G, 2);
}

export function completeMission(G) {
  const m = currentMissionDef(G);
  G.cash += m.reward;
  G.respect += 160;
  G.mission.done[G.mission.index] = true;
  G.mission.active = false;
  G.beacon.visible = false;
  playCash();
  G.toast('MISSION COMPLETE — +$' + m.reward.toLocaleString());
  sayLine(G, 'SINTA · FIXER', 'Job done, Raka. $' + m.reward.toLocaleString('en-US') + ' is yours. The island is talking about you.');
  if (G.mission.index + 1 < MISSIONS.length) {
    startMission(G, G.mission.index + 1);
  } else {
    G.toast('ALL MISSIONS COMPLETE — KOTA NUSA IS YOURS');
  }
}

export function updateMissions(G, dt) {
  if (!G.mission.active) return;
  const m = currentMissionDef(G);
  G.mission.timer -= dt;
  if (G.mission.timer <= 0) {
    G.mission.timer = m.timer;
    G.toast('OUT OF TIME — MISSION RESTARTED');
    startMission(G, G.mission.index);
    return;
  }
  const t = G.mission.target;
  if (!t) return;
  const px = G.player.onFoot ? G.player.pos.x : (G.car ? G.car.pos.x : G.player.pos.x);
  const pz = G.player.onFoot ? G.player.pos.z : (G.car ? G.car.pos.z : G.player.pos.z);
  const d = Math.hypot(t.x - px, t.z - pz);
  G.mission.dist = d;
  // mission 1 stage 2 needs the player actually inside the stolen car
  if (G.mission.index === 0 && G.mission.stage === 1) {
    if (G.car && G.car.name === 'KOMODO GT') advanceStage(G);
    return;
  }
  // mission 4 stage 2 needs the guards down
  if (G.mission.index === 3 && G.mission.stage === 1) {
    const left = G.enemies.filter((e) => !e.dead).length;
    if (left === 0) advanceStage(G);
    return;
  }
  if (d < 7) advanceStage(G);
}
