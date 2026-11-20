// Nusa Drive — boot + game loop. Raka, a stolen Komodo GT, and the whole
// island of Kota Nusa: drive, steal, run from Polisi Nusa, do the four jobs.
import * as THREE from 'three';
import { buildCity } from './world.js';
import { createInput } from './input.js';
import { createPlayer, updatePlayerOnFoot, nearestCar, enterCar, exitCar, punch } from './player.js';
import { createCar, updateDriving, CAR_DEFS } from './vehicles.js';
import { spawnTraffic, updateTraffic, spawnParkedCars } from './traffic.js';
import { spawnPedestrians, updatePedestrians } from './pedestrians.js';
import { updatePolice, raiseWanted } from './police.js';
import { startMission, updateMissions, sayLine } from './missions.js';
import { shoot, updateCombat, spawnPickups, updatePickups, spawnGuards } from './combat.js';
import { initHud, updateHud, showToast, flashObjective, showDialogue, hideDialogue } from './hud.js';
import { createCamera, updateCamera, updateLighting } from './render.js';
import { applyShotPreset, updateShotMode } from './shots.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { ensureAudio, musicLoop, playGunshot, setEngine, nextSong, toggleRadio } from './audio.js';

const G = {
  scene: null, camera: null, renderer: null, input: null,
  world: null, sun: null, beacon: null,
  player: null, car: null, cars: [], traffic: [], peds: [], police: [], heli: null,
  enemies: [], pickups: [], tracers: [],
  wanted: 0, heatTimer: 0, cash: 12480, respect: 140,
  mission: { index: 0, stage: 0, timer: 300, active: true, done: [false, false, false, false], target: null, dist: 0 },
  dialogue: null, clockHours: 18.67, day: 3,
  cameraAngle: Math.PI, started: false, paused: false,
  gunshotT: 0, muzzleT: 0, damageFlash: 0,
  shotMode: 0, shotDrive: false, shotTargetSpeed: 31, shotFireAt: 0,
  toastTimer: 0, guardsSpawned: false,
};
G.toast = (t) => showToast(G, t);
G.flashObjective = (t) => flashObjective(t);
window.__nusa = G;

function boot() {
  const loading = document.getElementById('loading');
  G.scene = new THREE.Scene();
  G.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  G.renderer.setSize(window.innerWidth, window.innerHeight);
  G.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  G.renderer.shadowMap.enabled = true;
  G.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('game').appendChild(G.renderer.domElement);
  G.input = createInput(G.renderer.domElement);
  createCamera(G);
  buildCity(G);
  createPlayer(G);
  initHud(G);

  // the mission-1 getaway car, parked by the pier, waiting to be stolen
  const komodo = CAR_DEFS.find((d) => d.name === 'KOMODO GT');
  const getaway = createCar(G, komodo, -112, -20, Math.PI / 2);
  getaway.driver = 'parked';
  spawnParkedCars(G);
  spawnTraffic(G, 14);
  spawnPedestrians(G, 26);
  spawnPickups(G);

  // a shot preset stages the game itself; otherwise show the start screen
  const staged = applyShotPreset(G);
  if (!staged) {
    startMission(G, 0);
    document.getElementById('btn-continue').textContent = hasSave()
      ? 'CONTINUE — DAY ' + G.day + ' · $' + G.cash.toLocaleString('en-US')
      : 'CONTINUE — DAY 3 · $12,480';
  }
  wireMenus();
  loading.style.display = 'none';
  if (G.started) document.getElementById('hud').classList.remove('hidden');
  animate(0);
}

