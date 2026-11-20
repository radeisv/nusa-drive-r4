// City: roads, buildings, props and the airport island of Kota Nusa.
// Warm pastel blocks, neon signs, palms, lamps, beach umbrellas, billboards.
import * as THREE from 'three';

const ROAD_COLOR = 0x3a3f4a;
const SIDEWALK = 0x9a8f7a;

function box(w, h, d, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color, emissive: opts.emissive || 0x000000, emissiveIntensity: opts.glow || 0 })
  );
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function buildRoads(G) {
  const scene = G.scene;
  const roadMat = new THREE.MeshLambertMaterial({ color: ROAD_COLOR });
  const walkMat = new THREE.MeshLambertMaterial({ color: SIDEWALK });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd21f });
  for (const x of G.world.roadXs) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 300), roadMat);
    road.rotation.x = -Math.PI / 2; road.position.set(x, 0.06, 0); road.receiveShadow = true;
    scene.add(road);
    const walkL = new THREE.Mesh(new THREE.PlaneGeometry(3, 300), walkMat);
    walkL.rotation.x = -Math.PI / 2; walkL.position.set(x - 6.5, 0.07, 0); scene.add(walkL);
    const walkR = walkL.clone(); walkR.position.x = x + 6.5; scene.add(walkR);
    for (let z = -140; z < 150; z += 14) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 5), lineMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(x, 0.08, z);
      scene.add(dash);
    }
  }
  for (const z of G.world.roadZs) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 10), roadMat);
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.06, z); road.receiveShadow = true;
    scene.add(road);
    for (let x = -140; x < 150; x += 14) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.5), lineMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(x, 0.08, z);
      scene.add(dash);
    }
  }
  // Pantai Boulevard: the wide beachfront road, teal curbs, palm median
  const blvd = new THREE.Mesh(new THREE.PlaneGeometry(16, 300), new THREE.MeshLambertMaterial({ color: 0x464c5c }));
  blvd.rotation.x = -Math.PI / 2; blvd.position.set(-120, 0.07, 0); blvd.receiveShadow = true;
  scene.add(blvd);
  const curb = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 300), new THREE.MeshBasicMaterial({ color: 0x2ec4b6 }));
  curb.rotation.x = -Math.PI / 2; curb.position.set(-112, 0.09, 0); scene.add(curb);
  // bridge deck over the lagoon to the airport island
  const bridge = new THREE.Mesh(new THREE.PlaneGeometry(12, 70), new THREE.MeshLambertMaterial({ color: 0x555c6e }));
  bridge.rotation.x = -Math.PI / 2; bridge.position.set(158, 0.5, 60); bridge.receiveShadow = true;
  scene.add(bridge);
  const railMat = new THREE.MeshLambertMaterial({ color: 0xffb020 });
  for (const s of [-1, 1]) {
    const rail = box(0.5, 1.1, 70, 0xffb020, 158 + s * 6.2, 1.0, 60);
    scene.add(rail);
  }
  G.world.colliders.push({ minX: 150, maxX: 166, minZ: 24, maxZ: 96, bridge: true });
}

const PALETTE = [0xf6e3c5, 0xe8a87c, 0x7fb5a8, 0xd96c5f, 0xf2c14e, 0x9db8d2, 0xc97b84, 0xffe1a8];
const SIGN_COLORS = [0xff2e88, 0x22d3ee, 0xffd21f, 0x7dff9e, 0xff7a2f];

