// Vehicles: original car models built from boxes, and arcade driving physics.
// Car names are invented: Komodo GT, Badak SUV, Kancil Hatch, Elang Coupe, Hiu Sedan.
import * as THREE from 'three';

export const CAR_DEFS = [
  { name: 'KOMODO GT', type: 'sports', color: 0xff5e1f, colorHex: '#ff5e1f', top: 42, accel: 26, grip: 1.0 },
  { name: 'BADAK SUV', type: 'suv', color: 0x2ec4b6, colorHex: '#2ec4b6', top: 34, accel: 19, grip: 0.9 },
  { name: 'KANCIL HATCH', type: 'hatch', color: 0xffd21f, colorHex: '#ffd21f', top: 30, accel: 17, grip: 1.05 },
  { name: 'ELANG COUPE', type: 'coupe', color: 0xe63946, colorHex: '#e63946', top: 40, accel: 24, grip: 1.0 },
  { name: 'HIU SEDAN', type: 'sedan', color: 0x7fb5d5, colorHex: '#7fb5d5', top: 33, accel: 18, grip: 0.95 },
  { name: 'POLISI NUSA', type: 'police', color: 0xf2f2f2, colorHex: '#f2f2f2', top: 38, accel: 22, grip: 1.0 },
];

export function makeCarModel(def, opts = {}) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x182430 });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1c1f26 });
  const len = def.type === 'suv' ? 4.9 : 4.4;
  const wid = def.type === 'suv' ? 2.1 : 1.9;
  const bodyH = def.type === 'suv' ? 1.0 : 0.62;
  const body = new THREE.Mesh(new THREE.BoxGeometry(wid, bodyH, len), bodyMat);
  body.position.y = 0.62;
  body.castShadow = true;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.3, 0.62, len * 0.48), glassMat);
  cabin.position.set(0, bodyH + 0.55, def.type === 'suv' ? -0.2 : -0.25);
  cabin.castShadow = true;
  car.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.24, 0.1, len * 0.42), bodyMat);
  roof.position.set(0, bodyH + 0.9, def.type === 'suv' ? -0.2 : -0.25);
  car.add(roof);
  // headlights + taillights
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2e2e });
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), lightMat);
    hl.position.set(s * (wid / 2 - 0.35), 0.62, len / 2 + 0.02);
    car.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), tailMat);
    tl.position.set(s * (wid / 2 - 0.35), 0.62, -len / 2 - 0.02);
    car.add(tl);
  }
  // wheels
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12);
  for (const [wx, wz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx * (wid / 2 - 0.05), 0.36, wz * (len / 2 - 0.85));
    w.castShadow = true;
    car.add(w);
    wheels.push(w);
  }
  if (def.type === 'police') {
    // light bar + door stripe
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.4), darkMat);
    barBase.position.set(0, bodyH + 0.98, -0.2);
    car.add(barBase);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.42), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    red.position.set(-0.28, bodyH + 0.98, -0.2);
    car.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.42), new THREE.MeshBasicMaterial({ color: 0x2244ff }));
    blue.position.set(0.28, bodyH + 0.98, -0.2);
    car.add(blue);
    car.userData.lightRed = red;
    car.userData.lightBlue = blue;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(wid + 0.02, 0.22, len * 0.9), new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }));
    stripe.position.y = 0.55;
    car.add(stripe);
  }
  if (opts.spoiler) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.2, 0.08, 0.5), darkMat);
    sp.position.set(0, 1.25, -len / 2 + 0.25);
    car.add(sp);
  }
  car.userData.wheels = wheels;
  car.userData.def = def;
  return car;
}

export function createCar(G, def, x, z, angle = 0) {
  const mesh = makeCarModel(def, { spoiler: def.type === 'sports' });
  mesh.position.set(x, 0, z);
  mesh.rotation.y = angle;
  G.scene.add(mesh);
  const car = {
    mesh, def, name: def.name, colorHex: def.colorHex,
    pos: mesh.position, angle,
    speed: 0, steer: 0, condition: 100,
    nitro: 100, isPolice: def.type === 'police',
    driver: null, // 'player' | 'traffic' | 'police' | 'parked' | null
    flashT: 0,
  };
  G.cars.push(car);
  return car;
}

