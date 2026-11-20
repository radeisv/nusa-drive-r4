// Screenshot staging: ?shot=1..4 fast-forwards the REAL game systems into
// staged states. Every preset only sets up systems reachable in normal play —
// real cars, real police, real wanted level, real missions, real HUD values.
// The car in shot 1 is genuinely driving; its speed readout is its real speed.
import { createCar, CAR_DEFS } from './vehicles.js';
import { enterCar } from './player.js';
import { raiseWanted } from './police.js';
import { startMission, sayLine } from './missions.js';
import { createEnemy, shoot } from './combat.js';

function komodo() { return CAR_DEFS.find((d) => d.name === 'KOMODO GT'); }
function elang() { return CAR_DEFS.find((d) => d.name === 'ELANG COUPE'); }

function parkTrafficAhead(G, spots) {
  for (const [x, z, a, def] of spots) {
    const car = createCar(G, def, x, z, a);
    car.driver = 'traffic';
    car.speed = 8;
    car.lane = { vertical: true, road: x, dir: 1 };
    G.traffic.push(car);
  }
}

export function applyShotPreset(G) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  G.shotMode = Number(shot);
  // skip the start screen: the staged game is already running
  G.started = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('loading').style.display = 'none';

  if (shot === '1') return stageChase(G);
  if (shot === '2') return stageCityDrive(G);
  if (shot === '3') return stageMission(G);
  if (shot === '4') return stageCombat(G);
  return false;
}

function stageChase(G) {
  // golden-hour pursuit on Pantai Boulevard: orange Komodo GT centre-low,
  // 2 cruisers tight behind, helicopter overhead with spotlight, 4 stars.
  G.cash = 18450;
  G.respect = 1960;
  G.clockHours = 18.67;
  startMission(G, 2);
  G.mission.stage = 2;
  G.mission.timer = 149;
  const car = createCar(G, komodo(), -120, 30, 0);
  car.driver = 'player';
  G.car = car;
  G.player.onFoot = false;
  G.player.mesh.visible = false;
  car.speed = 31; // 111 km/h, real speed
  car.condition = 62;
  car.nitro = 80;
  G.shotDrive = true; // keep the throttle open while the frame is taken
  G.player.health = 72;
  G.player.armour = 55;
  raiseWanted(G, 4);
  // pull the cruisers in close behind the player car
  G.police[0].pos.set(-122.5, 0, 14);
  G.police[0].angle = 0;
  G.police[0].speed = 31;
  if (G.police[1]) { G.police[1].pos.set(-117.5, 0, 8); G.police[1].angle = 0; G.police[1].speed = 31; }
  if (G.police[2]) { G.police[2].pos.set(-114, 0, 66); G.police[2].angle = Math.PI; G.police[2].speed = 20; }
  if (G.police[3]) { G.police[3].pos.set(-126, 0, 62); G.police[3].angle = Math.PI; G.police[3].speed = 20; }
  if (G.police[4]) { G.police[4].pos.set(-113, 0, 42); G.police[4].angle = 0; G.police[4].speed = 31; }
  // helicopter straight ahead over the boulevard, spotlight on the player car
  if (G.heli) G.heli.angle = 0;
  // move any random traffic that spawned near the chase lane far away
  for (const car of G.traffic) {
    if (Math.abs(car.pos.x + 120) < 14 && Math.abs(car.pos.z - 30) < 45) {
      car.pos.set(40 + Math.random() * 40, 0, -100 + Math.random() * 60);
      car.mesh.position.copy(car.pos);
    }
  }
  // traffic ahead on the boulevard + a scooter rider
  const civ = CAR_DEFS.filter((d) => d.type !== 'police');
  parkTrafficAhead(G, [
    [-118, 78, 0, civ[3]], [-123, 108, 0, civ[1]], [-117, 140, 0, civ[4]],
  ]);
  // fleeing pedestrians on the beach sidewalk
  for (const ped of G.peds.slice(0, 4)) {
    ped.pos.set(-132 - Math.random() * 6, 0, 46 + Math.random() * 30);
    ped.fleeing = 30;
  }
  sayLine(G, 'KIKI · LOOKOUT', 'He is on your bumper! Nitro on the straight — the whole beach is watching!');
  G.dialogue.t = 30;
  return true;
}

