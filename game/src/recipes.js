// Ember & Thyme — ingredients and recipes.
// An ingredient is a raw thing from the pantry. A recipe is a dish: a list of
// prepared steps, each step naming an ingredient and how it must be prepared
// (raw, chopped, cooked, baked). Two recipes can share ingredients but never the
// same step list, so the player has to read the ticket, not memorise one dish.

export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e0523e', dark: '#a93226', shape: 'round' },
  lettuce: { name: 'Lettuce', color: '#7cb84a', dark: '#4e7d2e', shape: 'leaf' },
  bread: { name: 'Bread', color: '#e0a44f', dark: '#a8742c', shape: 'loaf' },
  cheese: { name: 'Cheese', color: '#f2c94c', dark: '#c99a1e', shape: 'wedge' },
  pasta: { name: 'Pasta', color: '#f0d48a', dark: '#c9a44a', shape: 'noodle' },
  mushroom: { name: 'Mushroom', color: '#cbb59a', dark: '#8a715a', shape: 'cap' },
  berry: { name: 'Berries', color: '#8e4a8a', dark: '#5e2f5c', shape: 'round' },
  dough: { name: 'Dough', color: '#f0dcb0', dark: '#c9ab72', shape: 'loaf' },
  rice: { name: 'Rice', color: '#f5efe0', dark: '#c9bfa4', shape: 'grain' },
  egg: { name: 'Egg', color: '#f7ead0', dark: '#d9c08a', shape: 'round' },
};

// Preparation stages an ingredient can be in. Raw comes from the pantry;
// chopped comes off the board; cooked off the stove; baked out of the oven.
export const PREP = {
  RAW: 'raw',
  CHOPPED: 'chopped',
  COOKED: 'cooked',
  BAKED: 'baked',
};

// A carried item: { id, prep }. A plated dish: { recipeId, items }.
export function itemLabel(item) {
  const base = INGREDIENTS[item.id].name;
  if (item.prep === PREP.RAW) return base;
  if (item.prep === PREP.CHOPPED) return 'Chopped ' + base;
  if (item.prep === PREP.COOKED) return 'Cooked ' + base;
  return 'Baked ' + base;
}

// Where each preparation happens, so the kitchen can route the player.
export const PREP_STATION = {
  [PREP.CHOPPED]: 'board',
  [PREP.COOKED]: 'stove',
  [PREP.BAKED]: 'oven',
};

export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    price: 12,
    color: '#7cb84a',
    steps: [
      { id: 'lettuce', prep: PREP.CHOPPED },
      { id: 'tomato', prep: PREP.CHOPPED },
    ],
  },
  {
    id: 'soup',
    name: 'Tomato Soup',
    price: 14,
    color: '#e0523e',
    steps: [
      { id: 'tomato', prep: PREP.CHOPPED },
      { id: 'tomato', prep: PREP.COOKED },
    ],
  },
  {
    id: 'sandwich',
    name: 'Melted Sandwich',
    price: 15,
    color: '#e0a44f',
    steps: [
      { id: 'bread', prep: PREP.RAW },
      { id: 'cheese', prep: PREP.COOKED },
    ],
  },
  {
    id: 'pasta',
    name: 'Pasta Marinara',
    price: 18,
    color: '#d9822b',
    steps: [
      { id: 'pasta', prep: PREP.COOKED },
      { id: 'tomato', prep: PREP.CHOPPED },
    ],
  },
  {
    id: 'risotto',
    name: 'Mushroom Risotto',
    price: 20,
    color: '#cbb59a',
    steps: [
      { id: 'rice', prep: PREP.COOKED },
      { id: 'mushroom', prep: PREP.CHOPPED },
    ],
  },
  {
    id: 'tart',
    name: 'Berry Tart',
    price: 22,
    color: '#8e4a8a',
    steps: [
      { id: 'dough', prep: PREP.BAKED },
      { id: 'berry', prep: PREP.RAW },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Does the carried item list (as a multiset of id+prep) exactly match a recipe?
export function matchRecipe(items) {
  const key = (list) =>
    list
      .map((s) => s.id + ':' + s.prep)
      .sort()
      .join('|');
  const held = key(items);
  return RECIPES.find((r) => key(r.steps) === held) ?? null;
}

// Which recipes could still use this item (for the plate hint)?
export function recipesUsing(item) {
  return RECIPES.filter((r) => r.steps.some((s) => s.id === item.id && s.prep === item.prep));
}
