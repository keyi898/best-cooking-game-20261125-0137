// Ember & Thyme — shared constants: canvas size, palette, kitchen layout and tuning.
// Every number the rest of the game reads lives here, so balance tweaks are one edit.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// Warm bistro palette: cream walls, terracotta tile, dark walnut counters, brass trim.
export const PALETTE = {
  wall: '#f3e6cf',
  wallShadow: '#e2cdaa',
  floorA: '#c96f4a',
  floorB: '#b85f3e',
  floorGrout: '#a34f33',
  counterTop: '#8a5a33',
  counterFront: '#6e4525',
  counterEdge: '#a9743f',
  steel: '#b9c2c9',
  steelDark: '#8d979e',
  board: '#e8c98f',
  boardDark: '#c9a86a',
  ink: '#3a2a1c',
  inkSoft: '#6b543d',
  cream: '#fff6e6',
  paper: '#fffaf0',
  gold: '#e8a83e',
  red: '#d94f3d',
  green: '#5da24a',
  teal: '#2e7f6e',
  blue: '#4a7fb5',
};

export const SHIFT_SECONDS = 180; // one full shift: 3 minutes
export const MAX_ORDERS = 4; // tickets pinned on the board at once
export const MAX_HEARTS = 3; // failed orders before the shift ends early
export const CARRY_SLOTS = 2; // the chef carries at most two things at once

export const CHOP_SECONDS = 1.4;
export const COOK_SECONDS = 5.0;
export const BURN_SECONDS = 9.0; // a pan left on the stove burns after this long
export const BAKE_SECONDS = 7.0;

export const ORDER_FIRST_DELAY = 4; // seconds before the first ticket arrives
export const ORDER_GAP_EARLY = 14; // seconds between tickets while the rush is calm
export const ORDER_GAP_LATE = 8; // seconds between tickets once the rush builds
export const ORDER_PATIENCE = 55; // seconds a ticket waits before the guest walks out
export const RUSH_AFTER = 90; // seconds into the shift when the dinner rush begins

// Tip curve: serve with most patience left and the guest pays generously.
export function tipFor(fractionLeft) {
  if (fractionLeft > 0.75) return 6;
  if (fractionLeft > 0.5) return 4;
  if (fractionLeft > 0.25) return 2;
  return 0;
}

// Stars at the end of a shift, by coins earned.
export function starsFor(coins) {
  if (coins >= 150) return 3;
  if (coins >= 100) return 2;
  if (coins >= 55) return 1;
  return 0;
}
