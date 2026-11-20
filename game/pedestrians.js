// Pedestrians: islanders who stroll the sidewalks, wait at crossings,
// and run away screaming when a car or a gunshot comes near.
import * as THREE from 'three';

const SHIRTS = [0xff7a2f, 0x2ec4b6, 0xffd21f, 0xe63946, 0x7fb5d5, 0xf2f2f2, 0xa855f7, 0x4ade80];

export function makePedestrian(G, x, z) {
  const rng = G.world.rng;
  const group = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: SHIRTS[Math.floor(rng() * SHIRTS.length)] });
  const skin = new THREE.MeshLambertMaterial({ color: [0xc98d64, 0x8a5a3b, 0xe8b88a][Math.floor(rng() * 3)] });
  const pants = new THREE.MeshLambertMaterial({ color: 0x2b3a55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.9, 0.34), shirt);
  body.position.y = 1.12; body.castShadow = true; group.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skin);
  head.position.y = 1.8; group.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.68, 0.24), pants);
  legL.position.set(-0.16, 0.34, 0); group.add(legL);
  const legR = legL.clone(); legR.position.x = 0.16; group.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.66, 0.18), shirt);
  armL.position.set(-0.39, 1.15, 0); group.add(armL);
  const armR = armL.clone(); armR.position.x = 0.39; group.add(armR);
  group.userData = { legL, legR, armL, armR };
  group.position.set(x, 0, z);
  G.scene.add(group);
  const ped = {
    mesh: group, pos: group.position,
    angle: rng() * Math.PI * 2,
    speed: 1.2 + rng() * 1.0,
    phase: rng() * 6,
    fleeing: 0,
    sidewalk: rng() < 0.5 ? 'x' : 'z',
    lane: 0,
    state: 'walk',
  };
  // pick a sidewalk lane next to a road
  const roads = G.world.roadXs;
  const road = roads[Math.floor(rng() * roads.length)];
  ped.lane = road + (rng() < 0.5 ? -6.5 : 6.5);
  ped.pos.x = ped.sidewalk === 'x' ? ped.lane : -140 + rng() * 280;
  ped.pos.z = ped.sidewalk === 'x' ? -140 + rng() * 280 : ped.lane;
  G.peds.push(ped);
  return ped;
}

export function spawnPedestrians(G, count = 26) {
  for (let i = 0; i < count; i++) makePedestrian(G, 0, 0);
}

export function updatePedestrians(G, dt) {
  const px = G.player.onFoot ? G.player.pos.x : (G.car ? G.car.pos.x : 0);
  const pz = G.player.onFoot ? G.player.pos.z : (G.car ? G.car.pos.z : 0);
  const playerSpeed = G.car ? Math.abs(G.car.speed) : G.player.speed;
  for (const ped of G.peds) {
    const dPlayer = Math.hypot(ped.pos.x - px, ped.pos.z - pz);
    if (dPlayer < 9 && (playerSpeed > 6 || G.gunshotT > 0)) ped.fleeing = 2.5;
    if (ped.fleeing > 0) {
      ped.fleeing -= dt;
      const away = Math.atan2(ped.pos.x - px, ped.pos.z - pz);
      ped.angle = away;
      ped.pos.x += Math.sin(away) * 5.5 * dt;
      ped.pos.z += Math.cos(away) * 5.5 * dt;
      ped.phase += dt * 11;
      ped.state = 'run';
    } else {
      ped.state = 'walk';
      // stroll along the sidewalk, turn at the ends
      const dir = ped.sidewalk === 'x' ? 0 : Math.PI / 2;
      ped.angle += (dir - ped.angle) * Math.min(1, dt * 2);
      ped.pos.x += Math.sin(ped.angle) * ped.speed * dt;
      ped.pos.z += Math.cos(ped.angle) * ped.speed * dt;
      ped.phase += dt * ped.speed * 3.2;
      if (ped.pos.x > 150 || ped.pos.x < -150 || ped.pos.z > 150 || ped.pos.z < -150) {
        ped.angle += Math.PI;
        ped.pos.x = Math.max(-148, Math.min(148, ped.pos.x));
        ped.pos.z = Math.max(-148, Math.min(148, ped.pos.z));
      }
    }
    ped.mesh.rotation.y = ped.angle;
    const swing = Math.sin(ped.phase) * (ped.fleeing > 0 ? 0.85 : 0.45);
    ped.mesh.userData.legL.rotation.x = swing;
    ped.mesh.userData.legR.rotation.x = -swing;
    ped.mesh.userData.armL.rotation.x = ped.fleeing > 0 ? -2.6 : -swing * 0.6;
    ped.mesh.userData.armR.rotation.x = ped.fleeing > 0 ? -2.6 : swing * 0.6;
  }
}
