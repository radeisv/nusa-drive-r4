// Player: Raka on foot — walk/run, camera-relative movement, enter/exit cars,
// punch, and the aim pose. Stealing a parked car raises the wanted level.
import * as THREE from 'three';
import { raiseWanted } from './police.js';
import { playPickup, startEngine, stopEngine } from './audio.js';

export function createPlayer(G) {
  const group = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: 0xff7a2f });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc98d64 });
  const pants = new THREE.MeshLambertMaterial({ color: 0x2b3a55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 0.36), shirt);
  body.position.y = 1.15; body.castShadow = true; group.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), skin);
  head.position.y = 1.86; head.castShadow = true; group.add(head);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.46), new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }));
  cap.position.y = 2.1; group.add(cap);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 0.26), pants);
  legL.position.set(-0.17, 0.36, 0); group.add(legL);
  const legR = legL.clone(); legR.position.x = 0.17; group.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.2), shirt);
  armL.position.set(-0.42, 1.2, 0); group.add(armL);
  const armR = armL.clone(); armR.position.x = 0.42; group.add(armR);
  // pistol in the right hand when armed
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.42), new THREE.MeshLambertMaterial({ color: 0x1c1f26 }));
  gun.position.set(0.42, 0.95, 0.25); gun.visible = false; group.add(gun);
  group.userData = { legL, legR, armL, armR, gun };
  group.position.set(-112, 0, 40);
  G.scene.add(group);
  G.player = {
    mesh: group,
    pos: group.position,
    angle: Math.PI,
    speed: 0,
    health: 100,
    armour: 50,
    weapon: 'fists',
    ammo: { pistol: 60, smg: 0 },
    onFoot: true,
    walkPhase: 0,
    punchT: 0,
  };
  return G.player;
}

export function updatePlayerOnFoot(G, dt, input) {
  const p = G.player;
  const camAngle = G.cameraAngle || 0;
  let mx = 0, mz = 0;
  if (input.isDown('w') || input.isDown('ArrowUp')) mz -= 1;
  if (input.isDown('s') || input.isDown('ArrowDown')) mz += 1;
  if (input.isDown('a') || input.isDown('ArrowLeft')) mx -= 1;
  if (input.isDown('d') || input.isDown('ArrowRight')) mx += 1;
  const len = Math.hypot(mx, mz);
  const run = input.isDown('Shift');
  const speed = run ? 9.5 : 5.2;
  if (len > 0) {
    mx /= len; mz /= len;
    const sin = Math.sin(camAngle), cos = Math.cos(camAngle);
    const wx = mx * cos - mz * sin;
    const wz = mx * sin + mz * cos;
    const nx = p.pos.x + wx * speed * dt;
    const nz = p.pos.z + wz * speed * dt;
    if (!hitsCollider(G, nx, p.pos.z)) p.pos.x = nx;
    if (!hitsCollider(G, p.pos.x, nz)) p.pos.z = nz;
    p.pos.x = Math.max(-235, Math.min(245, p.pos.x));
    p.pos.z = Math.max(-245, Math.min(245, p.pos.z));
    p.angle = Math.atan2(wx, wz);
    p.walkPhase += dt * speed * 1.6;
    p.speed = speed;
  } else {
    p.speed = 0;
  }
  p.mesh.rotation.y = p.angle;
  const swing = p.speed > 0 ? Math.sin(p.walkPhase) * 0.55 : 0;
  p.mesh.userData.legL.rotation.x = swing;
  p.mesh.userData.legR.rotation.x = -swing;
  p.mesh.userData.armL.rotation.x = -swing * 0.7;
  p.mesh.userData.armR.rotation.x = swing * 0.7;
  p.mesh.userData.gun.visible = p.weapon !== 'fists';
  if (p.punchT > 0) {
    p.punchT -= dt;
    p.mesh.userData.armR.rotation.x = -1.4;
  }
  // aim with mouse: turn toward camera forward when locked
  const m = input.consumeMouse();
  if (input.locked && Math.abs(m.dx) > 0) {
    G.cameraAngle = (G.cameraAngle || 0) - m.dx * 0.003;
    p.angle = G.cameraAngle + Math.PI;
  }
}

export function hitsCollider(G, x, z) {
  for (const c of G.world.colliders) {
    if (c.bridge) continue;
    if (x > c.minX - 0.4 && x < c.maxX + 0.4 && z > c.minZ - 0.4 && z < c.maxZ + 0.4) return true;
  }
  return false;
}

export function nearestCar(G, maxDist = 5) {
  let best = null; let bestD = maxDist;
  for (const car of G.cars) {
    if (car.driver === 'police') continue;
    const d = Math.hypot(car.pos.x - G.player.pos.x, car.pos.z - G.player.pos.z);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

export function enterCar(G, car) {
  const p = G.player;
  const wasParked = car.driver === 'parked' || car.driver === null;
  car.driver = 'player';
  G.car = car;
  p.onFoot = false;
  p.mesh.visible = false;
  startEngine(1);
  if (wasParked) {
    raiseWanted(G, 1);
    G.toast('STOLE A ' + car.name + ' — POLISI NUSA ALERTED');
    playPickup();
  } else {
    G.toast('GOT IN THE ' + car.name);
  }
  return true;
}

export function exitCar(G) {
  const p = G.player;
  if (!G.car) return;
  const car = G.car;
  car.driver = null;
  car.speed = 0;
  G.car = null;
  p.onFoot = true;
  const side = Math.cos(car.angle) > 0 ? 1 : -1;
  p.pos.set(car.pos.x + side * 2.2, 0, car.pos.z + 1.5);
  p.angle = car.angle;
  p.mesh.visible = true;
  p.mesh.position.copy(p.pos);
  stopEngine();
  G.toast('LEFT THE ' + car.name);
}

export function punch(G) {
  const p = G.player;
  if (p.punchT > 0) return;
  p.punchT = 0.35;
  // hit the nearest enemy in front
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
    if (d < 2.4) {
      e.health -= 25;
      if (e.health <= 0) { e.dead = true; e.mesh.visible = false; G.cash += 60; }
      break;
    }
  }
}
