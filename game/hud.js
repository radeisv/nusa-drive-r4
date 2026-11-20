// HUD: all DOM readouts + the circular coloured minimap (canvas, top-down).
import { currentMissionDef } from './missions.js';
import { policeListForHud } from './police.js';
import { speedKmh } from './vehicles.js';
import { currentSong } from './audio.js';

const $ = (id) => document.getElementById(id);
const WEAPONS = [
  { key: '1', name: 'FISTS', ammo: '∞', id: 'fists' },
  { key: '2', name: 'PISTOL', ammo: '60', id: 'pistol' },
  { key: '3', name: 'SMG', ammo: '0', id: 'smg' },
  { key: '4', name: 'SHOTGUN', ammo: '—', id: 'shotgun', locked: true },
];
const CREW = [
  { name: 'SWAP PLATES', who: 'Sinta · Fixer', key: 'Z', cls: '' },
  { name: 'QUICK FIX', who: 'Bayu · Mechanic', key: 'X', cls: 'b2' },
  { name: 'EYES OUT', who: 'Kiki · Lookout', key: 'C', cls: 'b3' },
];

export function initHud(G) {
  $('weapon-slots').innerHTML = WEAPONS.map((w) => (
    `<div class="weapon-slot${w.locked ? ' locked' : ''}${w.id === 'fists' ? ' active' : ''}" data-w="${w.id}">
      <div class="num">${w.key}</div><div class="wname">${w.name}</div><div class="ammo">${w.locked ? 'LOCKED' : w.ammo}</div>
    </div>`
  )).join('');
  $('crew-cards').innerHTML = CREW.map((c) => (
    `<div class="crew-card"><div class="avatar ${c.cls}">${c.name[0]}</div><div><b>${c.name}</b><span>${c.who}</span></div><div class="key">${c.key}</div></div>`
  )).join('');
}

export function showToast(G, text) {
  const el = $('toast');
  el.textContent = text;
  el.style.opacity = 1;
  clearTimeout(G.toastTimer);
  G.toastTimer = setTimeout(() => { el.style.opacity = 0; }, 2600);
}
export function flashObjective(text) {
  const el = $('objective-flash');
  el.textContent = '★ ' + text;
  el.style.opacity = 1;
  setTimeout(() => { el.style.opacity = 0; }, 2600);
}

export function showDialogue(G, name, text) {
  const box = $('dialogue');
  box.classList.remove('hidden');
  $('dialogue-name').textContent = name;
  $('dialogue-text').textContent = text;
  $('dialogue-portrait').textContent = (name[0] || 'S');
}

export function hideDialogue() { $('dialogue').classList.add('hidden'); }