function wireMenus() {
  const startGame = (fresh) => {
    ensureAudio();
    musicLoop();
    if (fresh) {
      G.cash = 12480; G.respect = 140; G.day = 1; G.clockHours = 18.67;
      G.mission.done = [false, false, false, false];
      startMission(G, 0);
    } else {
      const data = loadGame(G);
      if (data) {
        G.toast('SAVE LOADED — DAY ' + G.day + ' · $' + Math.round(G.cash).toLocaleString('en-US'));
        startMission(G, G.mission.index);
        G.mission.stage = data.missionStage || 0;
        // bring the saved car back: parked beside the player, ready to drive
        if (data.carName) {
          const def = CAR_DEFS.find((d) => d.name === data.carName) || CAR_DEFS[0];
          const saved = createCar(G, def, G.player.pos.x + 4, G.player.pos.z, 0);
          saved.driver = 'parked';
        }
      }
    }
    G.started = true;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  };
  document.getElementById('btn-continue').addEventListener('click', () => startGame(false));
  document.getElementById('btn-new').addEventListener('click', () => startGame(true));
  document.getElementById('btn-how').addEventListener('click', () => {
    showDialogue(G, 'SINTA · FIXER', 'WASD to drive or walk. E to steal a car. SPACE brakes, SHIFT is nitro. Click to shoot, 1 and 2 swap weapons, M changes the radio, ESC pauses and saves.');
    G.dialogue = { name: 'SINTA · FIXER', text: '', t: 12 };
  });
  document.getElementById('btn-resume').addEventListener('click', () => { G.paused = false; document.getElementById('pause-menu').classList.add('hidden'); });
  document.getElementById('btn-save').addEventListener('click', () => { saveGame(G); G.toast('GAME SAVED — DAY ' + G.day); });
  document.getElementById('btn-load').addEventListener('click', () => {
    if (loadGame(G)) { G.toast('SAVE LOADED'); startMission(G, G.mission.index); }
    else G.toast('NO SAVE FOUND');
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    G.cash = 12480; G.respect = 140; G.day = 1;
    startMission(G, 0);
    G.paused = false;
    document.getElementById('pause-menu').classList.add('hidden');
    G.toast('DAY RESTARTED');
  });
}

let lastT = 0;
let ePressed = false;
function animate(t) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  if (!G.paused) step(G, dt);
  G.renderer.render(G.scene, G.camera);
}

function step(G, dt) {
  const input = G.input;
  // pause
  if (input.isDown('Escape') && !G.escHeld) {
    G.escHeld = true;
    if (G.started) {
      G.paused = !G.paused;
      document.getElementById('pause-menu').classList.toggle('hidden', !G.paused);
    }
  }
  if (!input.isDown('Escape')) G.escHeld = false;
  if (!G.started || G.paused) return;

  // radio
  if (input.anyKey === 'm') { input.anyKey = ''; const on = toggleRadio(); G.toast(on ? 'RADIO ON — ' + nextSong().song : 'RADIO OFF'); }
  // weapons
  if (input.anyKey === '1') { input.anyKey = ''; G.player.weapon = 'fists'; }
  if (input.anyKey === '2') { input.anyKey = ''; G.player.weapon = 'pistol'; G.player.ammo.pistol = Math.max(G.player.ammo.pistol, 12); }
  if (input.anyKey === '3' && G.player.ammo.smg > 0) { input.anyKey = ''; G.player.weapon = 'smg'; }

  // enter / exit car
  if (input.isDown('e') && !ePressed) {
    ePressed = true;
    if (G.car) exitCar(G);
    else {
      const near = nearestCar(G, 5.5);
      if (near) enterCar(G, near);
      else G.toast('NO CAR NEARBY — FIND A PARKED CAR');
    }
  }
  if (!input.isDown('e')) ePressed = false;

  if (G.car) {
    updateDriving(G, G.car, dt, input);
    setEngine(Math.abs(G.car.speed) / 40);
    // punch from the car does nothing; shooting from the car is drive-by
    if (input.mouseDown && !G.shotHeld) { G.shotHeld = true; }
    if (!input.mouseDown) G.shotHeld = false;
  } else {
    updatePlayerOnFoot(G, dt, input);
    if (input.isDown('f')) punch(G);
    if ((input.mouseDown || input.consumeClick()) && !G.shotHeld) {
      G.shotHeld = true;
      shoot(G);
    }
    if (!input.mouseDown) G.shotHeld = false;
  }

  // mission 4 guards appear when the heist reaches the harbour
  if (G.mission.index === 3 && G.mission.stage === 1 && !G.guardsSpawned) {
    G.guardsSpawned = true;
    spawnGuards(G, [[-116, 82], [-122, 78], [-112, 70], [-124, 64]]);
    sayLine(G, 'BAYU · MECHANIC', 'Guards incoming! Keep your head down and your finger ready.');
  }
  if (G.mission.index !== 3) G.guardsSpawned = false;

  updateTraffic(G, dt);
  updatePedestrians(G, dt);
  updatePolice(G, dt);
  updateMissions(G, dt);
  updateCombat(G, dt);
  updatePickups(G, dt);
  updateCamera(G, dt);
  updateLighting(G, dt);
  updateShotMode(G);
  updateHud(G);
  if (G.dialogue && G.dialogue.text) showDialogue(G, G.dialogue.name, G.dialogue.text);
}

try {
  boot();
} catch (err) {
  const loading = document.getElementById('loading');
  if (loading) loading.textContent = 'FAILED TO LOAD: ' + err.message;
  console.error(err);
}
