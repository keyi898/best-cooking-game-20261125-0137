// Ember & Thyme — the kitchen itself: stations, the chef, and every interaction.
// The kitchen is one room. The chef walks the floor; each station is a rectangle
// the chef stands beside and uses with the interact key (or a click). Stations
// hold work in progress: a board chops, two burners cook, one oven bakes, and a
// plate assembles a dish. Nothing here draws anything — render.js does that.

import {
  BAKE_SECONDS,
  BURN_SECONDS,
  CARRY_SLOTS,
  CHOP_SECONDS,
  COOK_SECONDS,
} from './config.js';
import { INGREDIENTS, PREP, matchRecipe } from './recipes.js';

// Station rectangles in canvas pixels (VIEW 1280x720). The top strip is the
// order board; stations line the back wall; the floor below is open walking space.
export const STATIONS = {
  pantry: { id: 'pantry', name: 'Pantry', x: 36, y: 128, w: 208, h: 118 },
  board: { id: 'board', name: 'Chopping Board', x: 268, y: 128, w: 190, h: 118 },
  stove: { id: 'stove', name: 'Stove', x: 482, y: 128, w: 220, h: 118 },
  oven: { id: 'oven', name: 'Oven', x: 726, y: 128, w: 170, h: 118 },
  plate: { id: 'plate', name: 'Plating Counter', x: 920, y: 128, w: 190, h: 118 },
  serve: { id: 'serve', name: 'Serving Window', x: 1134, y: 128, w: 110, h: 240 },
  trash: { id: 'trash', name: 'Bin', x: 36, y: 560, w: 120, h: 100 },
};

export const FLOOR = { x: 20, y: 262, w: 1240, h: 420 };
const CHEF_R = 26;
const CHEF_SPEED = 280;

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

// The chef stands on the floor side of a station to use it. The serving
// window's use point is out on the open floor, clear of the plating counter
// beside it, so the chef can always reach it.
export function stationUsePoint(station) {
  const c = stationCenter(station);
  if (station.id === 'serve') return { x: station.x - 34, y: station.y + 180 };
  return { x: c.x, y: station.y + station.h + 40 };
}

export class Kitchen {
  constructor() {
    this.reset();
  }

  reset() {
    this.chef = { x: 640, y: 520, vx: 0, vy: 0, facing: 'down', moving: false, walkPhase: 0 };
    this.carried = []; // items { id, prep } — at most CARRY_SLOTS
    this.dish = null; // a finished dish the chef carries, { recipeId }
    this.boardJob = null; // { item, progress, duration }
    this.boardItem = null; // a chopped item waiting on the board
    this.burners = [
      { item: null, progress: 0, duration: COOK_SECONDS, burnt: false },
      { item: null, progress: 0, duration: COOK_SECONDS, burnt: false },
    ];
    this.ovenJob = null; // { item, progress, duration }
    this.ovenItem = null; // a baked item waiting in the oven
    this.plate = []; // items placed on the plating counter
    this.plateReady = null; // recipe matched on the plate, or null
    this.nearStation = null;
    this.toast = null; // { text, ttl }
    this.busyUntil = 0; // small lockout after an action so one press is one action
  }

  say(text) {
    this.toast = { text, ttl: 2.2 };
  }