function fmtClock(hours) {
  const h = Math.floor(hours) % 24;
  const m = Math.floor((hours % 1) * 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function updateHud(G) {
  const m = currentMissionDef(G);
  const stage = m.stages[Math.min(G.mission.stage, m.stages.length - 1)];
  $('mission-chapter').textContent = m.chapter;
  $('mission-title').textContent = m.title;
  $('mission-stage-label').textContent = 'STAGE ' + (G.mission.stage + 1) + '/' + m.stages.length;
  $('mission-stage-fill').style.width = ((G.mission.stage + 1) / m.stages.length * 100) + '%';
  $('mission-objective').textContent = stage.objective;
  $('mission-next').textContent = 'NEXT  ' + stage.next;
  const t = Math.max(0, Math.ceil(G.mission.timer));
  $('mission-timer').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');

  // wanted stars
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < G.wanted ? '★' : '<span class="off">★</span>';
  $('wanted-stars').innerHTML = stars;
  $('wanted-status').textContent = G.wanted === 0 ? 'CLEAN' : G.wanted >= 4 ? 'MANHUNT — LOSE THE HEAT' : G.wanted >= 3 ? 'AIR UNIT DEPLOYED' : 'IN SIGHT — POLISI NUSA ON YOU';
  $('wanted-status').style.color = G.wanted === 0 ? '#7dff9e' : '#ff6b5e';

  $('clock').textContent = fmtClock(G.clockHours) + ' · DAY ' + G.day;
  $('cash').textContent = '$' + Math.round(G.cash).toLocaleString('en-US');
  $('respect-fill').style.width = Math.min(100, (G.respect % 400) / 4) + '%';
  const rank = G.respect < 400 ? 'STREET KID' : G.respect < 1000 ? 'CREW DRIVER' : G.respect < 2000 ? 'SHOT CALLER' : 'ISLAND KING';
  $('respect-label').textContent = rank + '  ' + G.respect.toLocaleString('en-US') + ' RP';

  // police panel
  const list = policeListForHud(G);
  $('police-panel').classList.toggle('hidden', list.length === 0);
  $('police-count').textContent = list.length + ' UNITS';
  $('police-list').innerHTML = list.map((u) => (
    `<div class="police-row"><b>▲ ${u.name}</b><span class="role">${u.role}</span><span class="dist">${u.dist} m</span></div>`
  )).join('') + (G.wanted >= 4 ? '<div class="police-row"><b>▲ ROADBLOCK</b><span class="role">AHEAD</span><span class="dist">80 m</span></div>' : '');

  // weapons
  document.querySelectorAll('.weapon-slot').forEach((el) => {
    const id = el.dataset.w;
    el.classList.toggle('active', G.player.weapon === id);
    const ammoEl = el.querySelector('.ammo');
    if (id === 'pistol') ammoEl.textContent = G.player.ammo.pistol;
    if (id === 'smg') ammoEl.textContent = G.player.ammo.smg > 0 ? G.player.ammo.smg : 'LOCKED';
    if (id === 'fists') ammoEl.textContent = '∞';
  });

  // vitals
  $('health-fill').style.width = G.player.health + '%';
  $('health-num').textContent = Math.round(G.player.health);
  $('armour-fill').style.width = G.player.armour + '%';
  $('armour-num').textContent = Math.round(G.player.armour);

  // speed + car
  const kmh = G.car ? speedKmh(G.car) : 0;
  $('speed-num').textContent = kmh;
  $('car-name').textContent = G.car ? G.car.name + ' · ' + G.car.def.type.toUpperCase() : 'ON FOOT';
  $('car-cond').textContent = G.car ? 'CONDITION ' + Math.round(G.car.condition) + '%' : 'RAKA · ON FOOT';
  $('nitro-fill').style.width = (G.car ? G.car.nitro : 100) + '%';
  const song = currentSong();
  $('radio-line').textContent = song.station + ' · ' + song.song;

  // location name from position
  $('location-name').textContent = locationName(G);
  $('location-sub').textContent = 'Kota Nusa · ' + locationSub(G);

  // dialogue countdown
  if (G.dialogue) {
    G.dialogue.t -= 1 / 60;
    if (G.dialogue.t <= 0) { G.dialogue = null; hideDialogue(); }
  }
  $('damage-vignette').style.opacity = G.damageFlash > 0 ? Math.min(1, G.damageFlash) : 0;
  if (G.damageFlash > 0) G.damageFlash -= 0.02;
  $('crosshair').classList.toggle('hidden', G.player.weapon === 'fists' || G.player.onFoot === false);

  drawMinimap(G);
}

export function locationName(G) {
  const x = G.player.onFoot ? G.player.pos.x : (G.car ? G.car.pos.x : 0);
  const z = G.player.onFoot ? G.player.pos.z : (G.car ? G.car.pos.z : 0);
  if (x < -140) return 'PANTAI NUSA';
  if (x > 170) return 'BANDARA NUSA';
  if (x > 140) return 'AIRPORT BRIDGE';
  if (Math.abs(x) < 12 && Math.abs(z) < 12) return 'PLAZA SENJA';
  if (Math.abs(x + 120) < 14) return 'PANTAI BOULEVARD';
  if (z > 100) return 'PELABUHAN NUSA';
  if (z < -100) return 'KOTA LAMA';
  return 'DOWNTOWN NUSA';
}

export function locationSub(G) {
  const x = G.player.onFoot ? G.player.pos.x : (G.car ? G.car.pos.x : 0);
  if (x < -140) return 'Beachfront · GRIP 82%';
  if (x > 170) return 'Airport Island · GRIP 74%';
  if (Math.abs(x) < 12) return 'Central Plaza · NEUTRAL · 58';
  return 'City Streets · GRIP 78%';
}

// --- circular coloured minimap ---
export function drawMinimap(G) {
  const cv = $('minimap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const cx = W / 2, cy = H / 2, R = W / 2;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  // land
  ctx.fillStyle = '#2c4a3a'; ctx.fillRect(0, 0, W, H);
  const scale = W / 520;
  const toMap = (x, z) => [cx + x * scale, cy + z * scale];
  // sea + beach
  ctx.fillStyle = '#1e7f9e';
  ctx.fillRect(0, 0, (cx - 150 * scale), H);
  ctx.fillStyle = '#f2d8a0';
  ctx.fillRect(cx - 185 * scale, 0, 45 * scale, H);
  // lagoon + airport island
  ctx.fillStyle = '#2a8aa8';
  ctx.fillRect(cx + 135 * scale, cy - 50 * scale, 46 * scale, 220 * scale);
  ctx.fillStyle = '#8f9a7a';
  ctx.fillRect(cx + 160 * scale, cy - 50 * scale, 90 * scale, 220 * scale);
  // roads
  ctx.strokeStyle = '#5a6272'; ctx.lineWidth = 5;
  for (const x of G.world.roadXs) { const [mx] = toMap(x, 0); ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke(); }
  for (const z of G.world.roadZs) { const [, mz] = toMap(0, z); ctx.beginPath(); ctx.moveTo(0, mz); ctx.lineTo(W, mz); ctx.stroke(); }
  ctx.strokeStyle = '#ffd21f'; ctx.lineWidth = 1;
  for (const x of G.world.roadXs) { const [mx] = toMap(x, 0); ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke(); }
  // buildings as warm blocks
  ctx.fillStyle = '#e8a87c';
  for (const c of G.world.colliders) {
    if (c.bridge) continue;
    const [x1, z1] = toMap(c.minX, c.minZ);
    const [x2, z2] = toMap(c.maxX, c.maxZ);
    ctx.fillRect(x1, z1, Math.max(2, x2 - x1), Math.max(2, z2 - z1));
  }
  // mission beacon
  if (G.beacon && G.beacon.visible) {
    const [bx, bz] = toMap(G.beacon.position.x, G.beacon.position.z);
    ctx.fillStyle = '#ffd21f';
    ctx.beginPath(); ctx.arc(bx, bz, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  }
  // police (red/blue) and traffic (white) dots
  for (const car of G.police) {
    const [mx, mz] = toMap(car.pos.x, car.pos.z);
    ctx.fillStyle = '#ff3333'; ctx.beginPath(); ctx.arc(mx, mz, 4, 0, Math.PI * 2); ctx.fill();
  }
  for (const car of G.traffic) {
    const [mx, mz] = toMap(car.pos.x, car.pos.z);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx, mz, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // player arrow (rotates with heading)
  const px = G.player.onFoot ? G.player.pos.x : (G.car ? G.car.pos.x : 0);
  const pz = G.player.onFoot ? G.player.pos.z : (G.car ? G.car.pos.z : 0);
  const [mx, mz] = toMap(px, pz);
  const heading = G.car ? G.car.angle : G.player.angle;
  ctx.save();
  ctx.translate(mx, mz);
  ctx.rotate(Math.PI - heading);
  ctx.fillStyle = '#ff5e1f';
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  // north arrow
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('N', cx + R - 14, 18);
  ctx.restore();
  // view ring
  ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
}
