// Render: low close chase camera, golden-hour light, muzzle flash,
// speed effects and the day clock.
import * as THREE from 'three';

export function createCamera(G) {
  G.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);
  G.camera.position.set(-112, 6, 60);
  G.cameraAngle = Math.PI;
  G.cameraDist = 10.5;
  window.addEventListener('resize', () => {
    G.camera.aspect = window.innerWidth / window.innerHeight;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function updateCamera(G, dt) {
  const cam = G.camera;
  let target, angle;
  if (G.car) {
    target = G.car.pos;
    angle = G.car.angle;
    G.cameraAngle = angle;
  } else {
    target = G.player.pos;
    angle = G.cameraAngle || 0;
  }
  // low close chase camera, slightly to the side so the car reads big.
  // In shot mode the camera snaps: headless SwiftShader runs at a few fps,
  // so a lerped camera would still be travelling when the frame is taken.
  const dist = G.car ? 7.6 : 7.0;
  const height = G.car ? 2.9 : 2.7;
  const back = angle + Math.PI;
  const cx = target.x + Math.sin(back) * dist + Math.cos(back) * 1.6;
  const cz = target.z + Math.cos(back) * dist - Math.sin(back) * 1.6;
  const desired = new THREE.Vector3(cx, height, cz);
  if (G.shotMode) cam.position.copy(desired);
  else cam.position.lerp(desired, Math.min(1, dt * 5));
  const look = new THREE.Vector3(
    target.x + Math.sin(angle) * 6,
    G.car ? 1.4 : 1.6,
    target.z + Math.cos(angle) * 6
  );
  cam.lookAt(look);
  // speed FOV kick
  const speed = G.car ? Math.abs(G.car.speed) : 0;
  const targetFov = 62 + Math.min(14, speed * 0.32);
  if (Math.abs(cam.fov - targetFov) > 0.2) {
    cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 3);
    cam.updateProjectionMatrix();
  }
  // muzzle flash light
  if (G.muzzleT > 0 && !G.flashLight) {
    G.flashLight = new THREE.PointLight(0xffe9a8, 30, 18);
    G.scene.add(G.flashLight);
  }
  if (G.flashLight) {
    G.flashLight.visible = G.muzzleT > 0;
    if (G.muzzleT > 0) {
      G.flashLight.position.set(G.player.pos.x + Math.sin(G.cameraAngle || 0) * 2, 1.6, G.player.pos.z + Math.cos(G.cameraAngle || 0) * 2);
    }
  }
}

export function updateLighting(G, dt) {
  // the sun sinks slowly through the golden hour as the in-game clock runs
  G.clockHours += dt * 0.004;
  if (G.clockHours >= 24) { G.clockHours -= 24; G.day++; }
  const t = ((G.clockHours - 17) / 4); // 0 at 17:00, 1 at 21:00
  const sink = Math.max(0, Math.min(1, t));
  const sun = G.sun;
  if (sun) {
    sun.position.set(-140 + sink * 40, 60 - sink * 38, -90);
    const warm = new THREE.Color(0xffd9a0).lerp(new THREE.Color(0xff5e62), sink * 0.8);
    sun.color = warm;
    sun.intensity = 2.6 - sink * 0.9;
  }
  // beacon pulse
  if (G.beacon && G.beacon.visible) {
    G.beacon.rotation.y += dt * 0.8;
    const s = 1 + Math.sin(performance.now() * 0.004) * 0.12;
    G.beacon.scale.set(s, 1, s);
  }
}
