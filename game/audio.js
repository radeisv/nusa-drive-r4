// Audio: everything synthesized with WebAudio — no samples, no files.
let ctx = null;
let engineNodes = null;
let sirenNodes = null;
let musicTimer = null;
let radioOn = true;
const SONGS = [
  { station: 'NUSA FM 98.4', song: 'Sunset Surf — Ombak Rindu' },
  { station: 'NUSA FM 98.4', song: 'Golden Hour — Lagu Senja' },
  { station: 'RADIO PANTAI 91.2', song: 'Island Pop — Kala Pesisir' },
  { station: 'WAVE 88.1', song: 'Neon Drive — Pink Horizon' },
];
let songIndex = 0;

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function currentSong() { return SONGS[songIndex % SONGS.length]; }
export function nextSong() { songIndex++; return currentSong(); }
export function toggleRadio() { radioOn = !radioOn; return radioOn; }

function tone(freq, dur, type, gain, when = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export function startEngine(rpm = 1) {
  ensureAudio();
  if (!ctx || engineNodes) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.value = 55 * rpm;
  g.gain.value = 0.03;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 420;
  o.connect(f).connect(g).connect(ctx.destination);
  o.start();
  engineNodes = { o, g };
}
export function setEngine(rpm) {
  if (engineNodes && ctx) engineNodes.o.frequency.setTargetAtTime(48 + rpm * 90, ctx.currentTime, 0.08);
}
export function stopEngine() {
  if (!engineNodes) return;
  try { engineNodes.o.stop(); } catch (err) { /* already stopped */ }
  engineNodes = null;
}

export function playSiren(on) {
  ensureAudio();
  if (!ctx) return;
  if (on && !sirenNodes) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 720;
    g.gain.value = 0.035;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1.4;
    const lg = ctx.createGain(); lg.gain.value = 260;
    lfo.connect(lg).connect(o.frequency);
    o.connect(g).connect(ctx.destination);
    o.start(); lfo.start();
    sirenNodes = { o, lfo, g };
  } else if (!on && sirenNodes) {
    try { sirenNodes.o.stop(); sirenNodes.lfo.stop(); } catch (err) { /* stopped */ }
    sirenNodes = null;
  }
}

export function playGunshot() {
  ensureAudio();
  if (!ctx) return;
  const dur = 0.16;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400;
  const g = ctx.createGain(); g.gain.value = 0.5;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start();
  tone(180, 0.08, 'square', 0.12);
}

export function playHit() { tone(140, 0.12, 'square', 0.18); }
export function playCash() { tone(880, 0.1, 'sine', 0.16); tone(1318, 0.18, 'sine', 0.16, 0.09); }
export function playCrash() { tone(70, 0.3, 'sawtooth', 0.25); }
export function playPickup() { tone(660, 0.08, 'sine', 0.15); tone(990, 0.12, 'sine', 0.15, 0.07); }

const MELODY = [0, 3, 5, 7, 10, 7, 5, 3, 0, -2, 0, 3, 5, 3, 2, 0];
export function musicLoop() {
  ensureAudio();
  if (!ctx || musicTimer) return;
  let step = 0;
  musicTimer = window.setInterval(() => {
    if (!radioOn || !ctx) return;
    const base = 220;
    const n = MELODY[step % MELODY.length];
    const freq = base * Math.pow(2, n / 12);
    tone(freq, 0.32, 'triangle', 0.05);
    if (step % 4 === 0) tone(base / 2, 0.5, 'sine', 0.07);
    step++;
  }, 260);
}
export function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
