import { enqueueNotice } from '../src/game/ui';
import { describe, it, expect } from 'vitest';
import { freshSave } from '../src/game/store';
import { trackedMission, missionProgress, noticeTone, combinePickup } from '../src/game/ui';
describe('HUD projections', () => {
  it('tracks the selected active mission and falls back safely after completion', () => {
    const s = freshSave();
    s.quests.q02 = { status: 'active', progress: {} };
    s.quests.q03 = { status: 'active', progress: {} };
    expect(trackedMission(s, 'q03')!.id).toBe('q03');
    s.quests.q03.status = 'complete';
    expect(trackedMission(s, 'q03')!.id).toBe('q02');
    expect(trackedMission(freshSave(), null)).toBeNull();
  });
  it('clamps objective progress and advances to unfinished objectives', () => {
    const s = freshSave();
    s.quests.q01 = { status: 'active', progress: { moss: 100 } };
    const p = missionProgress(s, 'q01');
    expect(p.done).toBeLessThanOrEqual(p.total);
    expect(p.next?.id).not.toBe('moss');
  });
  it('makes save errors and rewards visually distinct from routine messages', () => {
    expect(noticeTone('Save conflict: another tab saved')).toBe('danger');
    expect(noticeTone('Mission complete! +80 coins')).toBe('reward');
    expect(noticeTone('Your bag is full.')).toBe('warning');
    expect(noticeTone('+4 Wood')).toBe('info');
  });
});

it('combines repeated resource feedback without mixing items or warnings', () => {
  expect(combinePickup('+4 Wood', '+3 Wood')).toBe('+7 Wood');
  expect(combinePickup('+4 Wood', '+2 Stone')).toBeNull();
  expect(combinePickup('Inventory full', '+2 Wood')).toBeNull();
});

it('does not show a demolished shelter as ready to claim', () => {
  const s = freshSave();
  s.quests.q09 = { status: 'active', progress: { plot: 1, craft: 12, shelter: 1 } };
  const p = missionProgress(s, 'q09');
  expect(p.next!.id).toBe('shelter');
  expect(p.current).toBe(0);
  expect(p.done).toBeLessThan(p.total);
});
it('keeps pending rewards ahead of routine messages in a bounded queue', () => {
  const reward = { text: 'Mission complete!', tone: 'reward' as const };
  let queue = enqueueNotice([] as { text: string; tone: 'info' | 'reward' }[], reward);
  for (let i = 0; i < 10; i++) queue = enqueueNotice(queue, { text: `+${i} Wood`, tone: 'info' });
  expect(queue).toHaveLength(4);
  expect(queue[0]).toEqual(reward);
});

describe('quiet play notifications', () => {
  it('keeps routine activity quiet and preserves consequential feedback', async () => {
    const { importantNotice } = await import('../src/game/ui');
    for (const message of [
      '+4 Wood',
      'Crafted 12 Wooden block',
      'Holding a cookie',
      'Regrowing — 10 seconds',
      'No target in range',
      'Ability cooling down',
    ])
      expect(importantNotice(message)).toBe(false);
    for (const message of [
      'Save conflict: another tab saved',
      'Your bag is full.',
      'You need a basic pickaxe.',
      'Mission complete! +80 coins',
      'Emberfox is your new friend!',
      'Settings could not be saved in this browser.',
    ])
      expect(importantNotice(message)).toBe(true);
  });
});
