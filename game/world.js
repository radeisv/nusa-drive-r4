// World: Kota Nusa — golden-hour island city. Sky, sun, sea, beach, ground,
// bridge to the airport island, and the city builders from city.js.
import * as THREE from 'three';
import { buildBuildings, buildRoads, buildProps, buildAirport } from './city.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildCity(G) {
  const scene = G.scene;
  const rng = mulberry32(20261120);

  // --- golden-hour sky: warm gradient dome + low sun ---
  scene.background = new THREE.Color(0xff9a5c);
  scene.fog = new THREE.Fog(0xffb37a, 180, 520);
  const skyGeo = new THREE.SphereGeometry(600, 24, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x2f6fb4) },
      mid: { value: new THREE.Color(0xffb37a) },
      low: { value: new THREE.Color(0xff7a5c) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 low; void main(){ float h = normalize(vP).y; vec3 c = h > 0.06 ? mix(mid, top, smoothstep(0.06, 0.42, h)) : mix(low, mid, smoothstep(-0.08, 0.06, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const sun = new THREE.DirectionalLight(0xffd9a0, 2.6);
  sun.position.set(-140, 60, -90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -160; sun.shadow.camera.right = 160;
  sun.shadow.camera.top = 160; sun.shadow.camera.bottom = -160;
  sun.shadow.camera.far = 500;
  scene.add(sun);
  G.sun = sun;
  scene.add(new THREE.HemisphereLight(0x8ec9ee, 0x8a6a4a, 0.9));
  const amb = new THREE.AmbientLight(0xffc890, 0.35);
  scene.add(amb);

  // --- ground, beach, sea ---
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(520, 520),
    new THREE.MeshLambertMaterial({ color: 0x7f955f })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 520),
    new THREE.MeshLambertMaterial({ color: 0xf2d8a0 })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(-185, 0.05, 0);
  sand.receiveShadow = true;
  scene.add(sand);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 520),
    new THREE.MeshLambertMaterial({ color: 0x1e7f9e })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(-300, 0.02, 0);
  scene.add(sea);
  // sun glitter strip on the sea
  const glitter = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 520),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.35 })
  );
  glitter.rotation.x = -Math.PI / 2;
  glitter.position.set(-238, 0.04, 0);
  scene.add(glitter);

  // lagoon channel east of downtown, crossed by the airport bridge
  const lagoon = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 220),
    new THREE.MeshLambertMaterial({ color: 0x2a8aa8 })
  );
  lagoon.rotation.x = -Math.PI / 2;
  lagoon.position.set(158, 0.03, 60);
  scene.add(lagoon);

  const world = {
    colliders: [],
    roadXs: [-120, -80, -40, 0, 40, 80, 120],
    roadZs: [-120, -80, -40, 0, 40, 80, 120],
    rng,
    spawnPoints: [],
    markers: {},
  };
  G.world = world;

  buildRoads(G);
  buildBuildings(G);
  buildProps(G);
  buildAirport(G);

  // spawn points: pier, garage, beach, airport
  world.markers.pier = new THREE.Vector3(-118, 0, 20);
  world.markers.garage = new THREE.Vector3(38, 0, -38);
  world.markers.beach = new THREE.Vector3(-150, 0, 60);
  world.markers.airport = new THREE.Vector3(196, 0, 60);
  world.markers.plaza = new THREE.Vector3(0, 0, 0);
  world.markers.bridge = new THREE.Vector3(158, 0, 60);

  // objective marker: floating beacon the missions move around
  const beacon = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 90, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd21f, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.y = 45;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.28, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd21f })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.4;
  beacon.add(beam, ring);
  beacon.visible = false;
  scene.add(beacon);
  G.beacon = beacon;

  return world;
}
