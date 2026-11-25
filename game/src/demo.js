// Ember & Thyme — staged scenes for screenshots (?shot=start|play|rush|end).
// These are the game's own states, arranged deterministically: the same
// kitchen, the same tickets, the same chef — just set up before the first
// frame so a screenshot shows the game at its best. No randomness here.

import { PREP, recipeById } from './recipes.js';

export function stageShot(game, shot) {
  const { board, kitchen } = game;
  if (shot === 'start') {
    game.state = 'title';
    return;
  }
  game.state = 'playing';
  board.reset();
  kitchen.reset();
  if (shot === 'play') {
    // Mid-shift: three tickets, the chef mid-chop, a salad half-plated.
    game.elapsed = 45;
    board.tickets = [
      { uid: 1, recipeId: 'salad', patience: 38, maxPatience: 55 },
      { uid: 2, recipeId: 'soup', patience: 24, maxPatience: 55 },
      { uid: 3, recipeId: 'pasta', patience: 48, maxPatience: 55 },
    ];
    board.nextUid = 4;
    board.coins = 34;
    kitchen.chef.x = 363;
    kitchen.chef.y = 300;
    kitchen.chef.facing = 'up';
    kitchen.boardJob = { item: { id: 'tomato', prep: PREP.RAW }, progress: 0.9, duration: 1.4 };
    kitchen.burners[0] = { item: { id: 'cheese', prep: PREP.RAW }, progress: 3.4, duration: 5, burnt: false };
    kitchen.plate = [{ id: 'lettuce', prep: PREP.CHOPPED }];
    kitchen.carried = [{ id: 'tomato', prep: PREP.CHOPPED }];
    kitchen.nearStation = { id: 'board', name: 'Chopping Board', x: 268, y: 128, w: 190, h: 118 };
  } else if (shot === 'rush') {
    // The dinner rush: four tickets, one nearly out of patience, a dish ready
    // to serve, the stove full and the timer nearly gone.
    game.elapsed = 158;
    board.tickets = [
      { uid: 1, recipeId: 'tart', patience: 6, maxPatience: 55 },
      { uid: 2, recipeId: 'risotto', patience: 20, maxPatience: 55 },
      { uid: 3, recipeId: 'sandwich', patience: 33, maxPatience: 55 },
      { uid: 4, recipeId: 'soup', patience: 44, maxPatience: 55 },
    ];
    board.nextUid = 5;
    board.coins = 96;
    board.served = 7;
    kitchen.chef.x = 1015;
    kitchen.chef.y = 300;
    kitchen.chef.facing = 'up';
    kitchen.dish = { recipeId: 'tart' };
    kitchen.burners[0] = { item: { id: 'pasta', prep: PREP.RAW }, progress: 4.6, duration: 5, burnt: false };
    kitchen.burners[1] = { item: { id: 'rice', prep: PREP.RAW }, progress: 2.1, duration: 5, burnt: false };
    kitchen.ovenJob = { item: { id: 'dough', prep: PREP.RAW }, progress: 5.5, duration: 7 };
    kitchen.nearStation = { id: 'plate', name: 'Plating Counter', x: 920, y: 128, w: 190, h: 118 };
  } else if (shot === 'end') {
    // Shift complete: three stars, a full coin purse.
    game.state = 'over';
    game.result = { reason: 'time', coins: 162, served: 11, failed: 1, stars: 3 };
    game.best = 162;
  }
}