export function buildBuildings(G) {
  const scene = G.scene;
  const rng = G.world.rng;
  const names = ['HOTEL SERIWA', 'LAGUNA RASI', 'MALIN SUITES', 'CLUB NEON', 'PASAR NUSA', 'KANTOR POS', 'BANK NUSA', 'HOTEL OMBAK', 'MENARA SENJA', 'GALERI PANTAI'];
  let nameIdx = 0;
  for (const bx of [-100, -60, -20, 20, 60, 100]) {
    for (const bz of [-100, -60, -20, 20, 60, 100]) {
      if (Math.abs(bx) < 5 && Math.abs(bz) < 5) continue; // keep the central plaza open
      const w = 16 + rng() * 14;
      const d = 14 + rng() * 12;
      const h = 8 + rng() * rng() * 42;
      const color = PALETTE[Math.floor(rng() * PALETTE.length)];
      const b = box(w, h, d, color, bx, h / 2, bz);
      scene.add(b);
      G.world.colliders.push({ minX: bx - w / 2 - 0.5, maxX: bx + w / 2 + 0.5, minZ: bz - d / 2 - 0.5, maxZ: bz + d / 2 + 0.5 });
      // roof rim + lit windows
      const rim = box(w + 0.6, 0.5, d + 0.6, 0x2b2f3a, bx, h + 0.25, bz);
      scene.add(rim);
      const winMat = new THREE.MeshBasicMaterial({ color: 0xffd97a });
      const floors = Math.max(1, Math.floor(h / 5));
      for (let f = 0; f < floors; f++) {
        for (let k = 0; k < Math.floor(w / 5); k++) {
          if (rng() < 0.45) continue;
          const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), winMat);
          win.position.set(bx - w / 2 + 3 + k * 5, 3 + f * 5, bz + d / 2 + 0.06);
          scene.add(win);
        }
        // side faces too, so a building never reads as one blank wall
        for (let k = 0; k < Math.floor(d / 5); k++) {
          if (rng() < 0.5) continue;
          const winW = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), winMat);
          winW.rotation.y = -Math.PI / 2;
          winW.position.set(bx - w / 2 - 0.06, 3 + f * 5, bz - d / 2 + 3 + k * 5);
          scene.add(winW);
          if (rng() < 0.5) continue;
          const winE = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), winMat);
          winE.rotation.y = Math.PI / 2;
          winE.position.set(bx + w / 2 + 0.06, 3 + f * 5, bz - d / 2 + 3 + k * 5);
          scene.add(winE);
        }
      }
      // neon sign on taller blocks
      if (h > 20 && nameIdx < names.length) {
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(Math.min(16, w), 2.2),
          new THREE.MeshBasicMaterial({ color: SIGN_COLORS[nameIdx % SIGN_COLORS.length] })
        );
        sign.position.set(bx, h + 1.6, bz + d / 2 + 0.1);
        scene.add(sign);
        nameIdx++;
      }
    }
  }
  // downtown towers near the plaza
  for (const [x, z, h] of [[-28, 28, 58], [28, -28, 64], [-28, -60, 48]]) {
    const t = box(20, h, 20, PALETTE[Math.floor(rng() * PALETTE.length)], x, h / 2, z);
    scene.add(t);
    G.world.colliders.push({ minX: x - 10.5, maxX: x + 10.5, minZ: z - 10.5, maxZ: z + 10.5 });
    const rim = box(21, 0.6, 21, 0x2b2f3a, x, h + 0.3, z);
    scene.add(rim);
  }
}

export function makePalm(height = 7) {
  const palm = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, height, 7),
    new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
  );
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  palm.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2fa36b, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    // each leaf is a flattened cone, drooping outward from the crown
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.55, 4.2, 4), leafMat);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 1.9, height + 0.1, Math.sin(a) * 1.9);
    leaf.rotation.z = Math.PI / 2 + 0.62;
    leaf.rotation.y = -a;
    leaf.scale.set(1, 1, 0.28);
    palm.add(leaf);
  }
  const nuts = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshLambertMaterial({ color: 0x6b4a2a }));
  nuts.position.y = height + 0.2;
  palm.add(nuts);
  return palm;
}

