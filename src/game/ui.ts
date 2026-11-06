import { QUESTS } from './data';
import { validShelter } from './rules';
import type { Save } from './store';
export function trackedMission(save: Save, preferred: string | null) {
  const active = QUESTS.filter((q) => save.quests[q.id]?.status === 'active');
  return active.find((q) => q.id === preferred) ?? active[0] ?? null;
}
export function missionProgress(save: Save, id: string) {
  const quest = QUESTS.find((q) => q.id === id)!;
  const total = quest.objectives.reduce((n, o) => n + o.count, 0);
  const value = (o: (typeof quest.objectives)[number]) =>
    o.event === 'shelter' && !validShelter(save.blocks)
      ? 0
      : Math.min(o.count, save.quests[id]?.progress[o.id] ?? 0);
  const done = quest.objectives.reduce((n, o) => n + value(o), 0);
  const next = quest.objectives.find((o) => value(o) < o.count);
  return { total, done, next, current: next ? value(next) : 0 };
}
export function noticeTone(text: string): 'danger' | 'reward' | 'warning' | 'info' {
  if (
    /save conflict|save failed|could not be saved|quota|indexeddb|database|invalid save|woke up|defeat|unavailable/i.test(
      text
    )
  )
    return 'danger';
  if (/mission complete|reward|level up|new friend/i.test(text)) return 'reward';
  if (/need|full|blocked|cooling|unlock|not enough|no target|first/i.test(text)) return 'warning';
  return 'info';
}
export const uiScales = [90, 100, 115, 130] as const;
export function combinePickup(first: string, second: string): string | null {
  const a = first.match(/^\+(\d+) (.+)$/),
    b = second.match(/^\+(\d+) (.+)$/);
  if (!a || !b || a[2] !== b[2]) return null;
  const total = Number(a[1]) + Number(b[1]);
  return Number.isSafeInteger(total) ? `+${total} ${a[2]}` : null;
}

export const notificationPriority = { info: 0, warning: 1, reward: 2, danger: 3 };
export function enqueueNotice<T extends { text: string; tone: keyof typeof notificationPriority }>(
  queue: T[],
  item: T
): T[] {
  return [...queue, item]
    .sort((a, b) => notificationPriority[b.tone] - notificationPriority[a.tone])
    .slice(0, 4);
}

// Reserve global interruptions for blocked actions, progression and persistence failures.
export function importantNotice(text: string): boolean {
  if (/^\+|regrowing|cooling|no target|already.*friend/i.test(text)) return false;
  return (
    ['danger', 'warning', 'reward'].includes(noticeTone(text)) ||
    /treasure|passage.*restored|could not be saved|invalid save/i.test(text)
  );
}
