// Ember & Thyme — every pixel the game shows, drawn on one canvas.
// The kitchen is drawn flat and readable: warm tile floor, walnut counters,
// brass trim, and food drawn as simple bold shapes so a dish reads at a glance.

import { PALETTE, VIEW_H, VIEW_W } from './config.js';
import { STATIONS } from './kitchen.js';
import { INGREDIENTS, itemLabel, recipeById } from './recipes.js';

// --- small drawing helpers ---------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- food art -----------------------------------------------------------------
// Each ingredient is a bold shape; preparation changes how it looks:
// chopped = cut pieces, cooked = darker with steam, baked = golden, burnt = black.
export function drawIngredient(ctx, item, x, y, size) {
  const ing = INGREDIENTS[item.id];
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (item.prep === 'burnt') {
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#54452f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.2);
    ctx.lineTo(s * 0.1, s * 0.3);
    ctx.moveTo(s * 0.4, -s * 0.3);
    ctx.lineTo(-s * 0.1, s * 0.2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const chopped = item.prep === 'chopped';
  const cooked = item.prep === 'cooked';
  const baked = item.prep === 'baked';
  const main = baked ? '#d99a2b' : cooked ? shade(ing.color, -28) : ing.color;
  const dark = baked ? '#a8742c' : cooked ? shade(ing.dark, -20) : ing.dark;
  if (item.id === 'tomato') {
    if (chopped) {
      ctx.fillStyle = main;
      for (const [ox, oy] of [[-0.35, -0.2], [0.3, -0.3], [0, 0.35]]) {
        ctx.beginPath();
        ctx.arc(ox * s, oy * s, s * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f2a597';
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 0.2, s * 0.22, 0, Math.PI * 2);
      ctx.arc(s * 0.3, -s * 0.3, s * 0.22, 0, Math.PI * 2);
      ctx.arc(0, s * 0.35, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(0, -s * 0.75, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7cb84a';
      ctx.fillRect(-s * 0.5, -s * 0.95, s, s * 0.18);
    }
  } else if (item.id === 'lettuce') {
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, 0);
    ctx.quadraticCurveTo(0, -s * 0.4, s * 0.6, 0);
    ctx.moveTo(-s * 0.5, s * 0.3);
    ctx.quadraticCurveTo(0, -s * 0.1, s * 0.5, s * 0.3);
    ctx.stroke();
    if (chopped) {
      ctx.strokeStyle = '#fff6e6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.4);
      ctx.lineTo(s * 0.4, s * 0.4);
      ctx.moveTo(s * 0.4, -s * 0.4);
      ctx.lineTo(-s * 0.4, s * 0.4);
      ctx.stroke();
    }
  } else if (item.id === 'bread' || item.id === 'dough') {
    ctx.fillStyle = main;
    roundRect(ctx, -s, -s * 0.55, s * 2, s * 1.1, s * 0.5);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.4);
    ctx.lineTo(-s * 0.2, s * 0.3);
    ctx.moveTo(0, -s * 0.45);
    ctx.lineTo(s * 0.3, s * 0.25);
    ctx.stroke();
  } else if (item.id === 'cheese') {
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, s * 0.6);
    ctx.lineTo(s * 0.9, s * 0.6);
    ctx.lineTo(s * 0.9, -s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = dark;
    for (const [ox, oy] of [[0.2, 0.1], [0.55, -0.2], [0.45, 0.35]]) {
      ctx.beginPath();
      ctx.arc(ox * s, oy * s, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item.id === 'pasta') {
    ctx.strokeStyle = main;
    ctx.lineWidth = s * 0.28;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, i * s * 0.45);
      ctx.quadraticCurveTo(0, i * s * 0.45 - s * 0.35, s * 0.7, i * s * 0.45);
      ctx.stroke();
    }
  } else if (item.id === 'mushroom') {
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.arc(0, -s * 0.15, s * 0.85, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(-s * 0.22, -s * 0.15, s * 0.44, s * 0.85);
    ctx.fillStyle = dark;
    for (const [ox, oy] of [[-0.45, -0.45], [0.1, -0.7], [0.5, -0.35]]) {
      ctx.beginPath();
      ctx.arc(ox * s, oy * s, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item.id === 'berry') {
    ctx.fillStyle = main;
    for (const [ox, oy] of [[-0.4, -0.25], [0.4, -0.3], [0, 0.4]]) {
      ctx.beginPath();
      ctx.arc(ox * s, oy * s, s * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#c98ac5';
    ctx.beginPath();
    ctx.arc(-s * 0.5, -s * 0.4, s * 0.12, 0, Math.PI * 2);
    ctx.arc(s * 0.3, -s * 0.45, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.id === 'rice') {
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.95, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark;
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.35, s * 0.16, s * 0.08, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item.id === 'egg') {
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.7, s * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.3, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (cooked || baked) {
    // Steam wisps over hot food.
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 1.1);
    ctx.quadraticCurveTo(-s * 0.1, -s * 1.5, -s * 0.3, -s * 1.8);
    ctx.moveTo(s * 0.3, -s * 1.1);
    ctx.quadraticCurveTo(s * 0.5, -s * 1.5, s * 0.3, -s * 1.8);
    ctx.stroke();
  }
  ctx.restore();
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

function prepTag(prep) {
  if (prep === 'chopped') return { label: 'CHOP', color: '#5da24a' };
  if (prep === 'cooked') return { label: 'COOK', color: '#d9822b' };
  if (prep === 'baked') return { label: 'BAKE', color: '#8e4a8a' };
  return { label: 'RAW', color: '#8a715a' };
}

// --- the room ------------------------------------------------------------------
function drawRoom(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, 116);
  ctx.fillStyle = PALETTE.wallShadow;
  ctx.fillRect(0, 108, VIEW_W, 8);
  // Framed menu poster and hanging pans on the wall.
  ctx.fillStyle = PALETTE.paper;
  roundRect(ctx, 1160, 18, 96, 76, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.counterEdge;
  ctx.lineWidth = 3;
  roundRect(ctx, 1160, 18, 96, 76, 8);
  ctx.stroke();
  text(ctx, 'MENU', 1208, 34, 13, PALETTE.ink);
  text(ctx, 'fresh · fast', 1208, 54, 10, PALETTE.inkSoft, 'center', '400');
  text(ctx, '· warm ·', 1208, 72, 10, PALETTE.inkSoft, 'center', '400');
  drawHangingPan(ctx, 60, 30);
  drawHangingPan(ctx, 110, 30);
  // Terracotta tile floor.
  for (let ty = 0; ty < 9; ty += 1) {
    for (let tx = 0; tx < 16; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * 80, 116 + ty * 68, 80, 68);
    }
  }
  ctx.strokeStyle = PALETTE.floorGrout;
  ctx.lineWidth = 2;
  for (let tx = 0; tx <= 16; tx += 1) {
    ctx.beginPath();
    ctx.moveTo(tx * 80, 116);
    ctx.lineTo(tx * 80, VIEW_H);
    ctx.stroke();
  }
  for (let ty = 0; ty <= 9; ty += 1) {
    ctx.beginPath();
    ctx.moveTo(0, 116 + ty * 68);
    ctx.lineTo(VIEW_W, 116 + ty * 68);
    ctx.stroke();
  }
}

function drawHangingPan(ctx, x, y) {
  ctx.strokeStyle = '#5c4632';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y + 22, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x, y + 22);
  ctx.stroke();
}

// --- stations --------------------------------------------------------------------
function drawStationBase(ctx, station, label) {
  const { x, y, w, h } = station;
  ctx.fillStyle = PALETTE.counterFront;
  roundRect(ctx, x, y + 10, w, h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, x - 4, y, w + 8, 26, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterEdge;
  ctx.fillRect(x - 4, y + 18, w + 8, 4);
  text(ctx, label, x + w / 2, y + h - 14, 13, '#f3e6cf', 'center', '600');
}

function drawPantry(ctx, station) {
  drawStationBase(ctx, station, 'PANTRY');
  const ids = Object.keys(INGREDIENTS);
  ids.forEach((id, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const bx = station.x + 16 + col * 38;
    const by = station.y + 34 + row * 36;
    ctx.fillStyle = PALETTE.paper;
    roundRect(ctx, bx, by, 32, 30, 6);
    ctx.fill();
    drawIngredient(ctx, { id, prep: 'raw' }, bx + 16, by + 15, 22);
    text(ctx, String(i + 1 === 10 ? 0 : i + 1), bx + 16, by + 27, 8, PALETTE.inkSoft, 'center', '600');
  });
}

function drawBoard(ctx, station, kitchen) {
  drawStationBase(ctx, station, 'CHOPPING BOARD');
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, station.x + 30, station.y + 30, 130, 52, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.boardDark;
  ctx.fillRect(station.x + 30, station.y + 74, 130, 8);
  if (kitchen.boardJob) {
    drawIngredient(ctx, kitchen.boardJob.item, station.x + 95, station.y + 56, 40);
    drawProgressRing(ctx, station.x + 95, station.y + 56, 30, kitchen.boardJob.progress / kitchen.boardJob.duration, '#d94f3d');
    text(ctx, 'CHOPPING…', station.x + 95, station.y + 92, 11, '#fff6e6');
  } else if (kitchen.boardItem) {
    drawIngredient(ctx, kitchen.boardItem, station.x + 95, station.y + 56, 40);
    text(ctx, 'ready — press E', station.x + 95, station.y + 92, 11, '#fff6e6');
  } else {
    // A knife resting on the board.
    ctx.strokeStyle = PALETTE.steel;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(station.x + 55, station.y + 70);
    ctx.lineTo(station.x + 125, station.y + 42);
    ctx.stroke();
    ctx.strokeStyle = '#5c4632';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(station.x + 125, station.y + 42);
    ctx.lineTo(station.x + 145, station.y + 34);
    ctx.stroke();
  }
}

function drawStove(ctx, station, kitchen) {
  drawStationBase(ctx, station, 'STOVE');
  kitchen.burners.forEach((burner, i) => {
    const bx = station.x + 40 + i * 100;
    const by = station.y + 52;
    ctx.fillStyle = '#3a2a1c';
    ctx.beginPath();
    ctx.arc(bx, by, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.steelDark;
    ctx.beginPath();
    ctx.arc(bx, by, 28, 0, Math.PI * 2);
    ctx.fill();
    if (burner.item) {
      ctx.fillStyle = '#5c4632';
      ctx.beginPath();
      ctx.arc(bx, by, 24, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, { id: burner.item.id, prep: burner.burnt ? 'burnt' : 'cooked' }, bx, by, 34);
      const frac = Math.min(1, burner.progress / burner.duration);
      drawProgressRing(ctx, bx, by, 32, frac, burner.burnt ? '#2b2118' : frac >= 1 ? '#e8a83e' : '#5da24a');
      if (burner.burnt) text(ctx, 'BURNT!', bx, by - 42, 12, '#ff8a7a');
      else if (frac >= 1) text(ctx, 'READY', bx, by - 42, 12, '#ffe08a');
    }
  });
}

function drawOven(ctx, station, kitchen) {
  drawStationBase(ctx, station, 'OVEN');
  ctx.fillStyle = '#3a2a1c';
  roundRect(ctx, station.x + 34, station.y + 30, 102, 58, 8);
  ctx.fill();
  ctx.fillStyle = kitchen.ovenJob ? '#f2a33c' : '#1d1610';
  roundRect(ctx, station.x + 42, station.y + 38, 86, 42, 6);
  ctx.fill();
  if (kitchen.ovenJob) {
    drawIngredient(ctx, kitchen.ovenJob.item, station.x + 85, station.y + 59, 36);
    drawProgressRing(ctx, station.x + 85, station.y + 59, 30, kitchen.ovenJob.progress / kitchen.ovenJob.duration, '#e8a83e');
  } else if (kitchen.ovenItem) {
    drawIngredient(ctx, kitchen.ovenItem, station.x + 85, station.y + 59, 36);
    text(ctx, 'ready — press E', station.x + 85, station.y + 92, 11, '#fff6e6');
  } else {
    ctx.strokeStyle = PALETTE.steel;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(station.x + 42, station.y + 52);
    ctx.lineTo(station.x + 128, station.y + 52);
    ctx.moveTo(station.x + 42, station.y + 66);
    ctx.lineTo(station.x + 128, station.y + 66);
    ctx.stroke();
  }
}

function drawPlateCounter(ctx, station, kitchen) {
  drawStationBase(ctx, station, 'PLATING');
  ctx.fillStyle = PALETTE.paper;
  ctx.beginPath();
  ctx.ellipse(station.x + 95, station.y + 58, 62, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(station.x + 95, station.y + 58, 62, 26, 0, 0, Math.PI * 2);
  ctx.stroke();
  kitchen.plate.forEach((item, i) => {
    drawIngredient(ctx, item, station.x + 62 + i * 34, station.y + 58, 30);
  });
  if (kitchen.plateReady) {
    text(ctx, `${kitchen.plateReady.name} — press E to plate!`, station.x + 95, station.y + 92, 12, '#ffe08a');
  } else if (kitchen.plate.length > 0) {
    text(ctx, 'keep adding…', station.x + 95, station.y + 92, 11, '#fff6e6');
  }
}

function drawServe(ctx, station, board) {
  const { x, y, w, h } = station;
  ctx.fillStyle = PALETTE.counterFront;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#2e2118';
  roundRect(ctx, x + 10, y + 14, w - 20, 120, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  text(ctx, 'SERVE', x + w / 2, y + 30, 14, PALETTE.gold);
  // Little guest faces waiting at the hatch.
  const guests = Math.min(3, board.tickets.length);
  for (let i = 0; i < guests; i += 1) {
    const gy = y + 62 + i * 34;
    ctx.fillStyle = ['#f2c94c', '#7cb84a', '#e08a7a'][i];
    ctx.beginPath();
    ctx.arc(x + w / 2, gy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a1c';
    ctx.beginPath();
    ctx.arc(x + w / 2 - 4, gy - 2, 1.6, 0, Math.PI * 2);
    ctx.arc(x + w / 2 + 4, gy - 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.paper;
  roundRect(ctx, x + 8, y + h - 52, w - 16, 40, 8);
  ctx.fill();
  text(ctx, 'bell: E to serve', x + w / 2, y + h - 32, 11, PALETTE.ink);
}

function drawTrash(ctx, station) {
  const { x, y, w, h } = station;
  ctx.fillStyle = PALETTE.steelDark;
  roundRect(ctx, x + 20, y + 8, w - 40, h - 16, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.steel;
  roundRect(ctx, x + 14, y, w - 28, 14, 7);
  ctx.fill();
  text(ctx, 'BIN', x + w / 2, y + h - 12, 12, '#fff6e6');
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(255,246,230,0.35)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
}

// --- the chef ---------------------------------------------------------------------
function drawChef(ctx, chef, carried, dish) {
  const { x, y } = chef;
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(58,42,28,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 30 - bob, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(-12, 12, 9, 18);
  ctx.fillRect(3, 12, 9, 18);
  // Body + apron.
  ctx.fillStyle = '#fff6e6';
  roundRect(ctx, -18, -14, 36, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#2e7f6e';
  roundRect(ctx, -14, -4, 28, 20, 6);
  ctx.fill();
  // Arms.
  ctx.fillStyle = '#fff6e6';
  ctx.beginPath();
  ctx.arc(-20, 0, 7, 0, Math.PI * 2);
  ctx.arc(20, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  // Head + toque.
  ctx.fillStyle = '#f2c89a';
  ctx.beginPath();
  ctx.arc(0, -26, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6e6';
  roundRect(ctx, -14, -48, 28, 14, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-9, -46, 8, 0, Math.PI * 2);
  ctx.arc(0, -50, 9, 0, Math.PI * 2);
  ctx.arc(9, -46, 8, 0, Math.PI * 2);
  ctx.fill();
  // Eyes look the way the chef faces.
  const look = chef.facing === 'left' ? -3 : chef.facing === 'right' ? 3 : 0;
  ctx.fillStyle = '#3a2a1c';
  ctx.beginPath();
  ctx.arc(-5 + look, -27, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + look, -27, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Carried items float above the chef's head, each with a cream pill behind
  // its name so the label reads over counters, floor or the serve window.
  if (dish) {
    const recipe = recipeById(dish.recipeId);
    const label = recipe.name;
    ctx.font = '700 12px "Trebuchet MS", "Segoe UI", sans-serif';
    const lw = ctx.measureText(label).width;
    ctx.fillStyle = PALETTE.paper;
    roundRect(ctx, x - lw / 2 - 10, y - 102, lw + 20, 20, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.ellipse(x, y - 66, 34, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - 66, 34, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, label, x, y - 92, 12, PALETTE.ink);
    recipe.steps.forEach((step, i) => {
      drawIngredient(ctx, step, x - 18 + i * 18, y - 66, 20);
    });
  } else {
    carried.forEach((item, i) => {
      const ix = x - 14 + i * 28;
      const label = itemLabel(item);
      ctx.font = '700 10px "Trebuchet MS", "Segoe UI", sans-serif';
      const lw = ctx.measureText(label).width;
      ctx.fillStyle = PALETTE.paper;
      roundRect(ctx, ix - lw / 2 - 6, y - 94, lw + 12, 16, 8);
      ctx.fill();
      drawIngredient(ctx, item, ix, y - 62, 26);
      text(ctx, label, ix, y - 86, 10, PALETTE.ink);
    });
  }
}

// --- the order board (top strip) ----------------------------------------------------
function drawOrderBoard(ctx, board, elapsed, shiftSeconds, hearts) {
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 0, VIEW_W, 116);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, 112, VIEW_W, 4);
  text(ctx, 'ORDER BOARD', 24, 18, 13, PALETTE.gold, 'left');
  // Tickets.
  board.tickets.forEach((ticket, i) => {
    const recipe = recipeById(ticket.recipeId);
    const tx = 24 + i * 218;
    const frac = Math.max(0, ticket.patience / ticket.maxPatience);
    const urgent = frac < 0.3;
    ctx.fillStyle = urgent && Math.floor(elapsed * 2) % 2 === 0 ? '#5a2e26' : PALETTE.paper;
    roundRect(ctx, tx, 30, 204, 72, 10);
    ctx.fill();
    ctx.fillStyle = recipe.color;
    ctx.fillRect(tx, 30, 8, 72);
    text(ctx, recipe.name, tx + 18, 46, 15, PALETTE.ink, 'left');
    text(ctx, `$${recipe.price}`, tx + 196, 46, 14, PALETTE.ink, 'right');
    recipe.steps.forEach((step, j) => {
      // Prep tag above the icon, short name below: two short lines never
      // collide with the next ingredient's label.
      const tag = prepTag(step.prep);
      text(ctx, tag.label, tx + 34 + j * 44, 58, 8, tag.color);
      drawIngredient(ctx, step, tx + 34 + j * 44, 74, 26);
      text(ctx, INGREDIENTS[step.id].name, tx + 34 + j * 44, 94, 9, PALETTE.inkSoft);
    });
    // Patience bar.
    ctx.fillStyle = '#e2cdaa';
    roundRect(ctx, tx + 130, 66, 64, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
    roundRect(ctx, tx + 130, 66, 64 * frac, 10, 5);
    ctx.fill();
  });
  if (board.tickets.length === 0) {
    text(ctx, 'No orders yet — the calm before the rush…', 240, 66, 15, '#c9b59a', 'left', '400');
  }
  // Right cluster: timer, coins, hearts.
  const remaining = Math.max(0, shiftSeconds - elapsed);
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);
  const lowTime = remaining <= 30;
  text(ctx, 'SHIFT', 1000, 22, 11, '#c9b59a', 'left');
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, 1000, 50, 30, lowTime ? '#ff8a7a' : '#fff6e6', 'left');
  text(ctx, 'COINS', 1000, 82, 11, '#c9b59a', 'left');
  text(ctx, `$${board.coins}`, 1052, 82, 16, PALETTE.gold, 'left');
  const heartsX = 1160;
  for (let i = 0; i < 3; i += 1) {
    const hx = heartsX + i * 30;
    ctx.fillStyle = i < hearts ? '#e0523e' : '#5a4636';
    ctx.beginPath();
    ctx.arc(hx - 5, 78, 7, 0, Math.PI * 2);
    ctx.arc(hx + 5, 78, 7, 0, Math.PI * 2);
    ctx.moveTo(hx - 11, 80);
    ctx.lineTo(hx, 94);
    ctx.lineTo(hx + 11, 80);
    ctx.fill();
  }
  text(ctx, 'REPUTATION', 1148, 22, 11, '#c9b59a', 'left');
}

// --- prompts, toasts, rush banner ------------------------------------------------------
function drawPrompt(ctx, kitchen) {
  const station = kitchen.nearStation;
  if (!station) return;
  const hints = {
    pantry: 'E — grab Tomato · or press 1-0 for any ingredient',
    board: 'E — chop / pick up',
    stove: 'E — cook / pick up',
    oven: 'E — bake / pick up',
    plate: 'E — add to plate / take dish',
    serve: 'E — serve the dish',
    trash: 'E — bin what you carry',
  };
  const label = hints[station.id] ?? 'E — use';
  ctx.fillStyle = 'rgba(46,33,24,0.9)';
  roundRect(ctx, VIEW_W / 2 - 180, VIEW_H - 44, 360, 30, 15);
  ctx.fill();
  text(ctx, `${station.name} — ${label}`, VIEW_W / 2, VIEW_H - 28, 13, '#fff6e6');
  // Highlight the station in use.
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  roundRect(ctx, station.x - 6, station.y - 6, station.w + 12, station.h + 12, 12);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawToast(ctx, kitchen) {
  const toast = kitchen.toast;
  if (!toast) return;
  ctx.globalAlpha = Math.min(1, toast.ttl);
  text(ctx, toast.text, VIEW_W / 2, 140, 18, '#fff6e6');
  ctx.globalAlpha = 1;
}

function drawRushBanner(ctx, board, elapsed) {
  if (elapsed < 90 || elapsed > 96) return;
  ctx.fillStyle = 'rgba(217,79,61,0.92)';
  roundRect(ctx, VIEW_W / 2 - 220, 130, 440, 44, 22);
  ctx.fill();
  text(ctx, 'DINNER RUSH! Orders are coming faster!', VIEW_W / 2, 152, 18, '#fff6e6');
}

// --- screens ----------------------------------------------------------------------------
export function drawTitle(ctx, best) {
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Warm glow behind the title.
  const glow = ctx.createRadialGradient(640, 260, 40, 640, 260, 420);
  glow.addColorStop(0, 'rgba(232,168,62,0.35)');
  glow.addColorStop(1, 'rgba(232,168,62,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'EMBER & THYME', 640, 190, 64, '#f3e6cf');
  text(ctx, 'a tiny bistro cooking game', 640, 250, 22, PALETTE.gold, 'center', '400');
  text(ctx, 'Take orders. Chop, cook, bake, plate — and serve before the guests walk out.', 640, 320, 18, '#e2cdaa', 'center', '400');
  text(ctx, 'Move  WASD / arrows / click      ·      Use  E or Space      ·      Pantry  1-0      ·      M mute', 640, 380, 16, '#fff6e6', 'center', '400');
  text(ctx, 'Six recipes · the dinner rush hits at 1:30 · three walked-out guests end the shift', 640, 420, 15, '#c9b59a', 'center', '400');
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, 520, 470, 240, 52, 26);
  ctx.fill();
  text(ctx, 'START SHIFT  ▶', 640, 496, 20, '#2e2118');
  if (best > 0) text(ctx, `Best shift so far: $${best}`, 640, 560, 16, '#e8a83e');
  text(ctx, 'Original game — art, names and music made for this kitchen.', 640, 640, 13, '#8a715a', 'center', '400');
}

export function drawGameOver(ctx, result) {
  ctx.fillStyle = 'rgba(46,33,24,0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, result.reason === 'hearts' ? 'THE BISTRO CLOSES EARLY' : 'SHIFT COMPLETE', 640, 200, 44, '#f3e6cf');
  text(ctx, result.reason === 'hearts' ? 'Too many guests walked out…' : 'The last order is served. Time to wipe down the counters.', 640, 250, 18, '#e2cdaa', 'center', '400');
  text(ctx, `Coins earned  $${result.coins}`, 640, 330, 30, PALETTE.gold);
  text(ctx, `Dishes served  ${result.served}      Guests lost  ${result.failed}`, 640, 380, 18, '#fff6e6', 'center', '400');
  const stars = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
  text(ctx, stars, 640, 440, 44, PALETTE.gold);
  text(ctx, result.stars === 3 ? 'Three stars — the critics are raving!' : result.stars === 2 ? 'Two stars — a solid night at the bistro.' : result.stars === 1 ? 'One star — the kitchen survived.' : 'No stars yet — the rush got the better of you.', 640, 500, 17, '#e2cdaa', 'center', '400');
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, 520, 540, 240, 52, 26);
  ctx.fill();
  text(ctx, 'PLAY AGAIN  ▶', 640, 566, 20, '#2e2118');
}

// --- main scene ------------------------------------------------------------------------------
export function drawScene(ctx, game) {
  drawRoom(ctx);
  drawPantry(ctx, STATIONS.pantry);
  drawBoard(ctx, STATIONS.board, game.kitchen);
  drawStove(ctx, STATIONS.stove, game.kitchen);
  drawOven(ctx, STATIONS.oven, game.kitchen);
  drawPlateCounter(ctx, STATIONS.plate, game.kitchen);
  drawServe(ctx, STATIONS.serve, game.board);
  drawTrash(ctx, STATIONS.trash);
  drawChef(ctx, game.kitchen.chef, game.kitchen.carried, game.kitchen.dish);
  drawOrderBoard(ctx, game.board, game.elapsed, game.shiftSeconds, game.hearts);
  drawRushBanner(ctx, game.board, game.elapsed);
  drawPrompt(ctx, game.kitchen);
  drawToast(ctx, game.kitchen);
}
