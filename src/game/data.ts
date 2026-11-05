export type Vec3 = [number, number, number];
export type ItemId =
  | 'wood'
  | 'stone'
  | 'berry'
  | 'fiber'
  | 'ore'
  | 'crystal'
  | 'fruit'
  | 'fragment'
  | 'warmTreat'
  | 'mineralSnack'
  | 'chargedTreat'
  | 'pickaxe'
  | 'block'
  | 'processedWood'
  | 'refinedStone'
  | 'lamp'
  | 'stool'
  | 'statue';
export const ITEMS: Record<
  ItemId,
  { name: string; icon: string; color: string; stack: number; buy?: number; sell?: number }
> = {
  wood: { name: 'Wood', icon: '🪵', color: '#b68755', stack: 99, buy: 10, sell: 4 },
  stone: { name: 'Stone', icon: '🪨', color: '#9baca9', stack: 99, buy: 10, sell: 4 },
  berry: { name: 'Berries', icon: '🫐', color: '#c877a4', stack: 99, buy: 8, sell: 3 },
  fiber: { name: 'Plant fiber', icon: '🌿', color: '#8eb866', stack: 99, buy: 8, sell: 3 },
  ore: { name: 'Ore', icon: '⛏', color: '#d2a17d', stack: 99, buy: 25, sell: 10 },
  crystal: { name: 'Crystal', icon: '💎', color: '#99cbe0', stack: 99, buy: 35, sell: 14 },
  fruit: { name: 'River fruit', icon: '🍐', color: '#9cc9a0', stack: 99 },
  fragment: { name: 'Charged fragment', icon: '✦', color: '#e7d36b', stack: 99 },
  warmTreat: {
    name: 'Warm berry treat',
    icon: '🍪',
    color: '#d09b64',
    stack: 99,
    buy: 30,
    sell: 12,
  },
  mineralSnack: { name: 'Mineral snack', icon: '🥠', color: '#bbb58e', stack: 99 },
  chargedTreat: { name: 'Charged treat', icon: '⚡', color: '#e8d777', stack: 99 },
  pickaxe: { name: 'Basic pickaxe', icon: '⛏', color: '#b5c3ba', stack: 1, buy: 80, sell: 30 },
  block: { name: 'Wooden block', icon: '▣', color: '#c39262', stack: 99 },
  processedWood: { name: 'Processed wood', icon: '▤', color: '#c69666', stack: 99 },
  refinedStone: { name: 'Refined stone', icon: '⬡', color: '#b5c9cc', stack: 99 },
  lamp: { name: 'Crystal lamp', icon: '🏮', color: '#e7d79b', stack: 99 },
  stool: { name: 'Wooden stool', icon: '🪑', color: '#b8916b', stack: 99 },
  statue: { name: 'Guardian statue', icon: '♜', color: '#acbaaa', stack: 99 },
};
export type Species = 'emberfox' | 'aquabub' | 'mosshell' | 'zaplet';
export const CREATURES: Record<
  Species,
  {
    name: string;
    type: 'Fire' | 'Water' | 'Earth' | 'Electric';
    color: string;
    food: ItemId;
    pos: Vec3;
    ability: string;
    description: string;
  }
