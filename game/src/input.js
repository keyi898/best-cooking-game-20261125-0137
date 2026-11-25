// Ember & Thyme — keyboard and mouse input, normalised to one shape the
// kitchen and the game loop both read: { up, down, left, right, interact,
// interactPressed, clickTarget, pantryPicks }.

const PANTRY_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const PANTRY_ORDER = ['tomato', 'lettuce', 'bread', 'cheese', 'pasta', 'mushroom', 'berry', 'dough', 'rice', 'egg'];

export class Input {
  constructor(canvas) {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.interactPressed = false; // edge-triggered: true for one frame
    this.clickTarget = null; // persistent walk target { x, y }, or null
    this.newClick = null; // a click that arrived since the last frame, or null
    // Pantry picks are a queue, not one slot: two quick number presses must
    // both land, even if they arrive between animation frames.
    this.pantryPicks = [];
    this.anyKey = false; // any key pressed — used to dismiss title screens
    this.keys = new Set();
    this.canvas = canvas;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouse = this.onMouse.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousedown', this.onMouse);
  }

  onKeyDown(event) {
    const key = event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) event.preventDefault();
    if (event.repeat) return;
    this.anyKey = true;
    this.keys.add(key.length === 1 ? key.toLowerCase() : key);
    if (key === 'ArrowUp' || key === 'w' || key === 'W') this.up = true;
    if (key === 'ArrowDown' || key === 's' || key === 'S') this.down = true;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.left = true;
    if (key === 'ArrowRight' || key === 'd' || key === 'D') this.right = true;
    if (key === 'e' || key === 'E' || key === ' ') this.interactPressed = true;
    const pickIndex = PANTRY_KEYS.indexOf(key);
    if (pickIndex !== -1 && PANTRY_ORDER[pickIndex]) this.pantryPicks.push(PANTRY_ORDER[pickIndex]);
    if (key === 'm' || key === 'M') this.mutePressed = true;
  }

  onKeyUp(event) {
    const key = event.key;
    this.keys.delete(key.length === 1 ? key.toLowerCase() : key);
    if (key === 'ArrowUp' || key === 'w' || key === 'W') this.up = false;
    if (key === 'ArrowDown' || key === 's' || key === 'S') this.down = false;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.left = false;
    if (key === 'ArrowRight' || key === 'd' || key === 'D') this.right = false;
  }

  onMouse(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    this.clickTarget = { x, y };
    this.newClick = { x, y };
    this.anyKey = true;
  }

  // Snapshot for one frame: edges are consumed here so a press fires once.
  // The click target is consumed too — main.js re-sets it to the walk target.
  frame() {
    const snapshot = {
      up: this.up,
      down: this.down,
      left: this.left,
      right: this.right,
      interactPressed: this.interactPressed,
      clickTarget: this.newClick,
      pantryPicks: this.pantryPicks,
      anyKey: this.anyKey,
      mutePressed: this.mutePressed ?? false,
    };
    this.interactPressed = false;
    this.newClick = null;
    this.pantryPicks = [];
    this.anyKey = false;
    this.mutePressed = false;
    return snapshot;
  }

  // The kitchen owns clickTarget while the chef walks to it; clear it when the
  // player steers with keys instead.
  clearClick() {
    this.clickTarget = null;
  }
}
