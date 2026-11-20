// Save / load through localStorage. One slot, versioned, plain JSON.
const SAVE_KEY = 'nusa-drive-save-v1';

export function saveGame(G) {
  try {
    const data = {
      version: 1,
      savedAt: Date.now(),
      cash: G.cash,
      respect: G.respect,
      health: G.player.health,
      armour: G.player.armour,
      missionIndex: G.mission.index,
      missionStage: G.mission.stage,
      missionsDone: G.mission.done.slice(),
      clockHours: G.clockHours,
      day: G.day,
      playerPos: [G.player.pos.x, G.player.pos.y, G.player.pos.z],
      playerAngle: G.player.angle,
      carName: G.car ? G.car.name : null,
      carColor: G.car ? G.car.colorHex : null,
      wanted: G.wanted,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) { return false; }
}

export function loadGame(G) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    G.cash = data.cash ?? G.cash;
    G.respect = data.respect ?? G.respect;
    G.player.health = data.health ?? 100;
    G.player.armour = data.armour ?? 0;
    G.mission.index = data.missionIndex ?? 0;
    G.mission.stage = data.missionStage ?? 0;
    if (Array.isArray(data.missionsDone)) G.mission.done = data.missionsDone;
    G.clockHours = data.clockHours ?? 18.67;
    G.day = data.day ?? 1;
    if (Array.isArray(data.playerPos)) G.player.pos.set(data.playerPos[0], data.playerPos[1], data.playerPos[2]);
    if (typeof data.playerAngle === 'number') G.player.angle = data.playerAngle;
    G.wanted = 0;
    return data;
  } catch (err) { return null; }
}

export function hasSave() {
  try { return localStorage.getItem(SAVE_KEY) !== null; } catch (err) { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* storage unavailable */ }
}
