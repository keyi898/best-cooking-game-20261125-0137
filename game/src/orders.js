// Ember & Thyme — the order board: tickets arrive, wait, and leave.
// A ticket is { uid, recipeId, patience, maxPatience }. Patience drains in
// real time; an empty ticket is a walked-out guest and costs a heart.

import {
  MAX_ORDERS,
  ORDER_FIRST_DELAY,
  ORDER_GAP_EARLY,
  ORDER_GAP_LATE,
  ORDER_PATIENCE,
  RUSH_AFTER,
  tipFor,
} from './config.js';
import { RECIPES, recipeById } from './recipes.js';

export class OrderBoard {
  constructor(random) {
    this.random = random;
    this.tickets = [];
    this.nextUid = 1;
    this.spawnIn = ORDER_FIRST_DELAY;
    this.served = 0;
    this.failed = 0;
    this.coins = 0;
    this.lastResult = null; // { kind: 'served'|'failed', text, at } for the toast line
  }

  reset() {
    this.tickets = [];
    this.nextUid = 1;
    this.spawnIn = ORDER_FIRST_DELAY;
    this.served = 0;
    this.failed = 0;
    this.coins = 0;
    this.lastResult = null;
  }

  // How many seconds until the next ticket, given how far the shift has run.
  gapFor(elapsed) {
    return elapsed >= RUSH_AFTER ? ORDER_GAP_LATE : ORDER_GAP_EARLY;
  }

  pickRecipe() {
    const pool = RECIPES;
    return pool[Math.floor(this.random() * pool.length)];
  }

  update(dt, elapsed) {
    // Spawn the next ticket when the board has room.
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.tickets.length < MAX_ORDERS) {
      const recipe = this.pickRecipe();
      const patience = ORDER_PATIENCE;
      this.tickets.push({ uid: this.nextUid++, recipeId: recipe.id, patience, maxPatience: patience });
      this.spawnIn = this.gapFor(elapsed);
    }
    // Drain patience; a ticket at zero walks out.
    for (const ticket of this.tickets) ticket.patience -= dt;
    const walked = this.tickets.filter((t) => t.patience <= 0);
    if (walked.length > 0) {
      this.tickets = this.tickets.filter((t) => t.patience > 0);
      this.failed += walked.length;
      const recipe = recipeById(walked[0].recipeId);
      this.lastResult = { kind: 'failed', text: `Guest left — ${recipe.name} never arrived!`, at: 0 };
      return walked.length;
    }
    return 0;
  }

  // Serve a finished dish. Returns the coins earned, or 0 when no ticket wants it.
  serve(recipeId) {
    const index = this.tickets.findIndex((t) => t.recipeId === recipeId);
    if (index === -1) return 0;
    const ticket = this.tickets[index];
    this.tickets.splice(index, 1);
    const recipe = recipeById(recipeId);
    const fraction = Math.max(0, ticket.patience / ticket.maxPatience);
    const tip = tipFor(fraction);
    const earned = recipe.price + tip;
    this.coins += earned;
    this.served += 1;
    this.lastResult = {
      kind: 'served',
      text: `${recipe.name} served! +$${earned}${tip > 0 ? ` (tip $${tip})` : ''}`,
      at: 0,
    };
    return earned;
  }

  // Fraction of patience left on the most urgent ticket (0..1), for the rush meter.
  urgency() {
    if (this.tickets.length === 0) return 0;
    let worst = 1;
    for (const t of this.tickets) worst = Math.min(worst, t.patience / t.maxPatience);
    return 1 - worst;
  }
}
