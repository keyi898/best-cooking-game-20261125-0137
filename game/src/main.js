// Ember & Thyme — the game loop and the state machine.
// States: 'title' -> 'playing' -> 'over'. The loop is fixed to the browser's
// animation frames; the shift clock only runs while playing. The ?shot=
// parameter (start / play / rush / end) stages a deterministic scene for
// screenshots — the same code path the player uses, just pre-arranged.

import { SHIFT_SECONDS, MAX_HEARTS, starsFor } from './config.js';
import { OrderBoard } from './orders.js';
import { Kitchen } from './kitchen.js';
import { Input } from './input.js';
import { SoundEngine } from './audio.js';
import { drawScene, drawTitle, drawGameOver } from './render.js';
import { stageShot } from './demo.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sound = new SoundEngine();
    this.board = new OrderBoard(Math.random);
    this.kitchen = new Kitchen();
    this.state = 'title';
    this.elapsed = 0;
    this.shiftSeconds = SHIFT_SECONDS;
    this.hearts = MAX_HEARTS;
    this.best = 0;
    this.result = null;
    this.lastTickSecond = -1;
    this.shot = new URLSearchParams(window.location.search).get('shot');
    this.raf = 0;
    this.lastTime = 0;
  }

  start() {
    if (this.shot) {
      // stageShot sets the state itself ('title' for start, 'over' for end,
      // 'playing' for the in-game shots) — do not overwrite it here.
      stageShot(this, this.shot);
    }
    const loop = (time) => {
      const dt = Math.min(0.05, (time - this.lastTime) / 1000 || 0);
      this.lastTime = time;
      this.frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  frame(dt) {
    const input = this.input.frame();
    if (input.mutePressed) this.sound.toggleMute();
    if (this.state === 'title') {
      drawTitle(this.ctx, this.best);
      if (input.anyKey || input.clickTarget) this.beginShift();
      return;
    }
    if (this.state === 'over') {
      drawGameOver(this.ctx, this.result);
      if (input.anyKey || input.clickTarget) this.beginShift();
      return;
    }
    // Playing.
    this.elapsed += dt;
    this.sound.ensure();
    if (!this.shot) this.sound.startMusic();
    const walked = this.board.update(dt, this.elapsed);
    if (walked > 0) {
      this.hearts -= walked;
      this.sound.fail();
      if (this.hearts <= 0) return this.endShift('hearts');
    }
    // The last ten seconds of the shift tick audibly.
    const remaining = this.shiftSeconds - this.elapsed;
    const whole = Math.ceil(remaining);
    if (remaining <= 10 && whole !== this.lastTickSecond) {
      this.lastTickSecond = whole;
      this.sound.tick();
    }
    if (this.elapsed >= this.shiftSeconds) return this.endShift('time');
    this.kitchen.update(dt);
    // Clicking a station walks there; clicking the floor walks to the spot.
    // The snapshot's click is consumed here; the walk target lives on Input
    // until the chef arrives or the player steers with keys.
    if (input.clickTarget) {
      const hit = this.kitchen.clickAt(input.clickTarget.x, input.clickTarget.y, this.board);
      this.kitchenTarget = hit;
      this.input.clickTarget = hit.walkTo;
    }
    const frameInput = {
      up: input.up,
      down: input.down,
      left: input.left,
      right: input.right,
      clickTarget: this.input.clickTarget,
    };
    const hadKeys = input.up || input.down || input.left || input.right;
    if (hadKeys) this.input.clearClick();
    this.kitchen.move(dt, frameInput);
    // The chef arrived at the clicked spot: clear the walk target.
    if (this.input.clickTarget) {
      const target = this.input.clickTarget;
      const d = Math.hypot(this.kitchen.chef.x - target.x, this.kitchen.chef.y - target.y);
      if (d <= 10) this.input.clearClick();
    }
    // Arrived at a clicked station: use it once.
    if (this.kitchenTarget?.station && this.kitchen.nearStation === this.kitchenTarget.station) {
      this.kitchen.interact(this.board);
      this.kitchenTarget = null;
      this.input.clearClick();
    }
    // Pantry number keys grab a specific ingredient when near the pantry.
    if (this.kitchen.nearStation?.id === 'pantry') {
      for (const pick of input.pantryPicks) this.kitchen.grabIngredient(pick);
    }
    if (input.interactPressed) {
      const before = this.kitchen.carried.length + (this.kitchen.dish ? 1 : 0);
      this.kitchen.interact(this.board);
      const after = this.kitchen.carried.length + (this.kitchen.dish ? 1 : 0);
      if (after > before) this.sound.pickup();
      else if (this.kitchen.nearStation) this.sound.place();
    }
    if (this.board.lastResult?.kind === 'served') {
      this.sound.coin();
      this.board.lastResult = null;
    }
    drawScene(this.ctx, this);
  }

  beginShift() {
    this.board.reset();
    this.kitchen.reset();
    this.elapsed = 0;
    this.hearts = MAX_HEARTS;
    this.result = null;
    this.lastTickSecond = -1;
    this.state = 'playing';
    this.sound.ensure();
    this.sound.startMusic();
  }

  endShift(reason) {
    const coins = this.board.coins;
    this.best = Math.max(this.best, coins);
    this.result = {
      reason,
      coins,
      served: this.board.served,
      failed: this.board.failed,
      stars: starsFor(coins),
    };
    this.state = 'over';
    this.sound.stopMusic();
    if (this.result.stars > 0) this.sound.ding();
    else this.sound.fail();
  }
}
