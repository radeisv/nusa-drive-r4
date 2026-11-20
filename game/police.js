// Police: wanted level 0–5, cruisers that chase and ram, a helicopter with a
// spotlight at 3+ stars, roadblocks at 4+, and escape when the player hides.
import * as THREE from 'three';
import { createCar, CAR_DEFS } from './vehicles.js';
import { playSiren } from './audio.js';

const UNIT_NAMES = ['ELANG-1', 'HIU-3', 'GARUDA-7', 'MERAK-2', 'KOMODO-5', 'IBIS-43', 'TARPON-10', 'RAJAWALI-9'];
const UNIT_ROLES = ['Pursuit', 'Ramming', 'Flanking', 'Roadblock', 'Spotlight', 'Shore Watch', 'Closing In', 'Marksman'];

export function raiseWanted(G, stars) {
  G.wanted = Math.max(0, Math.min(5, G.wanted + stars));
  if (G.wanted > 0) {
    playSiren(true);
    G.toast('WANTED LEVEL ' + G.wanted + ' — POLISI NUSA RESPONDING');
  }
  syncPoliceUnits(G);
}

export function lowerWanted(G, stars) {
  G.wanted = Math.max(0, G.wanted - stars);
  if (G.wanted === 0) playSiren(false);
  syncPoliceUnits(G);
}

function syncPoliceUnits(G) {
  const want = G.wanted >= 4 ? 5 : G.wanted >= 3 ? 4 : G.wanted >= 2 ? 3 : G.wanted >= 1 ? 2 : 0;
  // add cruisers until we have `want` active
  while (G.police.length < want) {
    const def = CAR_DEFS.find((d) => d.type === 'police');
    const a = Math.random() * Math.PI * 2;
    const px = G.player.onFoot ? G.player.pos.x : G.car.pos.x;
    const pz = G.player.onFoot ? G.player.pos.z : G.car.pos.z;
    const car = createCar(G, def, px + Math.sin(a) * 34, pz + Math.cos(a) * 34, a);
    car.driver = 'police';
    car.speed = 10;
    car.unitName = UNIT_NAMES[G.police.length % UNIT_NAMES.length];
    car.unitRole = UNIT_ROLES[G.police.length % UNIT_ROLES.length];
    G.police.push(car);
  }
  while (G.police.length > want) {
    const car = G.police.pop();
    car.driver = null;
    G.scene.remove(car.mesh);
    const idx = G.cars.indexOf(car);
    if (idx >= 0) G.cars.splice(idx, 1);
  }
  // helicopter at 3+ stars
  if (G.wanted >= 3 && !G.heli) spawnHelicopter(G);
  if (G.wanted < 3 && G.heli) {
    G.scene.remove(G.heli.group);
    G.heli = null;
  }
}

export function spawnHelicopter(G) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 4.6), bodyMat);
  body.castShadow = true; group.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 1.4), new THREE.MeshLambertMaterial({ color: 0x182430 }));
  glass.position.set(0, 0.3, 1.8); group.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.4), bodyMat);
  tail.position.set(0, 0.4, -4.2); group.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.0), darkMat);
  fin.position.set(0, 1.0, -6.2); group.add(fin);
  const rotor = new THREE.Group();
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x1c1f26 });
  for (const a of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.08, 0.4), bladeMat);
    blade.rotation.y = a;
    rotor.add(blade);
  }
  rotor.position.y = 1.15;
  group.add(rotor);
  // spotlight cone (apex at the helicopter, base on the street below)
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(6, 26, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  cone.position.y = -13;
  cone.rotation.x = Math.PI;
  group.add(cone);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(5.5, 20), new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.3 }));
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = -25;
  group.add(spot);
  G.scene.add(group);
  group.scale.setScalar(1.3);
  G.heli = { group, rotor, cone, spot, angle: 0, bob: 0 };
}

