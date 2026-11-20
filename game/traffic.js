// Traffic: civilian cars that follow the road grid, stop for the player,
// and scatter when the player rams them.
import { createCar, CAR_DEFS } from './vehicles.js';

export function spawnTraffic(G, count = 14) {
  const rng = G.world.rng;
  const civDefs = CAR_DEFS.filter((d) => d.type !== 'police');
  for (let i = 0; i < count; i++) {
    const def = civDefs[Math.floor(rng() * civDefs.length)];
    const vertical = rng() < 0.5;
    const road = vertical
      ? G.world.roadXs[Math.floor(rng() * G.world.roadXs.length)]
      : G.world.roadZs[Math.floor(rng() * G.world.roadZs.length)];
    const along = -140 + rng() * 280;
    const x = vertical ? road + (rng() < 0.5 ? -2.2 : 2.2) : along;
    const z = vertical ? along : road + (rng() < 0.5 ? -2.2 : 2.2);
    const angle = vertical ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    const car = createCar(G, def, x, z, angle);
    car.driver = 'traffic';
    car.speed = 7 + rng() * 6;
    car.lane = { vertical, road, dir: rng() < 0.5 ? 1 : -1 };
    G.traffic.push(car);
  }
}

export function updateTraffic(G, dt) {
  for (const car of G.traffic) {
    if (!car.lane) continue;
    // slow down if a car (or the player) is right ahead
    let blocked = false;
    const ahead = 9;
    const ax = car.pos.x + Math.sin(car.angle) * ahead;
    const az = car.pos.z + Math.cos(car.angle) * ahead;
    for (const other of G.cars) {
      if (other === car) continue;
      if (Math.hypot(other.pos.x - ax, other.pos.z - az) < 4) { blocked = true; break; }
    }
    const target = blocked ? 0 : 9 + Math.sin(car.pos.x * 0.01 + car.pos.z * 0.01) * 2;
    car.speed += (target - car.speed) * Math.min(1, dt * 1.5);
    // stay in lane: gently steer back toward the road line
    const lane = car.lane;
    const desired = lane.vertical
      ? (lane.dir > 0 ? 0 : Math.PI)
      : (lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    let diff = desired - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.angle += diff * Math.min(1, dt * 1.2);
    car.pos.x += Math.sin(car.angle) * car.speed * dt;
    car.pos.z += Math.cos(car.angle) * car.speed * dt;
    // loop around the city edge
    if (car.pos.x < -150) car.pos.x = 150;
    if (car.pos.x > 150) car.pos.x = -150;
    if (car.pos.z < -150) car.pos.z = 150;
    if (car.pos.z > 150) car.pos.z = -150;
    car.mesh.position.copy(car.pos);
    car.mesh.rotation.y = car.angle;
    const spin = car.speed * dt * 2.4;
    for (const w of car.mesh.userData.wheels) w.rotation.x += spin;
  }
}

export function spawnParkedCars(G) {
  const rng = G.world.rng;
  const civDefs = CAR_DEFS.filter((d) => d.type !== 'police');
  const spots = [
    [-112, -20, Math.PI / 2], [-112, 44, Math.PI / 2], [-126, -60, 0], [-86, 90, Math.PI],
    [34, -46, Math.PI / 2], [74, 10, 0], [-46, 74, Math.PI / 2], [114, -70, Math.PI],
    [-6, -86, 0], [86, -46, Math.PI / 2], [-126, 110, Math.PI / 2], [46, 86, 0],
  ];
  for (const [x, z, a] of spots) {
    const def = civDefs[Math.floor(rng() * civDefs.length)];
    const car = createCar(G, def, x, z, a);
    car.driver = 'parked';
    car.speed = 0;
  }
}
