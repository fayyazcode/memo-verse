import {
  CREATURES,
  ITEMS,
  LANDMARKS,
  NPCS,
  OBJECTS,
  QUESTS,
  RECIPES,
  type ItemId,
  type Species,
  type Vec3,
} from './data';
import { npcPosition } from './villagers';
import { count, validShelter } from './rules';
import type { Save } from './store';
export type MissionHint = {
  id: string;
  questId: string;
  mission: string;
  label: string;
  help: string;
  position: Vec3;
  remaining: number;
};
export function missionGuidance(save: Save, onlyQuest?: string): MissionHint[] {
  const hints: MissionHint[] = [];
  const npc = (id: string) => ({
    ...NPCS.find((n) => n.id === id)!,
    pos: npcPosition(id, save.playTime),
  });
  for (const quest of QUESTS) {
    const state = save.quests[quest.id];
    if (state?.status !== 'active' || (onlyQuest && quest.id !== onlyQuest)) continue;
    const unfinished = quest.objectives.filter(
      (o) =>
        (state.progress[o.id] ?? 0) < o.count ||
        (o.event === 'shelter' && !validShelter(save.blocks))
    );
    if (!unfinished.length) {
      const giver = npc(quest.giver);
      hints.push({
        id: quest.id + ':reward',
        questId: quest.id,
        mission: quest.name,
        label: 'Claim your reward',
        help: `Return to ${giver.name}, open dialogue, and collect your reward. If they are resting, knock at their marked home door.`,
        position: giver.pos,
        remaining: 1,
      });
      continue;
    }
    for (const objective of unfinished) {
      const target = objective.target;
      let position: Vec3 = npc(quest.giver).pos,
        help = objective.label;
      if (objective.event === 'talk') {
        const n = npc(target);
        position = n.pos;
        help = `Find ${n.name} in the village. Click them or press E nearby to talk. If they are resting, knock at their marked home door.`;
      }
      if (objective.event === 'gather') {
        const nodes = OBJECTS.filter((o) => o.item === target);
        const available = nodes.filter((o) => (save.nodes[o.id] ?? 0) <= save.playTime);
        const candidates = available.length ? available : nodes;
        const node = [...candidates].sort(
          (a, b) =>
            Math.hypot(a.pos[0] - save.position[0], a.pos[2] - save.position[2]) -
            Math.hypot(b.pos[0] - save.position[0], b.pos[2] - save.position[2])
        )[0];
        if (node) position = node.pos;
        help = `Collect ${Math.max(0, objective.count - (state.progress[objective.id] ?? 0))} more ${ITEMS[target as ItemId]?.name ?? target}. Click the marked resource or press F nearby. ${['ore', 'crystal', 'fragment'].includes(target) ? 'Bring a basic pickaxe. ' : ''}${available.length ? '' : 'The nodes are regrowing; timers advance during active play.'}`;
      }
      if (objective.event === 'craft') {
        position = OBJECTS.find((o) => o.id === 'craft')!.pos;
        const recipe = RECIPES.find((r) => r.id === target)!;
        help = `Visit Bruno’s crafting bench. ${ITEMS[recipe.id].name}: ${Object.entries(
          recipe.ingredients
        )
          .map(
            ([id, n]) =>
              `${n} ${ITEMS[id as ItemId].name} (you have ${count(save.inventory, id as ItemId)})`
          )
          .join(', ')}.${recipe.companion ? ' Bring a healthy Emberfox.' : ''}`;
      }
      if (objective.event === 'befriend') {
        const c = CREATURES[target as Species];
        position = c.pos;
        help = `Find ${c.name} in its habitat. Bring 1 ${ITEMS[c.food].name}, then click the creature or press E. Befriending consumes the food.`;
      }
      if (objective.event === 'discover') {
        const location = LANDMARKS.find((l) => l.id === target)!;
        position = location.pos;
        help = `Walk into ${location.name}. Discovery is recorded automatically.`;
      }
      if (objective.event === 'deliver') {
        const n = npc(target === 'parcel' ? 'bloop' : target);
        position = n.pos;
        help = `Talk to ${n.name} and choose Make a delivery. ${
          objective.consume
            ? Object.entries(objective.consume)
                .map(
                  ([id, n]) =>
                    `${n} ${ITEMS[id as ItemId].name} (you have ${count(save.inventory, id as ItemId)})`
                )
                .join(', ')
            : 'Foxy’s parcel is in your quest pouch.'
        } Required resources are consumed. Finish the earlier collection objectives first.`;
      }
      if (objective.event === 'ability') {
        const obj = OBJECTS.find((o) => o.id === target)!;
        position = obj.pos;
        help = `${target === 'plant' ? 'Find the large white-and-purple moonflower on the riverbank at the east end of the wooden bridge, near Aquabub. Look for its nameplate and golden quest beacon. On the full map, select the Water the marked plant destination. ' : ''}Summon ${CREATURES[obj.requires!].name} from the creature collection (C on desktop, or the paw icon in the bottom menu), then click ${obj.name} or use Interact nearby. Heal defeated companions at the village station for free.`;
      }
      if (objective.event === 'shelter') {
        position = [2, 0, 27];
        help =
          'At your housing plot, press B. Build at least 12 structural blocks: three walls two blocks high around a usable interior cell, a roof at height 2, and a clear doorway. Twelve scattered blocks do not count.';
      }
      if (objective.event === 'repair') {
        position = OBJECTS.find((o) => o.id === 'repair')!.pos;
        help =
          'Power the switch with Zaplet and clear the passage with Mosshell first. Bring 6 processed wood and 4 refined stone, then interact with the repair point.';
      }
      if (objective.event === 'defeat') {
        position = OBJECTS.find((o) => o.id === 'guardian')!.pos;
        help =
          'Repair the passage first. Summon a healthy companion, approach the Guardian, then use left click for basic attacks and Q for an elemental attack. Watch the orange warning ring.';
      }
      if (objective.event === 'open') {
        position = OBJECTS.find((o) => o.id === target)!.pos;
        help =
          'Find the hidden chest and click it or press E nearby. Leave room in your inventory for the treasure.';
      }
      hints.push({
        id: quest.id + ':' + objective.id,
        questId: quest.id,
        mission: quest.name,
        label: objective.label,
        help,
        position,
        remaining: Math.max(1, objective.count - (state.progress[objective.id] ?? 0)),
      });
    }
  }
  return hints;
}