export function updatePolice(G, dt) {
  const px = G.player.onFoot ? G.player.pos.x : (G.car ? G.car.pos.x : G.player.pos.x);
  const pz = G.player.onFoot ? G.player.pos.z : (G.car ? G.car.pos.z : G.player.pos.z);
  const playerSpeed = G.car ? Math.abs(G.car.speed) : G.player.speed;
  // wanted decay: stay hidden / slow and the heat cools off
  if (G.wanted > 0) {
    G.heatTimer += dt;
    const hidden = playerSpeed < 3;
    if (hidden && G.heatTimer > 14) { lowerWanted(G, 1); G.heatTimer = 0; G.toast('HEAT COOLING — WANTED LEVEL ' + G.wanted); }
    if (!hidden) G.heatTimer = Math.max(0, G.heatTimer - dt * 0.4);
  }
  for (const car of G.police) {
    car.flashT += dt;
    const flash = Math.sin(car.flashT * 14) > 0;
    if (car.mesh.userData.lightRed) car.mesh.userData.lightRed.material.color.setHex(flash ? 0xff2222 : 0x551111);
    if (car.mesh.userData.lightBlue) car.mesh.userData.lightBlue.material.color.setHex(flash ? 0x2244ff : 0x111155);
    const dx = px - car.pos.x;
    const dz = pz - car.pos.z;
    const dist = Math.hypot(dx, dz);
    car.dist = dist;
    const desired = Math.atan2(dx, dz);
    let diff = desired - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.angle += diff * Math.min(1, dt * 2.2);
    // ram: full speed when far, ease off when close so they bump instead of teleporting
    const target = dist > 26 ? 34 : dist > 8 ? 22 : 12;
    car.speed += (target - car.speed) * Math.min(1, dt * 1.8);
    car.pos.x += Math.sin(car.angle) * car.speed * dt;
    car.pos.z += Math.cos(car.angle) * car.speed * dt;
    car.mesh.position.copy(car.pos);
    car.mesh.rotation.y = car.angle;
    const spin = car.speed * dt * 2.4;
    for (const w of car.mesh.userData.wheels) w.rotation.x += spin;
    // ramming the player car damages it
    if (G.car && dist < 3.4 && car.speed > 8) {
      G.car.condition = Math.max(15, G.car.condition - 0.4);
      G.car.speed *= 0.92;
      car.speed *= 0.7;
      G.player.health = Math.max(5, G.player.health - 0.15);
      G.damageFlash = 0.4;
    }
    // on foot: a cruiser that catches you busts you back a star of cash
    if (G.player.onFoot && dist < 2.6 && G.wanted > 0) {
      G.cash = Math.max(0, G.cash - 25);
      G.toast('BUSTED — POLISI NUSA TOOK $25');
      lowerWanted(G, 1);
      car.pos.x += 30; car.pos.z += 30;
    }
  }
  // helicopter: hover above the player, rotor spinning, spotlight tracking
  if (G.heli) {
    const h = G.heli;
    h.bob += dt;
    h.angle += dt * 0.25;
    // wide, low orbit so the helicopter stays in the chase camera's frame
    const hx = px + Math.sin(h.angle) * 40;
    const hz = pz + Math.cos(h.angle) * 40;
    h.group.position.set(hx, 18 + Math.sin(h.bob * 1.4) * 1.2, hz);
    h.group.rotation.y = Math.atan2(px - hx, pz - hz);
    h.rotor.rotation.y += dt * 22;
    h.spot.position.x = (px - hx) * 0.92;
    h.spot.position.z = (pz - hz) * 0.92;
    h.spot.position.y = -17 + Math.sin(h.bob * 1.4) * 1.2;
    h.cone.lookAt(px, 0, pz);
  }
}

export function policeListForHud(G) {
  return G.police.map((c) => ({
    name: c.unitName || 'UNIT',
    role: (c.unitRole || 'Pursuit').toUpperCase(),
    dist: Math.round(c.dist || 0),
  }));
}