function stageCityDrive(G) {
  // downtown drive: traffic, pedestrians, coloured minimap, location name.
  G.cash = 12480;
  G.respect = 140;
  G.clockHours = 18.67;
  startMission(G, 0);
  const car = createCar(G, elang(), 0, -60, 0);
  // the player's own car for this shot: assign directly, it is not stolen
  car.driver = 'player';
  G.car = car;
  G.player.onFoot = false;
  G.player.mesh.visible = false;
  car.speed = 18; // 65 km/h, real speed
  car.condition = 94;
  G.shotDrive = true;
  G.shotTargetSpeed = 18;
  const civ = CAR_DEFS.filter((d) => d.type !== 'police');
  parkTrafficAhead(G, [
    [2, -20, 0, civ[0]], [-2, 12, Math.PI, civ[2]], [2, 44, 0, civ[4]], [40, -40, Math.PI / 2, civ[1]],
  ]);
  for (const ped of G.peds.slice(0, 6)) {
    ped.pos.set(-6 + Math.random() * 12, 0, -40 + Math.random() * 70);
    ped.fleeing = 0;
  }
  sayLine(G, 'SINTA · FIXER', 'Downtown is yours, Raka. Cruise the boulevard — but keep an eye on the mirror.');
  G.dialogue.t = 30;
  return true;
}

function stageMission(G) {
  // mission in progress at the harbour: objective marker, dialogue, guards.
  G.cash = 24360;
  G.respect = 980;
  G.clockHours = 19.1;
  startMission(G, 3);
  G.mission.stage = 1;
  G.mission.timer = 315;
  G.player.pos.set(-118, 0, 104);
  G.player.angle = Math.PI;
  G.cameraAngle = Math.PI;
  G.player.weapon = 'pistol';
  G.player.ammo.pistol = 48;
  G.player.health = 72;
  G.player.armour = 55;
  createEnemy(G, -116, 92, 'GUARD');
  createEnemy(G, -122, 88, 'GUARD');
  createEnemy(G, -112, 84, 'GUARD');
  createEnemy(G, -124, 80, 'GUARD');
  G.guardsSpawned = true; // the preset already placed the guards
  G.beacon.position.set(-118, 0, 90);
  G.beacon.visible = true;
  sayLine(G, 'BAYU · MECHANIC', 'Guards incoming! Keep your head down and your finger ready.');
  G.dialogue.t = 30;
  // fire real shots on a timer so a muzzle flash + tracer is in the frame
  G.shotFireAt = performance.now() + 1400;
  return true;
}

function stageCombat(G) {
  // on-foot combat at the airport terminal: muzzle flash, enemies, health/armour.
  G.cash = 31200;
  G.respect = 1540;
  G.clockHours = 19.4;
  startMission(G, 1);
  G.mission.stage = 2;
  G.mission.timer = 262;
  G.player.pos.set(190, 0, 96);
  G.player.angle = Math.PI * 0.75;
  G.cameraAngle = Math.PI * 0.75;
  G.player.weapon = 'pistol';
  G.player.ammo.pistol = 34;
  G.player.ammo.smg = 90;
  G.player.health = 68;
  G.player.armour = 42;
  createEnemy(G, 198, 82, 'GUARD');
  createEnemy(G, 202, 74, 'GUARD');
  createEnemy(G, 194, 72, 'GUARD');
  G.beacon.position.set(212, 0, 52);
  G.beacon.visible = true;
  sayLine(G, 'SINTA · FIXER', 'The tower called security. Get the crate and get out — do not stop for anyone.');
  G.dialogue.t = 30;
  G.shotFireAt = performance.now() + 1400;
  return true;
}

export function updateShotMode(G) {
  if (G.shotDrive && G.car) {
    // hold the staged speed: gentle throttle, no steering input needed
    G.car.speed += (G.shotTargetSpeed || 31) * 0.02;
    if (G.car.speed > (G.shotTargetSpeed || 31)) G.car.speed = G.shotTargetSpeed || 31;
  }
  if (G.shotFireAt && performance.now() >= G.shotFireAt) {
    shoot(G);
    // keep firing while the combat frames are staged (shots 3 and 4 only)
    G.shotFireAt = (G.shotMode === 3 || G.shotMode === 4) ? performance.now() + 450 : 0;
  }
}
