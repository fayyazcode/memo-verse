import { craftBatch } from './crafting';
import { create } from 'zustand';
import { openDB } from 'idb';
import {
  CREATURES,
  ITEMS,
  NPCS,
  OBJECTS,
  QUESTS,
  RECIPES,
  type ItemId,
  type Species,
  type Vec3,
} from './data';
import {
  count,
  elementalDamage,
  levelFromXp,
  maxCreatureHp,
  respawnSeconds,
  transact,
  validPlacement,
  validShelter,
  type Block,
  type CreatureCollection,
  type Stack,
} from './rules';
import { sound } from './audio';
import { SKINS, type SkinId } from './appearance';
import { playerRuntime, companionRuntime } from './input';
export type Panel =
  | null
  | 'inventory'
  | 'journal'
  | 'creatures'
  | 'craft'
  | 'shop'
  | 'map'
  | 'settings'
  | 'pause'
  | 'commands';
export type QuestState = { status: 'active' | 'complete'; progress: Record<string, number> };
export type Save = {
  version: 1;
  revision: number;
  position: Vec3;
  hp: number;
  xp: number;
  coins: number;
  inventory: Stack[];
  hotbar: (ItemId | null)[];
  quests: Record<string, QuestState>;
  creatures: CreatureCollection;
  active: Species | null;
  blocks: Block[];
  discoveries: string[];
  flags: string[];
  nodes: Record<string, number>;
  playTime: number;
  enemyHp: number;
  enemyCooldown: number;
  attackCooldown: number;
  abilityCooldown: number;
};
export const freshSave = (): Save => ({
  version: 1,
  revision: 0,
  position: [0, 1, 5],
  hp: 100,
  xp: 0,
  coins: 50,
  inventory: [],
  hotbar: ['wood', 'stone', 'berry', 'block', 'pickaxe', 'warmTreat'],
  quests: {},
  creatures: {},
  active: null,
  blocks: [],
  discoveries: [],
  flags: [],
  nodes: {},
  playTime: 0,
  enemyHp: 100,
  enemyCooldown: 3,
  attackCooldown: 0,
  abilityCooldown: 0,
});
export type Settings = {
  music: number;
  effects: number;
  sensitivity: number;
  quality: 'low' | 'medium' | 'high';
  reducedMotion: boolean;
  distance: number;
  mobileDistance: number;
  skin: SkinId;
};
export const defaultSettings: Settings = {
  music: 0.35,
  effects: 0.5,
  sensitivity: 1,
  quality: 'medium',
  reducedMotion: false,
  distance: 13,
  mobileDistance: 17,
  skin: 'meadow',
};
export function validateSave(value: unknown): Save {
  if (!value || typeof value !== 'object') throw Error('Invalid save file.');
  const s = value as Save;
  if (s.version !== 1)
    throw Error('This save version is not supported. Your existing save has been preserved.');
  if (
    !Array.isArray(s.position) ||
    s.position.length !== 3 ||
    !s.position.every(Number.isFinite) ||
    Math.abs(s.position[0]) > 128 ||
    Math.abs(s.position[2]) > 128 ||
    s.position[1] < -20 ||
    s.position[1] > 50
  )
    throw Error('Invalid saved position.');
  for (const key of [
    'revision',
    'hp',
    'xp',
    'coins',
    'playTime',
    'enemyHp',
    'enemyCooldown',
    'attackCooldown',
    'abilityCooldown',
  ] as const)
    if (!Number.isFinite(s[key]) || s[key] < 0) throw Error('Invalid saved player state.');
  if (
    !Array.isArray(s.inventory) ||
    s.inventory.length > 24 ||
    s.inventory.some(
      (i) =>
        !ITEMS[i.item] || !Number.isSafeInteger(i.qty) || i.qty < 1 || i.qty > ITEMS[i.item].stack
    )
  )
    throw Error('Invalid saved inventory.');
  if (
    !Array.isArray(s.hotbar) ||
    s.hotbar.length !== 6 ||
    s.hotbar.some((i) => i !== null && !ITEMS[i])
  )
    throw Error('Invalid hotbar.');
  if (
    !s.quests ||
    Object.entries(s.quests).some(
      ([id, q]) =>
        !QUESTS.some((k) => k.id === id) ||
        !['active', 'complete'].includes(q.status) ||
        !q.progress ||
        Object.values(q.progress).some((n) => !Number.isSafeInteger(n) || n < 0)
    )
  )
    throw Error('Invalid saved quests.');
  if (
    !s.creatures ||
    Object.entries(s.creatures).some(
      ([id, c]) =>
        !CREATURES[id as Species] ||
        ![c.xp, c.friendship, c.hp].every(Number.isFinite) ||
        c.xp < 0 ||
        c.friendship < 0 ||
        c.friendship > 100 ||
        c.hp < 0
    )
  )
    throw Error('Invalid saved creatures.');
  if (s.active !== null && !s.creatures[s.active]) throw Error('Invalid active companion.');
  if (
    !Array.isArray(s.blocks) ||
    s.blocks.length > 2048 ||
    s.blocks.some(
      (b) =>
        !['block', 'lamp', 'stool', 'statue'].includes(b.item) ||
        ![b.x, b.y, b.z].every(Number.isInteger) ||
        b.x < -6 ||
        b.x >= 10 ||
        b.z < 19 ||
        b.z >= 35 ||
        b.y < 0 ||
        b.y >= 8
    ) ||
    new Set(s.blocks.map((b) => `${b.x},${b.y},${b.z}`)).size !== s.blocks.length
  )
    throw Error('Invalid saved buildings.');
  if (
    !Array.isArray(s.flags) ||
    !s.flags.every((f) => typeof f === 'string') ||
    !Array.isArray(s.discoveries) ||
    !s.discoveries.every((f) => typeof f === 'string') ||
    !s.nodes ||
    Object.values(s.nodes).some((n) => !Number.isFinite(n) || n < 0)
  )
    throw Error('Invalid saved world.');
  return s;
}
async function database() {
  return openDB('momoverse', 1, {
    upgrade(db) {
      db.createObjectStore('saves');
    },
  });
}
export const saveData = async (s: Save) => {
  const db = await database();
  await db.put('saves', s, 'adventure');
};
export const loadData = async () => {
  const db = await database();
  const s = await db.get('saves', 'adventure');
  return s ? validateSave(s) : null;
};
function event(s: Save, type: string, target: string, amount = 1): Save {
  const quests = { ...s.quests };
  for (const def of QUESTS) {
    const q = quests[def.id];
    if (!q || q.status !== 'active') continue;
    const progress = { ...q.progress };
    for (const obj of def.objectives)
      if (obj.event === type && obj.target === target)
        progress[obj.id] = Math.min(obj.count, (progress[obj.id] ?? 0) + amount);
    quests[def.id] = { ...q, progress };
  }
  return { ...s, quests };
}
export function ready(s: Save, id: string) {
  const q = QUESTS.find((q) => q.id === id);
  return (
    !!q &&
    (id !== 'q09' || validShelter(s.blocks)) &&
    q.objectives.every((o) => (s.quests[id]?.progress[o.id] ?? 0) >= o.count)
  );
}
export function available(s: Save, id: string) {
  const q = QUESTS.find((q) => q.id === id);
  return !!q && !s.quests[id] && q.prereqs.every((p) => s.quests[p]?.status === 'complete');
}
export function claimQuest(s: Save, id: string): Save | null {
  const def = QUESTS.find((q) => q.id === id);
  if (!def || s.quests[id]?.status !== 'active' || !ready(s, id)) return null;
  let creatures = { ...s.creatures };
  if (['q07', 'q08'].includes(id))
    creatures = Object.fromEntries(
      Object.entries(creatures).map(([id, c]) => [
        id,
        { ...c, friendship: Math.min(100, c.friendship + 10) },
      ])
    );
  const oldLevel = levelFromXp(s.xp).level,
    newXp = s.xp + def.xp,
    newLevel = levelFromXp(newXp).level;
  return {
    ...s,
    creatures,
    quests: { ...s.quests, [id]: { ...s.quests[id], status: 'complete' } },
    coins: s.coins + def.coins,
    xp: newXp,
    hp: s.hp + (newLevel - oldLevel) * 5,
    flags: [
      ...s.flags,
      ...(id === 'q04'
        ? ['adventureComplete', 'badge:guardian']
        : id === 'q10'
          ? ['badge:explorer']
          : id === 'q03'
            ? ['whistle']
            : []),
    ],
  };
}
export type GameStore = {
  save: Save;
  started: boolean;
  loading: boolean;
  worldReady: boolean;
  hasSave: boolean;
  panel: Panel;
  dialogue: string | null;
  target: string | null;
  notice: string;
  noticeId: number;
  saveStatus: string;
  build: boolean;
  selected: number;
  command: 'follow' | 'stay';
  settings: Settings;
  setPosition: (p: Vec3) => void;
  init: () => Promise<void>;
  start: (resume: boolean) => Promise<void>;
  reset: () => void;
  notify: (s: string) => void;
  open: (panel: Panel) => void;
  talk: (id: string) => void;
  accept: (id: string) => void;
  claim: (id: string) => void;
  interact: () => void;
  gather: (id: string) => void;
  craft: (id: ItemId, batches?: number) => void;
  trade: (id: ItemId, buy: boolean) => void;
  summon: (id: Species) => void;
  feed: (id: Species) => void;
  useAbility: (id: string) => void;
  attack: (elemental?: boolean) => void;
  discover: (id: string) => void;
  place: (b: Block) => void;
  remove: (b: Block) => void;
  tick: (dt: number) => void;
  persist: (quit?: boolean) => Promise<void>;
  configure: (s: Partial<Settings>) => void;
};
let saveQueue: Promise<void> = Promise.resolve();
export const useGame = create<GameStore>((set, get) => ({
  save: freshSave(),
  started: false,
  loading: true,
  worldReady: false,
  hasSave: false,
  panel: null,
  dialogue: null,
  target: null,
  notice: '',
  noticeId: 0,
  saveStatus: 'Not saved yet',
  build: false,
  selected: 0,
  command: 'follow',
  settings: defaultSettings,
  notify: (notice) => {
    set({ notice, noticeId: get().noticeId + 1 });
    sound('click', get().settings.effects);
  },
  init: async () => {
    try {
      const saved = await loadData();
      let settings = {
        ...defaultSettings,
        quality:
          typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
            ? ('low' as const)
            : defaultSettings.quality,
      };
      try {
        settings = {
          ...settings,
          ...JSON.parse(localStorage.getItem('momo-settings') || '{}'),
        };
      } catch {}
      if (!SKINS[settings.skin]) settings.skin = 'meadow';
      if (settings.distance === 9) settings.distance = 13;
      set({ hasSave: !!saved, loading: false, settings });
    } catch (e) {
      set({ loading: false, saveStatus: 'Save unavailable' });
      get().notify((e as Error).message);
    }
  },
  start: async (resume) => {
    try {
      const existing = await loadData();
      const s = resume ? existing : { ...freshSave(), revision: existing?.revision ?? 0 };
      if (!s) throw Error('No saved adventure found.');
      set({ save: s, started: true, panel: null, dialogue: null, command: 'follow', build: false });
      sound('friend', get().settings.effects);
      await get().persist();
    } catch (e) {
      get().notify((e as Error).message);
    }
  },
  reset: () =>
    set({ save: freshSave(), started: false, panel: null, dialogue: null, build: false }),
  setPosition: (position) => set({ save: { ...get().save, position } }),
  open: (panel) => {
    set({ panel, dialogue: null, build: false });
    sound('click', get().settings.effects);
  },
  talk: (id) => {
    playerRuntime.action = 'interact';
    playerRuntime.actionUntil = Date.now() + 800;
    const s = event(get().save, 'talk', id);
    set({ dialogue: id, panel: null, save: s, build: false });
    // Deliveries are explicit conversation actions, never silently consume resources.
  },
  accept: (id) => {
    const s = get().save;
    if (!available(s, id)) return;
    let next: Save = { ...s, quests: { ...s.quests, [id]: { status: 'active', progress: {} } } };
    next = event(next, 'talk', get().dialogue ?? '');
    for (const d of s.discoveries) next = event(next, 'discover', d);
    for (const c of Object.keys(s.creatures)) next = event(next, 'befriend', c);
    for (const f of s.flags)
      if (f.startsWith('ability:')) next = event(next, 'ability', f.slice(8));
    if (validShelter(s.blocks)) next = event(next, 'shelter', 'home');
    set({ save: next });
    get().notify('Mission accepted — ' + QUESTS.find((q) => q.id === id)!.name);
    void get().persist();
  },
  claim: (id) => {
    const next = claimQuest(get().save, id);
    if (!next) return;
    playerRuntime.action = 'celebrate';
    playerRuntime.actionUntil = Date.now() + 2200;
    set({ save: next });
    get().notify(
      `Mission complete! +${QUESTS.find((q) => q.id === id)!.coins} coins · +${QUESTS.find((q) => q.id === id)!.xp} XP`
    );
    sound('reward', get().settings.effects);
    void get().persist();
  },
  interact: () => {
    const { target, save: s } = get();
    if (!target) return;
    if (target.startsWith('lamp:')) {
      const flag = 'off:' + target;
      set({
        save: {
          ...s,
          flags: s.flags.includes(flag) ? s.flags.filter((f) => f !== flag) : [...s.flags, flag],
        },
      });
      get().notify(s.flags.includes(flag) ? 'Lamp on' : 'Lamp off');
      void get().persist();
      return;
    }
    const npc = NPCS.find((n) => n.id === target);
    if (npc) {
      get().talk(npc.id);
      return;
    }
    if (target.startsWith('creature:')) {
      const id = target.slice(9) as Species;
      if (s.creatures[id]) {
        get().notify(`${CREATURES[id].name} is already your friend. Open C to summon.`);
        return;
      }
      if (s.quests.q02?.status !== 'complete') {
        get().notify('Meet Luna after helping Bruno to learn befriending.');
        return;
      }
      const inv = transact(s.inventory, { [CREATURES[id].food]: 1 }, {});
      if (!inv) {
        get().notify(
          `Bring 1 ${ITEMS[CREATURES[id].food].name} to befriend ${CREATURES[id].name}.`
        );
        return;
      }
      let next = event(
        {
          ...s,
          inventory: inv,
          creatures: { ...s.creatures, [id]: { xp: 0, friendship: 10, hp: 60 } },
          active: s.active ?? id,
        },
        'befriend',
        id
      );
      set({ save: next });
      get().notify(`${CREATURES[id].name} is your new friend!`);
      sound('friend', get().settings.effects);
      void get().persist();
      return;
    }
    const obj = OBJECTS.find((o) => o.id === target);
    if (!obj) return;
    if (obj.kind === 'resource') {
      get().gather(obj.id);
      return;
    }
    if (obj.kind === 'enemy') {
      get().attack();
      return;
    }
    if (obj.id === 'craft') {
      get().open('craft');
      return;
    }
    if (obj.id === 'board') {
      get().open('journal');
      return;
    }
    if (obj.id === 'heal') {
      const creatures = Object.fromEntries(
        Object.entries(s.creatures).map(([id, c]) => [id, { ...c, hp: maxCreatureHp(c) }])
      );
      set({ save: { ...s, hp: 100 + (levelFromXp(s.xp).level - 1) * 5, creatures } });
      get().notify('Everyone is feeling better. Healing is always free.');
      void get().persist();
      return;
    }
    if (obj.id === 'chest') {
      if (s.flags.includes('chest')) {
        get().notify('You already found this treasure.');
        return;
      }
      const inv = transact(s.inventory, {}, { crystal: 2 });
      if (!inv) {
        get().notify('Make room in your inventory first.');
        return;
      }
      set({
        save: event(
          { ...s, coins: s.coins + 60, inventory: inv, flags: [...s.flags, 'chest'] },
          'open',
          'chest'
        ),
      });
      get().notify('A little treasure! +60 coins and 2 crystals.');
      void get().persist();
      return;
    }
    if (obj.id === 'repair') {
      if (
        !s.flags.includes('ability:passage') ||
        !s.flags.includes('ability:finalSwitch') ||
        !s.quests.q04
      ) {
        get().notify('Accept The Broken Passage and clear and power it first.');
        return;
      }
      if (s.flags.includes('repaired')) return;
      const inv = transact(s.inventory, { processedWood: 6, refinedStone: 4 }, {});
      if (!inv) {
        get().notify('Repair needs 6 processed wood and 4 refined stone.');
        return;
      }
      set({
        save: event({ ...s, inventory: inv, flags: [...s.flags, 'repaired'] }, 'repair', 'passage'),
      });
      get().notify('The forest passage is restored!');
      void get().persist();
      return;
    }
    get().useAbility(obj.id);
  },
  gather: (id) => {
    const s = get().save,
      obj = OBJECTS.find((o) => o.id === id);
    if (!obj?.item) return;
    if (s.quests.q01?.status !== 'complete') {
      get().notify('Talk to Grandpa Moss to begin your adventure.');
      return;
    }
    if (s.nodes[id] > s.playTime) {
      get().notify(`Regrowing — ${Math.ceil(s.nodes[id] - s.playTime)} active-play seconds.`);
      return;
    }
    if (['ore', 'crystal', 'fragment'].includes(obj.item) && !count(s.inventory, 'pickaxe')) {
      get().notify('You need a basic pickaxe. Craft one at Bruno’s bench.');
      return;
    }
    const inv = transact(s.inventory, {}, { [obj.item]: obj.amount ?? 1 });
    if (!inv) {
      get().notify('Your bag is full. Make some room first.');
      return;
    }
    set({
      save: event(
        {
          ...s,
          inventory: inv,
          nodes: { ...s.nodes, [id]: s.playTime + respawnSeconds(obj.item) },
        },
        'gather',
        obj.item,
        obj.amount
      ),
    });
    playerRuntime.actionStarted = Date.now();
    playerRuntime.action = ['wood', 'stone', 'ore', 'crystal', 'fragment'].includes(obj.item)
      ? 'mine'
      : 'pick';
    playerRuntime.actionUntil = Date.now() + 1100;
    playerRuntime.harvest = {
      id: obj.id,
      item: obj.item,
      position: [...obj.pos],
      started: Date.now(),
    };
    get().notify(`+${obj.amount} ${ITEMS[obj.item].name}`);
    sound(playerRuntime.action === 'mine' ? 'hit' : 'gather', get().settings.effects);
    void get().persist();
  },
  craft: (id, batches = 1) => {
    const s = get().save,
      r = RECIPES.find((r) => r.id === id);
    if (!r || s.quests[r.unlock]?.status !== 'complete') return;
    if (Math.hypot(s.position[0] - 10, s.position[2] - 11) > 5) {
      get().notify('Craft at Bruno’s workshop.');
      return;
    }
    if (r.companion && (!s.creatures[r.companion] || s.creatures[r.companion]!.hp <= 0)) {
      get().notify('A healthy Emberfox is needed to help process wood.');
      return;
    }
    const inv = craftBatch(s.inventory, r, batches);
    if (!inv) {
      get().notify('Check ingredients and available inventory space.');
      return;
    }
    set({ save: event({ ...s, inventory: inv }, 'craft', id, r.output * batches) });
    get().notify(`Crafted ${r.output * batches} ${ITEMS[id].name}`);
    sound('gather', get().settings.effects);
    void get().persist();
  },
  trade: (id, buy) => {
    const s = get().save,
      price = buy ? ITEMS[id].buy : ITEMS[id].sell;
    if (!price) return;
    if (Math.hypot(s.position[0] + 15, s.position[2] - 6) > 5) {
      get().notify('Visit Foxy to trade.');
      return;
    }
    if (buy && s.coins < price) {
      get().notify('Not enough coins.');
      return;
    }
    const inv = transact(s.inventory, buy ? {} : { [id]: 1 }, buy ? { [id]: 1 } : {});
    if (!inv) {
      get().notify(buy ? 'Your bag is full.' : 'You don’t have that item to sell.');
      return;
    }
    set({ save: { ...s, inventory: inv, coins: s.coins + (buy ? -price : price) } });
    sound('click', get().settings.effects);
    void get().persist();
  },
  summon: (id) => {
    const s = get().save;
    if (!s.creatures[id] || s.creatures[id]!.hp <= 0) {
      get().notify('Visit the village healing station first.');
      return;
    }
    set({ save: { ...s, active: id }, command: 'follow' });
    get().notify(`${CREATURES[id].name} is following you.`);
    void get().persist();
  },
  feed: (id) => {
    const s = get().save,
      c = s.creatures[id];
    if (!c) return;
    const inv = transact(s.inventory, { [CREATURES[id].food]: 1 }, {});
    if (!inv) {
      get().notify(`You need ${ITEMS[CREATURES[id].food].name}.`);
      return;
    }
    set({
      save: {
        ...s,
        inventory: inv,
        creatures: { ...s.creatures, [id]: { ...c, friendship: Math.min(100, c.friendship + 5) } },
      },
    });
    get().notify('A happy friend! +5 friendship.');
    void get().persist();
  },
  useAbility: (id) => {
    const s = get().save,
      obj = OBJECTS.find((o) => o.id === id);
    if (!obj?.requires) return;
    const active = s.active,
      c = active ? s.creatures[active] : null;
    if (active !== obj.requires || !c || c.hp <= 0) {
      get().notify(`Summon ${CREATURES[obj.requires].name} to help here.`);
      return;
    }
    const flag = 'ability:' + id;
    if (s.flags.includes(flag)) {
      get().notify('Your companion already helped here.');
      return;
    }
    if (['passage', 'finalSwitch'].includes(id) && !s.quests.q04) {
      get().notify('Grandpa Moss has a mission about this passage.');
      return;
    }
    const gains = id === 'plant' ? { fruit: 2 } : id === 'toughNode' ? { ore: 3 } : {};
    const inv = transact(s.inventory, {}, gains);
    if (!inv) {
      get().notify('Make room in your inventory first.');
      return;
    }
    set({
      save: event(
        {
          ...s,
          inventory: inv,
          flags: [...s.flags, flag],
          creatures: {
            ...s.creatures,
            [active]: { ...c, xp: c.xp + 15, friendship: Math.min(100, c.friendship + 3) },
          },
        },
        'ability',
        id
      ),
    });
    get().notify(`${CREATURES[active].name} used ${CREATURES[active].ability.toLowerCase()}!`);
    sound('friend', get().settings.effects);
    void get().persist();
  },
  attack: (elemental = false) => {
    const s = get().save;
    const cooldown = elemental ? s.abilityCooldown : s.attackCooldown;
    if (cooldown > 0) return;
    playerRuntime.action = 'attack';
    playerRuntime.actionStarted = Date.now();
    playerRuntime.actionUntil = Date.now() + 650;
    if (s.active && s.creatures[s.active]?.hp && Date.now() >= companionRuntime.attackUntil) {
      companionRuntime.attackStarted = Date.now();
      companionRuntime.attackUntil = Date.now() + 650;
      companionRuntime.elemental = elemental;
      companionRuntime.target =
        Math.hypot(s.position[0] - 92, s.position[2] - 20) < 6
          ? [92, 0, 20]
          : [
              s.position[0] + Math.sin(playerRuntime.heading) * 3,
              s.position[1],
              s.position[2] + Math.cos(playerRuntime.heading) * 3,
            ];
    }
    if (!s.flags.includes('repaired')) {
      get().notify('The Guardian waits beyond the repaired passage.');
      return;
    }
    if (s.flags.includes('guardianDefeated')) return;
    if (Math.hypot(s.position[0] - 92, s.position[2] - 20) > 5) {
      get().notify('Get within 5 units of the Guardian.');
      return;
    }
    const id = s.active,
      c = id ? s.creatures[id] : null;
    if (!id || !c || c.hp <= 0) {
      get().notify('Summon a healthy companion first.');
      return;
    }
    if ((elemental ? s.abilityCooldown : s.attackCooldown) > 0) return;
    companionRuntime.attackStarted = Date.now();
    companionRuntime.attackUntil = Date.now() + 650;
    companionRuntime.elemental = elemental;
    const damage = elementalDamage(
      elemental ? 18 : 10,
      elemental ? CREATURES[id].type : 'Neutral',
      'Earth'
    );
    const hp = Math.max(0, s.enemyHp - damage);
    let next: Save = {
      ...s,
      enemyHp: hp,
      attackCooldown: elemental ? s.attackCooldown : 1.5,
      abilityCooldown: elemental ? 6 : s.abilityCooldown,
    };
    if (hp === 0) {
      next = event(
        {
          ...next,
          flags: [...s.flags, 'guardianDefeated'],
          coins: s.coins + 80,
          creatures: { ...s.creatures, [id]: { ...c, xp: c.xp + 120 } },
        },
        'defeat',
        'guardian'
      );
      get().notify('The Guardian is calm. +80 coins · +120 companion XP');
      void 0;
    }
    set({ save: next });
    sound('hit', get().settings.effects);
    if (hp === 0) void get().persist();
  },
  discover: (id) => {
    const s = get().save;
    if (s.discoveries.includes(id)) return;
    set({ save: event({ ...s, discoveries: [...s.discoveries, id] }, 'discover', id) });
    if (!['square', 'plot'].includes(id))
      get().notify('Location discovered — ' + (OBJECTS.find((o) => o.id === id)?.name ?? id));
  },
  place: (b) => {
    const s = get().save;
    if (s.quests.q02?.status !== 'complete') {
      get().notify('Help Bruno to unlock building.');
      return;
    }
    if (!validPlacement(b, s.blocks, s.position)) return;
    const inv = transact(s.inventory, { [b.item]: 1 }, {});
    if (!inv) {
      get().notify(`You need ${ITEMS[b.item].name}.`);
      return;
    }
    let next = { ...s, inventory: inv, blocks: [...s.blocks, b] };
    if (validShelter(next.blocks)) next = event(next, 'shelter', 'home');
    set({ save: next });
    sound('gather', get().settings.effects);
    void get().persist();
  },
  remove: (b) => {
    const s = get().save;
    if (!s.blocks.some((v) => v.x === b.x && v.y === b.y && v.z === b.z)) return;
    const inv = transact(s.inventory, {}, { [b.item]: 1 });
    if (!inv) {
      get().notify('Your bag is full. The block stays in place.');
      return;
    }
    set({
      save: {
        ...s,
        inventory: inv,
        blocks: s.blocks.filter((v) => !(v.x === b.x && v.y === b.y && v.z === b.z)),
      },
    });
    void get().persist();
  },
  tick: (dt) => {
    const state = get();
    if (!state.started || state.panel || state.dialogue || document.hidden) return;
    let s = state.save;
    const near = Math.hypot(s.position[0] - 92, s.position[2] - 20) < 8;
    let enemyCooldown = near ? Math.max(0, s.enemyCooldown - dt) : 3;
    let hp = s.hp,
      creatures = s.creatures;
    if (
      near &&
      s.flags.includes('repaired') &&
      !s.flags.includes('guardianDefeated') &&
      enemyCooldown === 0
    ) {
      enemyCooldown = 3;
      if (s.active && creatures[s.active] && creatures[s.active]!.hp > 0) {
        const c = creatures[s.active]!;
        creatures = { ...creatures, [s.active]: { ...c, hp: Math.max(0, c.hp - 10) } };
      } else hp = Math.max(0, hp - 12);
    }
    const defeated = hp === 0;
    if (defeated) get().notify('You woke up safely in Momo Village.');
    set({
      save: {
        ...s,
        creatures,
        hp: defeated ? 100 + (levelFromXp(s.xp).level - 1) * 5 : hp,
        position: defeated ? [0, 1, 5] : s.position,
        enemyHp: !near && !s.flags.includes('guardianDefeated') ? 100 : s.enemyHp,
        enemyCooldown,
        playTime: s.playTime + dt,
        attackCooldown: Math.max(0, s.attackCooldown - dt),
        abilityCooldown: Math.max(0, s.abilityCooldown - dt),
      },
    });
  },
  persist: async (quit = false) => {
    const snapshot = structuredClone(get().save);
    const revision = snapshot.revision + 1;
    set({ save: { ...get().save, revision }, saveStatus: 'Saving…' });
    saveQueue = saveQueue
      .catch(() => {})
      .then(async () => {
        const db = await database();
        const tx = db.transaction('saves', 'readwrite');
        const previous = (await tx.store.get('adventure')) as Save | undefined;
        if (previous && previous.revision !== revision - 1) {
          tx.abort();
          await tx.done.catch(() => {});
          throw Error('Save conflict: another tab saved this adventure. Reload before continuing.');
        }
        await tx.store.put({ ...snapshot, revision }, 'adventure');
        await tx.done;
      });
    try {
      await saveQueue;
      set({
        hasSave: true,
        saveStatus: 'Saved locally',
        ...(quit ? { started: false, panel: null, dialogue: null } : {}),
      });
    } catch (e) {
      set({ saveStatus: 'Save failed' });
      get().notify((e as Error).message);
    }
  },
  configure: (settings) => {
    const next = { ...get().settings, ...settings };
    set({ settings: next });
    try {
      localStorage.setItem('momo-settings', JSON.stringify(next));
    } catch {
      get().notify('Settings could not be saved in this browser.');
    }
  },
}));
export function deliver(id: string) {
  const state = useGame.getState();
  let s = state.save,
    changed = false;
  for (const def of QUESTS) {
    const q = s.quests[def.id];
    if (!q || q.status !== 'active') continue;
    for (const obj of def.objectives) {
      if (obj.event !== 'deliver' || (q.progress[obj.id] ?? 0) >= obj.count) continue;
      if (obj.target === 'parcel' && id === 'bloop') {
        s = event(s, 'deliver', 'parcel');
        changed = true;
      } else if (
        obj.target === id &&
        def.objectives
          .filter((o) => o.id !== obj.id)
          .every((o) => (s.quests[def.id].progress[o.id] ?? 0) >= o.count)
      ) {
        const inv = transact(s.inventory, obj.consume ?? {}, {});
        if (inv) {
          s = event({ ...s, inventory: inv }, 'deliver', id);
          changed = true;
        }
      }
    }
  }
  useGame.setState({ save: s });
  state.notify(
    changed
      ? 'Delivery complete. Thank you!'
      : 'No delivery ready. Check your quest objectives and required items.'
  );
  if (changed) void state.persist();
}
