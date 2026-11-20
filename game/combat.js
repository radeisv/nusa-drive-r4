// Combat: pistol + SMG, aim and fire, enemy guards with health bars,
// muzzle flash, tracers, damage to the player and health/armour pickups.
import * as THREE from 'three';
import { playGunshot, playHit } from './audio.js';

export function createEnemy(G, x, z, name = 'GUARD') {
  const group = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: 0x1c1f26 });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc98d64 });
  const vest = new THREE.MeshLambertMaterial({ color: 0x7f1d1d });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 0.36), vest);
  body.position.y = 1.15; body.castShadow = true; group.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), skin);
  head.position.y = 1.86; group.add(head);
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.46), shirt);
  helmet.position.y = 2.08; group.add(helmet);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 0.26), shirt);
  legL.position.set(-0.17, 0.36, 0); group.add(legL);
  const legR = legL.clone(); legR.position.x = 0.17; group.add(legR);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.5), shirt);
  gun.position.set(0.45, 1.2, 0.3); group.add(gun);
  // red health bar sprite above the head
  const barBg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.14), new THREE.MeshBasicMaterial({ color: 0x330000 }));
  barBg.position.y = 2.45; group.add(barBg);
  const barFg = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.1), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
  barFg.position.set(0, 2.45, 0.01); group.add(barFg);
  group.position.set(x, 0, z);
  G.scene.add(group);
  const enemy = {
    mesh: group, pos: group.position, name,
    health: 100, dead: false, shootT: 1 + Math.random() * 2,
    barFg, angle: 0, phase: Math.random() * 6,
  };
  G.enemies.push(enemy);
  return enemy;
}

export function spawnGuards(G, spots) {
  for (const [x, z] of spots) createEnemy(G, x, z);
}

export function shoot(G) {
  const p = G.player;
  if (p.weapon === 'fists') return;
  const key = p.weapon === 'pistol' ? 'pistol' : 'smg';
  if ((p.ammo[key] || 0) <= 0) { G.toast('NO AMMO — PRESS 1 FOR FISTS'); return; }
  p.ammo[key]--;
  G.gunshotT = 0.25;
  // in a staged screenshot the flash and tracer linger so the frame catches them
  G.muzzleT = G.shotMode ? 0.35 : 0.09;
  playGunshot();
  // hit the nearest enemy in the aim cone (camera forward)
  const aimX = Math.sin(G.cameraAngle || 0);
  const aimZ = Math.cos(G.cameraAngle || 0);
  let best = null; let bestD = 60;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dx = e.pos.x - p.pos.x;
    const dz = e.pos.z - p.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 60) continue;
    const dot = (dx * aimX + dz * aimZ) / (d || 1);
    if (dot > 0.86 && d < bestD) { bestD = d; best = e; }
  }
  if (best) {
    best.health -= p.weapon === 'smg' ? 22 : 34;
    playHit();
    spawnTracer(G, p.pos, best.pos);
    if (best.health <= 0) {
      best.dead = true;
      best.mesh.visible = false;
      G.cash += 120;
      G.toast('GUARD DOWN — +$120');
    }
  } else {
    spawnTracer(G, p.pos, { x: p.pos.x + aimX * 40, y: 1.4, z: p.pos.z + aimZ * 40 });
  }
}

function spawnTracer(G, from, to) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(from.x, 1.4, from.z),
    new THREE.Vector3(to.x, 1.4, to.z),
  ]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 }));
  G.scene.add(line);
  G.tracers.push({ line, t: G.shotMode ? 0.5 : 0.12 });
}

export function updateCombat(G, dt) {
  if (G.gunshotT > 0) G.gunshotT -= dt;
  if (G.muzzleT > 0) G.muzzleT -= dt;
  for (const t of G.tracers) t.t -= dt;
  G.tracers = G.tracers.filter((t) => {
    if (t.t <= 0) { G.scene.remove(t.line); return false; }
    return true;
  });
  // enemies: face the player, strafe a little, shoot when close
  const px = G.player.pos.x, pz = G.player.pos.z;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dx = px - e.pos.x, dz = pz - e.pos.z;
    const d = Math.hypot(dx, dz);
    e.angle = Math.atan2(dx, dz);
    e.mesh.rotation.y = e.angle;
    e.barFg.scale.x = Math.max(0.01, e.health / 100);
    e.barFg.position.x = -(1.05 - 1.05 * (e.health / 100)) / 2;
    e.barFg.lookAt(G.camera.position);
    e.mesh.children[6].lookAt(G.camera.position);
    if (d < 26) {
      e.shootT -= dt;
      if (e.shootT <= 0) {
        e.shootT = 1.6 + Math.random() * 1.4;
        spawnTracer(G, e.pos, { x: px, y: 1.3, z: pz });
        playGunshot();
        damagePlayer(G, 6 + Math.random() * 6);
      }
      if (d > 9) {
        e.pos.x += Math.sin(e.angle) * 3.2 * dt;
        e.pos.z += Math.cos(e.angle) * 3.2 * dt;
        e.phase += dt * 6;
      }
    } else {
      // patrol in place
      e.phase += dt * 2;
      e.pos.x += Math.sin(e.phase * 0.5) * 0.4 * dt;
    }
  }
}

export function damagePlayer(G, amount) {
  const p = G.player;
  if (p.armour > 0) {
    const absorbed = Math.min(p.armour, amount * 0.6);
    p.armour -= absorbed;
    amount -= absorbed;
  }
  p.health = Math.max(0, p.health - amount);
  G.damageFlash = 0.6;
  if (p.health <= 0) {
    p.health = 100;
    p.armour = 50;
    p.pos.set(-112, 0, 40);
    G.cash = Math.max(0, G.cash - 500);
    G.wanted = 0;
    G.toast('WASTED — WOKE UP AT THE HOSPITAL, -$500');
  }
}

export function spawnPickups(G) {
  // health + armour crates near the plaza and the beach
  const spots = [[-6, 8, 'health'], [8, -6, 'armour'], [-118, 60, 'health'], [40, -30, 'armour']];
  for (const [x, z, kind] of spots) {
    const color = kind === 'health' ? 0x4ade80 : 0x38bdf8;
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
    );
    crate.position.set(x, 0.9, z);
    crate.castShadow = true;
    G.scene.add(crate);
    G.pickups.push({ mesh: crate, pos: crate.position, kind, taken: false, spin: 0 });
  }
}

export function updatePickups(G, dt) {
  for (const pk of G.pickups) {
    if (pk.taken) continue;
    pk.spin += dt;
    pk.mesh.rotation.y = pk.spin;
    pk.mesh.position.y = 0.9 + Math.sin(pk.spin * 2) * 0.12;
    const d = Math.hypot(pk.pos.x - G.player.pos.x, pk.pos.z - G.player.pos.z);
    if (d < 1.8) {
      pk.taken = true;
      pk.mesh.visible = false;
      if (pk.kind === 'health') G.player.health = Math.min(100, G.player.health + 40);
      else G.player.armour = Math.min(100, G.player.armour + 50);
      G.toast(pk.kind === 'health' ? 'HEALTH +40' : 'ARMOUR +50');
    }
  }
}