export function buildProps(G) {
  const scene = G.scene;
  const rng = G.world.rng;
  // palms along the boulevard and the beach
  for (let z = -140; z <= 140; z += 16) {
    for (const x of [-110, -132, -146]) {
      if (rng() < 0.25) continue;
      const palm = makePalm(6 + rng() * 3);
      palm.position.set(x + (rng() - 0.5) * 2, 0, z + (rng() - 0.5) * 4);
      scene.add(palm);
    }
  }
  for (let x = -100; x <= 120; x += 40) {
    for (let z = -100; z <= 100; z += 40) {
      if (rng() < 0.5) continue;
      const palm = makePalm(5 + rng() * 3);
      palm.position.set(x + 14, 0, z + 14);
      scene.add(palm);
    }
  }
  // street lamps
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x2b2f3a });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  for (const x of G.world.roadXs) {
    for (let z = -130; z <= 130; z += 40) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 6), lampMat);
      pole.position.set(x + 6, 3, z); scene.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), glowMat);
      bulb.position.set(x + 6, 6.1, z); scene.add(bulb);
    }
  }
  // beach umbrellas + towels
  const umbrellaColors = [0xff5e62, 0x2ec4b6, 0xffd21f, 0xff2e88];
  for (let i = 0; i < 14; i++) {
    const x = -168 - rng() * 22;
    const z = -130 + rng() * 260;
    const um = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), lampMat);
    pole.position.y = 1.3; um.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.1, 8), new THREE.MeshLambertMaterial({ color: umbrellaColors[i % 4], side: THREE.DoubleSide }));
    top.position.y = 2.9; um.add(top);
    um.position.set(x, 0, z);
    scene.add(um);
  }
  // billboards
  const ads = [['NUSA FM 98.4', 0xff2e88], ['KOMODO GT', 0xffd21f], ['PANTAI BOULEVARD', 0x22d3ee]];
  ads.forEach(([text, color], i) => {
    const board = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), new THREE.MeshBasicMaterial({ color }));
    panel.position.y = 9; board.add(panel);
    const leg1 = box(0.5, 9, 0.5, 0x2b2f3a, -5, 4.5, 0); board.add(leg1);
    const leg2 = box(0.5, 9, 0.5, 0x2b2f3a, 5, 4.5, 0); board.add(leg2);
    board.position.set([-60, 20, 110][i], 0, [-100, 60, -120][i]);
    board.rotation.y = [0.4, -0.5, 0.9][i];
    scene.add(board);
    G.world.colliders.push({ minX: board.position.x - 1, maxX: board.position.x + 1, minZ: board.position.z - 1, maxZ: board.position.z + 1 });
  });
  // central plaza fountain
  const fountain = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, 1.2, 20), new THREE.MeshLambertMaterial({ color: 0x9db8d2 }));
  fountain.position.set(0, 0.6, 0); scene.add(fountain);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.4, 20), new THREE.MeshLambertMaterial({ color: 0x2a8aa8 }));
  water.position.set(0, 1.3, 0); scene.add(water);
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 3.4, 8), new THREE.MeshLambertMaterial({ color: 0xdfe9f2 }));
  jet.position.set(0, 2.6, 0); scene.add(jet);
  G.world.colliders.push({ minX: -8, maxX: 8, minZ: -8, maxZ: 8 });
}

export function buildAirport(G) {
  const scene = G.scene;
  // airport island east of the lagoon
  const island = new THREE.Mesh(new THREE.PlaneGeometry(90, 220), new THREE.MeshLambertMaterial({ color: 0x8f9a7a }));
  island.rotation.x = -Math.PI / 2; island.position.set(205, 0.05, 60); island.receiveShadow = true;
  scene.add(island);
  // runway
  const runway = new THREE.Mesh(new THREE.PlaneGeometry(14, 150), new THREE.MeshLambertMaterial({ color: 0x2e323c }));
  runway.rotation.x = -Math.PI / 2; runway.position.set(205, 0.08, 60); scene.add(runway);
  for (let z = -5; z < 130; z += 12) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dash.rotation.x = -Math.PI / 2; dash.position.set(205, 0.1, z); scene.add(dash);
  }
  // control tower
  const tower = box(6, 26, 6, 0xe8e2d2, 178, 13, 10);
  scene.add(tower);
  const cab = box(9, 4, 9, 0x2ec4b6, 178, 28, 10, { emissive: 0x2ec4b6, glow: 0.4 });
  scene.add(cab);
  G.world.colliders.push({ minX: 174, maxX: 182, minZ: 6, maxZ: 14 });
  // terminal
  const term = box(24, 8, 30, 0xf6e3c5, 178, 4, 60);
  scene.add(term);
  G.world.colliders.push({ minX: 165, maxX: 191, minZ: 44, maxZ: 76 });
  // parked plane (simple fuselage + wings + tail)
  const plane = new THREE.Group();
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 26, 10), new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }));
  fus.rotation.x = Math.PI / 2; plane.add(fus);
  const wing = box(30, 0.4, 4.5, 0x2ec4b6, 0, 0, 0); plane.add(wing);
  const tail = box(9, 0.4, 3, 0x2ec4b6, 0, 1.5, -12); plane.add(tail);
  const fin = box(0.4, 4.5, 3, 0xff5e62, 0, 2.6, -12); plane.add(fin);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0xff5e62 }));
  nose.position.set(0, 0, 13); plane.add(nose);
  plane.position.set(222, 2.4, 30);
  plane.rotation.y = 0.5;
  scene.add(plane);
}