  // --- movement -----------------------------------------------------------
  move(dt, input) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.clickTarget) {
      const tx = input.clickTarget.x - this.chef.x;
      const ty = input.clickTarget.y - this.chef.y;
      const dist = Math.hypot(tx, ty);
      if (dist > 8) {
        dx = tx / dist;
        dy = ty / dist;
      }
      // Arrival is the caller's job: it clears the persistent target once
      // the chef is close, so a click is never re-issued or lost.
    }
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.chef.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      this.chef.moving = true;
      this.chef.walkPhase += dt * 10;
    } else {
      this.chef.moving = false;
    }
    let nx = this.chef.x + dx * CHEF_SPEED * dt;
    let ny = this.chef.y + dy * CHEF_SPEED * dt;
    nx = Math.max(FLOOR.x + CHEF_R, Math.min(FLOOR.x + FLOOR.w - CHEF_R, nx));
    ny = Math.max(FLOOR.y + CHEF_R, Math.min(FLOOR.y + FLOOR.h - CHEF_R, ny));
    // Push the chef out of station rectangles.
    for (const station of Object.values(STATIONS)) {
      if (station.id === 'trash') continue;
      const pad = CHEF_R - 4;
      if (
        nx > station.x - pad &&
        nx < station.x + station.w + pad &&
        ny > station.y - pad &&
        ny < station.y + station.h + pad
      ) {
        const pushLeft = station.x - pad - nx;
        const pushRight = station.x + station.w + pad - nx;
        const pushUp = station.y - pad - ny;
        const pushDown = station.y + station.h + pad - ny;
        const m = Math.min(Math.abs(pushLeft), Math.abs(pushRight), Math.abs(pushUp), Math.abs(pushDown));
        if (m === Math.abs(pushLeft)) nx += pushLeft;
        else if (m === Math.abs(pushRight)) nx += pushRight;
        else if (m === Math.abs(pushUp)) ny += pushUp;
        else ny += pushDown;
      }
    }
    this.chef.x = nx;
    this.chef.y = ny;
    this.nearStation = this.stationNearChef();
  }

  stationNearChef() {
    let best = null;
    let bestDist = 96;
    for (const station of Object.values(STATIONS)) {
      const p = stationUsePoint(station);
      const d = Math.hypot(this.chef.x - p.x, this.chef.y - p.y);
      if (d < bestDist) {
        bestDist = d;
        best = station;
      }
    }
    return best;
  }

  stationAtPoint(px, py) {
    for (const station of Object.values(STATIONS)) {
      if (px >= station.x && px <= station.x + station.w && py >= station.y && py <= station.y + station.h) {
        return station;
      }
    }
    return null;
  }

  // --- work in progress ----------------------------------------------------
  update(dt) {
    if (this.toast) {
      this.toast.ttl -= dt;
      if (this.toast.ttl <= 0) this.toast = null;
    }
    if (this.busyUntil > 0) this.busyUntil -= dt;
    if (this.boardJob) {
      this.boardJob.progress += dt;
      if (this.boardJob.progress >= this.boardJob.duration) {
        this.boardItem = { id: this.boardJob.item.id, prep: PREP.CHOPPED };
        this.boardJob = null;
      }
    }
    for (const burner of this.burners) {
      if (!burner.item) continue;
      burner.progress += dt;
      if (burner.progress >= BURN_SECONDS) burner.burnt = true;
    }
    if (this.ovenJob) {
      this.ovenJob.progress += dt;
      if (this.ovenJob.progress >= this.ovenJob.duration) {
        this.ovenItem = { id: this.ovenJob.item.id, prep: PREP.BAKED };
        this.ovenJob = null;
      }
    }
  }

  // --- carrying -------------------------------------------------------------
  canCarryMore() {
    return this.carried.length < CARRY_SLOTS && !this.dish;
  }

  takeItem(item) {
    if (!this.canCarryMore()) {
      this.say('Hands full!');
      return false;
    }
    this.carried.push(item);
    return true;
  }

  // --- the interact key ------------------------------------------------------
  interact(board) {
    if (this.busyUntil > 0) return;
    const station = this.nearStation;
    if (!station) return;
    this.busyUntil = 0.18;
    if (station.id === 'pantry') this.usePantry();
    else if (station.id === 'board') this.useBoard();
    else if (station.id === 'stove') this.useStove();
    else if (station.id === 'oven') this.useOven();
    else if (station.id === 'plate') this.usePlate();
    else if (station.id === 'serve') this.useServe(board);
    else if (station.id === 'trash') this.useTrash();
  }

  // Pantry: the interact key grabs the first ingredient; number keys and
  // clicks pick a specific one (handled by grabIngredient).
  usePantry() {
    if (this.dish) {
      this.say('Serve the dish first!');
      return;
    }
    this.grabIngredient('tomato');
  }

  grabIngredient(id) {
    if (!INGREDIENTS[id]) return;
    if (this.dish) {
      this.say('Serve the dish first!');
      return;
    }
    if (this.takeItem({ id, prep: PREP.RAW })) this.say(`Picked up ${INGREDIENTS[id].name}`);
  }

  useBoard() {
    if (this.boardJob) {
      this.say('Still chopping…');
      return;
    }
    if (this.boardItem) {
      if (this.takeItem(this.boardItem)) {
        this.say(`Picked up ${itemName(this.boardItem)}`);
        this.boardItem = null;
      }
      return;
    }
    const index = this.carried.findIndex((item) => item.prep === PREP.RAW);
    if (index === -1) {
      this.say('Bring a raw ingredient to chop');
      return;
    }
    const item = this.carried[index];
    if (!this.choppable(item)) {
      this.say(`${INGREDIENTS[item.id].name} is not chopped here`);
      return;
    }
    this.carried.splice(index, 1);
    this.boardJob = { item, progress: 0, duration: CHOP_SECONDS };
    this.say(`Chopping ${INGREDIENTS[item.id].name}…`);
  }

  choppable(item) {
    return ['tomato', 'lettuce', 'mushroom'].includes(item.id);
  }

  useStove() {
    // Pick up anything finished first — a burnt pan can be picked up too,
    // so the player can bin it and free the burner.
    for (const burner of this.burners) {
      if (burner.item && burner.progress >= burner.duration) {
        if (burner.burnt) {
          if (this.takeItem({ id: burner.item.id, prep: 'burnt' })) {
            this.say(`Picked up Burnt ${INGREDIENTS[burner.item.id].name} — bin it`);
            burner.item = null;
            burner.progress = 0;
            burner.burnt = false;
          }
          return;
        }
        if (this.takeItem({ id: burner.item.id, prep: PREP.COOKED })) {
          this.say(`Picked up Cooked ${INGREDIENTS[burner.item.id].name}`);
          burner.item = null;
          burner.progress = 0;
          burner.burnt = false;
        }
        return;
      }
    }
    // Otherwise place something that needs cooking on a free burner.
    const free = this.burners.find((b) => !b.item);
    if (!free) {
      this.say('Both burners are busy');
      return;
    }
    const index = this.carried.findIndex((item) => this.cookable(item));
    if (index === -1) {
      this.say('Nothing here needs the stove');
      return;
    }
    const item = this.carried.splice(index, 1)[0];
    free.item = item;
    free.progress = 0;
    free.burnt = false;
    this.say(`Cooking ${INGREDIENTS[item.id].name}…`);
  }

  cookable(item) {
    return item.prep === PREP.RAW && ['tomato', 'cheese', 'pasta', 'rice'].includes(item.id);
  }

  useOven() {
    if (this.ovenJob) {
      this.say('Still baking…');
      return;
    }
    if (this.ovenItem) {
      if (this.takeItem(this.ovenItem)) {
        this.say(`Picked up ${itemName(this.ovenItem)}`);
        this.ovenItem = null;
      }
      return;
    }
    const index = this.carried.findIndex((item) => item.id === 'dough' && item.prep === PREP.RAW);
    if (index === -1) {
      this.say('The oven only bakes dough');
      return;
    }
    const item = this.carried.splice(index, 1)[0];
    this.ovenJob = { item, progress: 0, duration: BAKE_SECONDS };
    this.say('Baking dough…');
  }

  usePlate() {
    if (this.plateReady) {
      if (this.dish) {
        this.say('Already carrying a dish');
        return;
      }
      this.dish = { recipeId: this.plateReady.id };
      this.plate = [];
      this.plateReady = null;
      this.say('Dish plated — serve it!');
      return;
    }
    if (this.carried.length > 0) {
      const item = this.carried.pop();
      this.plate.push(item);
      this.plateReady = matchRecipe(this.plate);
      if (this.plateReady) this.say(`${this.plateReady.name} is ready to plate!`);
      return;
    }
    if (this.plate.length > 0) {
      const item = this.plate.pop();
      if (this.takeItem(item)) this.plateReady = matchRecipe(this.plate);
      return;
    }
    this.say('Bring ingredients to plate');
  }

  useServe(board) {
    if (!this.dish) {
      this.say('Nothing to serve — plate a dish first');
      return;
    }
    const earned = board.serve(this.dish.recipeId);
    if (earned > 0) {
      this.dish = null;
    } else {
      this.say('No guest ordered that dish');
    }
  }

  useTrash() {
    if (this.dish) {
      this.dish = null;
      this.say('Dish binned');
      return;
    }
    if (this.carried.length > 0) {
      const item = this.carried.pop();
      this.say(`Binned ${itemName(item)}`);
      return;
    }
    this.say('Nothing to bin');
  }

  // Clicking a station walks the chef there and uses it on arrival.
  clickAt(px, py, board) {
    const station = this.stationAtPoint(px, py);
    if (station) {
      const p = stationUsePoint(station);
      return { walkTo: p, station };
    }
    return { walkTo: { x: px, y: Math.max(py, FLOOR.y + 30) }, station: null };
  }
}

function itemName(item) {
  const base = INGREDIENTS[item.id].name;
  if (item.prep === 'burnt') return 'Burnt ' + base;
  if (item.prep === PREP.CHOPPED) return 'Chopped ' + base;
  if (item.prep === PREP.COOKED) return 'Cooked ' + base;
  if (item.prep === PREP.BAKED) return 'Baked ' + base;
  return base;
}
