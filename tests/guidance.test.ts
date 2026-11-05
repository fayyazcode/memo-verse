import { describe, it, expect } from 'vitest';
import { missionGuidance } from '../src/game/guidance';
import { freshSave } from '../src/game/store';
import { QUESTS, OBJECTS } from '../src/game/data';
describe('mission helping hand', () => {
  it('shows no destinations for inactive or completed missions', () => {
    const s = freshSave();
    expect(missionGuidance(s)).toEqual([]);
    s.quests.q01 = { status: 'complete', progress: {} };
    expect(missionGuidance(s)).toEqual([]);
  });
  it('hides completed objectives and routes ready missions to their giver', () => {
    const s = freshSave();
    s.quests.q01 = { status: 'active', progress: { moss: 1 } };
    expect(missionGuidance(s).some((h) => h.id === 'q01:moss')).toBe(false);
    s.quests.q01.progress = Object.fromEntries(QUESTS[0].objectives.map((o) => [o.id, o.count]));
    expect(missionGuidance(s)).toMatchObject([
      { label: 'Claim your reward', position: [-7, 0, -5] },
    ]);
  });
  it('selects a live resource node and shows remaining counts', () => {
    const s = freshSave();
    s.quests.q02 = { status: 'active', progress: { wood: 4 } };
    const node = OBJECTS.find((o) => o.id === 'tree0')!;
    s.position = [...node.pos];
    s.nodes.tree0 = 180;
    const hint = missionGuidance(s).find((h) => h.id === 'q02:wood')!;
    expect(hint.remaining).toBe(4);
    expect(hint.position).not.toEqual(node.pos);
    expect(hint.help).toContain('4 more Wood');
  });
  it('resolves every objective in the campaign without missing destinations', () => {
    const s = freshSave();
    for (const q of QUESTS) s.quests[q.id] = { status: 'active', progress: {} };
    const hints = missionGuidance(s);
    expect(hints).toHaveLength(QUESTS.reduce((n, q) => n + q.objectives.length, 0));
    for (const h of hints) {
      expect(h.position.every(Number.isFinite)).toBe(true);
      expect(h.help.length).toBeGreaterThan(20);
    }
  });
  it('includes crafting costs, befriending food and shelter instructions', () => {
    const s = freshSave();
    for (const id of ['q03', 'q09']) s.quests[id] = { status: 'active', progress: {} };
    const hints = missionGuidance(s);
    expect(hints.find((h) => h.id === 'q03:treat')?.help).toContain('you have 0');
    expect(hints.find((h) => h.id === 'q03:friend')?.help).toContain('Warm berry treat');
    expect(hints.find((h) => h.id === 'q09:shelter')?.help).toContain('clear doorway');
  });
});

describe('moonflower directions', () => {
  it('points the watering objective to the bridge-side plant and clears it after watering', () => {
    const s = freshSave();
    s.quests.q07 = { status: 'active', progress: {} };
    const hint = missionGuidance(s).find((h) => h.id === 'q07:water')!;
    expect(hint.position).toEqual(OBJECTS.find((o) => o.id === 'plant')!.pos);
    expect(hint.help).toContain('east end of the wooden bridge');
    expect(hint.help).toContain('golden quest beacon');
    s.quests.q07.progress.water = 1;
    expect(missionGuidance(s).some((h) => h.id === 'q07:water')).toBe(false);
  });
});
