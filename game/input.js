// Input: keyboard state, mouse deltas, click queue. Pointer lock on canvas click.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseDX: 0,
    mouseDY: 0,
    mouseDown: false,
    clicked: false,
    locked: false,
    anyKey: '',
  };
  const keyName = (e) => e.key.length === 1 ? e.key.toLowerCase() : e.key;
  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (!e.repeat) input.anyKey = k;
    input.keys.add(k);
    input.keys.add(e.key);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(keyName(e));
    input.keys.delete(e.key);
  });
  window.addEventListener('blur', () => input.keys.clear());
  document.addEventListener('mousemove', (e) => {
    if (input.locked) { input.mouseDX += e.movementX; input.mouseDY += e.movementY; }
  });
  document.addEventListener('pointerlockchange', () => {
    input.locked = document.pointerLockElement === canvas;
  });
  canvas.addEventListener('click', () => {
    input.clicked = true;
    if (!input.locked && canvas.requestPointerLock) {
      try { canvas.requestPointerLock(); } catch (err) { /* headless: ignore */ }
    }
  });
  canvas.addEventListener('mousedown', () => { input.mouseDown = true; });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });
  input.isDown = (name) => input.keys.has(name);
  input.consumeMouse = () => { const d = { dx: input.mouseDX, dy: input.mouseDY }; input.mouseDX = 0; input.mouseDY = 0; return d; };
  input.consumeClick = () => { const c = input.clicked; input.clicked = false; return c; };
  return input;
}