> = {
  emberfox: {
    name: 'Emberfox',
    type: 'Fire',
    color: '#ed9564',
    food: 'warmTreat',
    pos: [30, 0, 10],
    ability: 'Smelting assistance',
    description: 'A warm-hearted wanderer with a spark of mischief.',
  },
  aquabub: {
    name: 'Aquabub',
    type: 'Water',
    color: '#70c1d4',
    food: 'fruit',
    pos: [40, 0, -15],
    ability: 'Water marked plants',
    description: 'A little river spirit with a very big curiosity.',
  },
  mosshell: {
    name: 'Mosshell',
    type: 'Earth',
    color: '#8aaa6b',
    food: 'mineralSnack',
    pos: [52, 0, 20],
    ability: 'Break tough nodes',
    description: 'Slow steps, a sturdy shell, and a loyal heart.',
  },
  zaplet: {
    name: 'Zaplet',
    type: 'Electric',
    color: '#e3c65e',
    food: 'chargedTreat',
    pos: [65, 0, -4],
    ability: 'Power forest devices',
    description: 'A bright little friend, always buzzing with ideas.',
  },
};
export const NPCS = [
  {
    id: 'moss',
    name: 'Grandpa Moss',
    role: 'VILLAGE ELDER',
    color: '#a8af80',
    pos: [-7, 0, -5] as Vec3,
    greeting:
      'Ah, a new face! Every grand adventure begins with a small kindness. Welcome home, little wanderer.',
  },
  {
    id: 'foxy',
    name: 'Foxy',
    role: 'MERCHANT',
    color: '#dc9768',
    pos: [-15, 0, 6] as Vec3,
    greeting:
      'Good things come to those who explore. And to those who shop! Have a look at my wares.',
  },
  {
    id: 'bruno',
    name: 'Bruno',
    role: 'BUILDER',
    color: '#8597ac',
    pos: [8, 0, 8] as Vec3,
    greeting:
      'A few blocks, a little imagination, and you can build something wonderful. Let’s get your hands busy.',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'CREATURE RESEARCHER',
    color: '#b19ac8',
    pos: [10, 0, -10] as Vec3,
    greeting:
      'The forest is full of friends you haven’t met yet. A thoughtful treat is a lovely way to say hello.',
  },
  {
    id: 'bloop',
    name: 'Bloop',
    role: 'FOREST WIZARD',
    color: '#88b6b6',
    pos: [21, 0, -2] as Vec3,
    greeting:
      'The forest whispers in leaves and sparks. Listen closely! There’s a broken passage deeper in the woods.',
  },
];
export type Objective = {
  id: string;
  label: string;
  event: string;
  target: string;
  count: number;
  consume?: Partial<Record<ItemId, number>>;
};
export type Quest = {
  id: string;
  name: string;
  giver: string;
  category: string;
  description: string;
  prereqs: string[];
  coins: number;
  xp: number;
  objectives: Objective[];
};
const o = (
  id: string,
  label: string,
  event: string,
  target: string,
  count = 1,
  consume?: Partial<Record<ItemId, number>>
): Objective => ({ id, label, event, target, count, consume });
export const QUESTS: Quest[] = [
  {
    id: 'q01',
    name: 'Welcome to MomoVerse',
    giver: 'moss',
    category: 'MAIN STORY',
    description: 'Find your feet and meet the friendly faces of Momo Village.',
    prereqs: [],
    coins: 50,
    xp: 40,
    objectives: [
      o('moss', 'Talk to Grandpa Moss', 'talk', 'moss'),
      o('square', 'Visit the village square', 'discover', 'square'),
      o('foxy', 'Speak with Foxy', 'talk', 'foxy'),
      o('bruno', 'Speak with Bruno', 'talk', 'bruno'),
    ],
  },
  {
    id: 'q02',
    name: 'The Forest Supplies',
    giver: 'moss',
    category: 'MAIN STORY',
    description: 'Gather supplies for Bruno’s workshop, then deliver them to him.',
    prereqs: ['q01'],
    coins: 100,
    xp: 80,
    objectives: [
      o('wood', 'Gather wood', 'gather', 'wood', 8),
      o('stone', 'Gather stone', 'gather', 'stone', 6),
      o('fiber', 'Gather plant fiber', 'gather', 'fiber', 4),
      o('deliver', 'Deliver supplies to Bruno', 'deliver', 'bruno', 1, {
        wood: 8,
        stone: 6,
        fiber: 4,
      }),
    ],
  },
  {
    id: 'q03',
    name: 'A New Friend',
    giver: 'luna',
    category: 'MAIN STORY',
    description: 'A warm treat might win the trust of a curious Emberfox.',
    prereqs: ['q02'],
    coins: 120,
    xp: 100,
    objectives: [
      o('berry', 'Gather berries', 'gather', 'berry', 3),
      o('treat', 'Craft a warm berry treat', 'craft', 'warmTreat'),
      o('friend', 'Befriend Emberfox', 'befriend', 'emberfox'),
    ],
  },
  {
    id: 'q04',
    name: 'The Broken Passage',
    giver: 'moss',
    category: 'FINALE',
    description: 'Bring your forest friends together to restore the old passage.',
    prereqs: ['q03', 'q07', 'q08', 'q09'],
    coins: 500,
    xp: 250,
    objectives: [
      o('bloop', 'Speak with Bloop', 'talk', 'bloop'),
      o('power', 'Power the passage switch with Zaplet', 'ability', 'finalSwitch'),
      o('clear', 'Clear the passage with Mosshell', 'ability', 'passage'),
      o('repair', 'Repair with 6 processed wood and 4 refined stone', 'repair', 'passage', 1, {
        processedWood: 6,
        refinedStone: 4,
      }),
      o('battle', 'Resolve the guardian encounter', 'defeat', 'guardian'),
    ],
  },
  {
    id: 'q05',
    name: 'Foxy’s Delivery',
    giver: 'foxy',
    category: 'SIDE QUEST',
    description: 'Carry a parcel to Bloop, then return to Foxy.',
    prereqs: ['q02'],
    coins: 90,
    xp: 50,
    objectives: [o('parcel', 'Deliver Foxy’s parcel to Bloop', 'deliver', 'parcel')],
  },
  {
    id: 'q06',
    name: 'The Missing Crystals',
    giver: 'bloop',
    category: 'SIDE QUEST',
    description: 'Find the crystal clearing and bring back five crystals.',
    prereqs: ['q03'],
    coins: 130,
    xp: 75,
    objectives: [
      o('clearing', 'Discover the crystal clearing', 'discover', 'crystalClearing'),
      o('crystals', 'Gather crystals', 'gather', 'crystal', 5),
      o('deliver', 'Deliver crystals to Bloop', 'deliver', 'bloop', 1, { crystal: 5 }),
    ],
  },
  {
    id: 'q07',
    name: 'Friends of the Forest',
    giver: 'luna',
    category: 'CREATURE QUEST',
    description: 'Meet two new friends and discover what makes them special.',
    prereqs: ['q03'],
    coins: 180,
    xp: 120,
    objectives: [
      o('aqua', 'Befriend Aquabub', 'befriend', 'aquabub'),
      o('moss', 'Befriend Mosshell', 'befriend', 'mosshell'),
      o('water', 'Water the marked plant', 'ability', 'plant'),
      o('node', 'Break a tough node', 'ability', 'toughNode'),
    ],
  },
  {
    id: 'q08',
    name: 'The Spark of Adventure',
    giver: 'luna',
    category: 'CREATURE QUEST',
    description: 'Befriend Zaplet and bring the old practice device to life.',
    prereqs: ['q03'],
    coins: 200,
    xp: 130,
    objectives: [
      o('fragment', 'Gather charged fragments', 'gather', 'fragment', 2),
      o('treat', 'Craft a charged treat', 'craft', 'chargedTreat'),
      o('friend', 'Befriend Zaplet', 'befriend', 'zaplet'),
      o('power', 'Activate the practice device', 'ability', 'practiceSwitch'),
    ],
  },
  {
    id: 'q09',
    name: 'Home Sweet Home',
    giver: 'bruno',
    category: 'BUILDING QUEST',
    description: 'Build a real shelter: walls, a roof, and room to step inside.',
    prereqs: ['q02'],
    coins: 150,
    xp: 100,
    objectives: [
      o('plot', 'Enter your housing plot', 'discover', 'plot'),
      o('craft', 'Craft wooden blocks', 'craft', 'block', 12),
      o('shelter', 'Build a roofed shelter with a doorway', 'shelter', 'home'),
    ],
  },
  {
    id: 'q10',
    name: 'Hidden Forest Secrets',
    giver: 'bloop',
    category: 'EXPLORATION',
    description: 'Follow your curiosity to three landmarks and a hidden chest.',
    prereqs: ['q03'],
    coins: 175,
    xp: 90,
    objectives: [
      o('oak', 'Discover the ancient oak', 'discover', 'ancientOak'),
      o('river', 'Discover the river bend', 'discover', 'riverBend'),
      o('crystal', 'Discover the crystal clearing', 'discover', 'crystalClearing'),
      o('chest', 'Open the hidden chest', 'open', 'chest'),
    ],
  },
];
export const RECIPES: {
  id: ItemId;
  ingredients: Partial<Record<ItemId, number>>;
  output: number;
  unlock: string;
  companion?: Species;
}[] = [
  { id: 'warmTreat', ingredients: { berry: 3, fiber: 1 }, output: 1, unlock: 'q02' },
  { id: 'mineralSnack', ingredients: { stone: 2, berry: 1 }, output: 1, unlock: 'q02' },
  { id: 'chargedTreat', ingredients: { fragment: 2, berry: 1 }, output: 1, unlock: 'q02' },
  { id: 'pickaxe', ingredients: { wood: 3, stone: 2 }, output: 1, unlock: 'q02' },
  { id: 'block', ingredients: { wood: 1 }, output: 2, unlock: 'q02' },
  {
    id: 'processedWood',
    ingredients: { wood: 2 },
    output: 1,
    unlock: 'q03',
    companion: 'emberfox',
  },
  { id: 'refinedStone', ingredients: { stone: 2, ore: 1 }, output: 1, unlock: 'q02' },
  { id: 'lamp', ingredients: { crystal: 1, wood: 2 }, output: 1, unlock: 'q08' },
  { id: 'stool', ingredients: { wood: 3 }, output: 1, unlock: 'q09' },
  { id: 'statue', ingredients: { refinedStone: 4, crystal: 2 }, output: 1, unlock: 'q04' },
];
export type WorldObject = {
  id: string;
  kind: 'resource' | 'utility' | 'landmark' | 'station' | 'enemy';
  name: string;
  pos: Vec3;
  item?: ItemId;
  amount?: number;
  requires?: Species;
  target?: string;
};
export const OBJECTS: WorldObject[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `tree${i}`,
    kind: 'resource' as const,
    name: 'Willow tree',
    pos: [25 + (i % 4) * 7, 0, 13 + Math.floor(i / 4) * 9] as Vec3,
    item: 'wood' as const,
    amount: 4,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `rock${i}`,
    kind: 'resource' as const,
    name: 'Stone deposit',
    pos: [28 + i * 4, 0, -8 - (i % 3) * 4] as Vec3,
    item: 'stone' as const,
    amount: 3,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `bush${i}`,
    kind: 'resource' as const,
    name: 'Berry bush',
    pos: [20 + i * 5, 0, 5 + (i % 2) * 4] as Vec3,
    item: 'berry' as const,
    amount: 3,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `fiber${i}`,
    kind: 'resource' as const,
    name: 'Meadow fiber',
    pos: [16 + i * 5, 0, 19 + (i % 2) * 6] as Vec3,
    item: 'fiber' as const,
    amount: 2,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `ore${i}`,
    kind: 'resource' as const,
    name: 'Copper ore',
    pos: [51 + i * 4, 0, 30] as Vec3,
    item: 'ore' as const,
    amount: 3,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `crystal${i}`,
    kind: 'resource' as const,
    name: 'Crystal deposit',
    pos: [64 + i * 3, 0, -14] as Vec3,
    item: 'crystal' as const,
    amount: 3,
  })),
  {
    id: 'fruit',
    kind: 'resource',
    name: 'River fruit',
    pos: [37, 0, -20],
    item: 'fruit',
    amount: 2,
  },
  {
    id: 'fragment',
    kind: 'resource',
    name: 'Charged fragments',
    pos: [60, 0, -8],
    item: 'fragment',
    amount: 2,
  },
  {
    id: 'plant',
    kind: 'utility',
    name: 'Thirsty moonflower',
    pos: [45, 0, -14],
    requires: 'aquabub',
  },
  {
    id: 'toughNode',
    kind: 'utility',
    name: 'Tough mineral node',
    pos: [54, 0, 23],
    requires: 'mosshell',
  },
  {
    id: 'practiceSwitch',
    kind: 'utility',
    name: 'Practice power device',
    pos: [64, 0, 3],
    requires: 'zaplet',
  },
  {
    id: 'finalSwitch',
    kind: 'utility',
    name: 'Passage power switch',
    pos: [81, 0, 12],
    requires: 'zaplet',
  },
  {
    id: 'passage',
    kind: 'utility',
    name: 'Blocked forest passage',
    pos: [84, 0, 17],
    requires: 'mosshell',
  },
  { id: 'repair', kind: 'utility', name: 'Passage repair point', pos: [86, 0, 20] },
  { id: 'chest', kind: 'utility', name: 'Hidden treasure chest', pos: [72, 0, 36] },
  { id: 'ancientOak', kind: 'landmark', name: 'The Ancient Oak', pos: [45, 0, 42] },
  { id: 'riverBend', kind: 'landmark', name: 'River Bend', pos: [40, 0, -24] },
  { id: 'crystalClearing', kind: 'landmark', name: 'Crystal Clearing', pos: [67, 0, -12] },
  { id: 'craft', kind: 'station', name: 'Bruno’s crafting bench', pos: [10, 0, 11] },
  { id: 'heal', kind: 'station', name: 'Companion healing station', pos: [13, 0, -8] },
  { id: 'board', kind: 'station', name: 'Village quest board', pos: [-3, 0, -9] },
  { id: 'guardian', kind: 'enemy', name: 'Bramble Guardian', pos: [92, 0, 20] },
];
export const PLOT = { x: -6, z: 19, size: 16, height: 8 };
export const LANDMARKS = [
  { id: 'square', name: 'Momo Village', pos: [0, 0, 0] as Vec3 },
  { id: 'plot', name: 'Your homestead', pos: [2, 0, 27] as Vec3 },
  ...OBJECTS.filter((o) => o.kind === 'landmark'),
];