// Arcade driving: throttle, steering that scales with speed, drag, nitro, collisions.
export function updateDriving(G, car, dt, input) {
  const def = car.def;
  const fwd = input.isDown('w') || input.isDown('ArrowUp');
  const back = input.isDown('s') || input.isDown('ArrowDown');
  const left = input.isDown('a') || input.isDown('ArrowLeft');
  const right = input.isDown('d') || input.isDown('ArrowRight');
  const brake = input.isDown(' ');
  const nitro = input.isDown('Shift') && car.nitro > 0 && car.speed > 4;
  if (fwd) car.speed += def.accel * dt * (nitro ? 1.7 : 1);
  if (back) car.speed -= (car.speed > 0.5 ? 30 : 12) * dt;
  if (brake) car.speed -= Math.sign(car.speed) * 34 * dt;
  if (!fwd && !back) car.speed -= Math.sign(car.speed) * 8 * dt;
  if (Math.abs(car.speed) < 0.15 && !fwd && !back) car.speed = 0;
  car.speed = Math.max(-12, Math.min(def.top * (nitro ? 1.25 : 1), car.speed));
  if (nitro) car.nitro = Math.max(0, car.nitro - 26 * dt);
  else car.nitro = Math.min(100, car.nitro + 6 * dt);
  const steerTarget = (left ? 1 : 0) - (right ? 1 : 0);
  car.steer += (steerTarget - car.steer) * Math.min(1, dt * 8);
  const steerAmount = car.steer * 1.9 * Math.min(1, Math.abs(car.speed) / 10) * (car.speed >= 0 ? 1 : -1);
  car.angle += steerAmount * dt * Math.sign(car.speed || 1) * 0.9;
  const dx = Math.sin(car.angle) * car.speed * dt;
  const dz = Math.cos(car.angle) * car.speed * dt;
  moveCarWithCollision(G, car, dx, dz);
  car.mesh.position.copy(car.pos);
  car.mesh.rotation.y = car.angle;
  // wheel spin + body lean
  const spin = car.speed * dt * 2.4;
  for (const w of car.mesh.userData.wheels) w.rotation.x += spin;
  car.mesh.rotation.z = -car.steer * 0.05 * Math.min(1, Math.abs(car.speed) / 20);
  car.mesh.rotation.x = fwd ? -0.012 : 0;
  return car.speed;
}

export function moveCarWithCollision(G, car, dx, dz) {
  const next = { x: car.pos.x + dx, z: car.pos.z + dz };
  // world bounds
  next.x = Math.max(-235, Math.min(245, next.x));
  next.z = Math.max(-245, Math.min(245, next.z));
  for (const c of G.world.colliders) {
    if (c.bridge) continue;
    if (next.x > c.minX - 1.2 && next.x < c.maxX + 1.2 && next.z > c.minZ - 1.2 && next.z < c.maxZ + 1.2) {
      // slide along the wall instead of stopping dead
      const tryX = { x: next.x, z: car.pos.z };
      const tryZ = { x: car.pos.x, z: next.z };
      const hitX = G.world.colliders.some((k) => !k.bridge && tryX.x > k.minX - 1.2 && tryX.x < k.maxX + 1.2 && tryX.z > k.minZ - 1.2 && tryX.z < k.maxZ + 1.2);
      const hitZ = G.world.colliders.some((k) => !k.bridge && tryZ.x > k.minX - 1.2 && tryZ.x < k.maxX + 1.2 && tryZ.z > k.minZ - 1.2 && tryZ.z < k.maxZ + 1.2);
      if (!hitX) { car.pos.x = tryX.x; }
      if (!hitZ) { car.pos.z = tryZ.z; }
      if (Math.abs(car.speed) > 12) {
        car.condition = Math.max(20, car.condition - 2);
        if (car.driver === 'player') { G.player.health = Math.max(1, G.player.health - 1); }
      }
      car.speed *= 0.55;
      return;
    }
  }
  car.pos.x = next.x;
  car.pos.z = next.z;
}

export function speedKmh(car) { return Math.round(Math.abs(car.speed) * 3.6); }
