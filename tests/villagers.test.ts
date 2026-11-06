import { describe, it, expect } from 'vitest';
import { NPCS, QUESTS } from '../src/game/data';
import {
  commute,
  homePoint,
  npcPosition,
  routeLength,
  villagerPose,
  walkable,
} from '../src/game/villagers';
import { freshSave, useGame } from '../src/game/store';
import { missionGuidance } from '../src/game/guidance';

describe('villager daily routines', () => {
  it('routes every commute around outdoor buildings and props, using the door to enter', () => {
    for (const n of NPCS) {
      const route = commute(n.id);
      expect(route[0]).toEqual(n.pos);
      expect(route.at(-3)).toEqual(homePoint(n.id, 3.5));
      expect(route.at(-1)).toEqual(homePoint(n.id, -0.9, 0.36));
      for (let i = 1; i < route.length - 2; i++) {
        const a = route[i - 1],
          b = route[i];
        for (let t = 0; t <= 1; t += 0.1)
          expect(
            walkable(a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t),
            `${n.id} ${a} → ${b}`
          ).toBe(true);
      }
      expect(routeLength(route) / 1.15).toBeLessThan(58);
    }
  });
  it('walks on errands, works, returns home, rests, and returns to work each day', () => {
    for (const [index, n] of NPCS.entries()) {
      const work = 24 + index * 3;
      expect(villagerPose(n.id, work).working).toBe(true);
      expect(villagerPose(n.id, work + 8)).toMatchObject({
        moving: true,
        working: false,
        activity: 'Checking supplies',
      });
      expect(villagerPose(n.id, work + 7).position).not.toEqual(
        villagerPose(n.id, work + 9).position
      );
      expect(villagerPose(n.id, 421 + index * 16)).toMatchObject({
        moving: true,
        activity: 'Walking home',
      });
      expect(villagerPose(n.id, 600)).toMatchObject({
        indoors: true,
        resting: true,
        moving: false,
      });
      expect(villagerPose(n.id, 631 + index * 8)).toMatchObject({
        moving: true,
        activity: 'Heading to work',
      });
      expect(villagerPose(n.id, 719)).toMatchObject({ working: true, indoors: false });
      expect(villagerPose(n.id, 600)).toEqual(villagerPose(n.id, 1320));
    }
  });
  it('commutes continuously at walking speed and finishes through the front doorway', () => {
    for (const [index, n] of NPCS.entries()) {
      const depart = 420 + index * 16;
      for (let t = depart; t < depart + routeLength(commute(n.id)) / 1.15 - 0.2; t += 0.1) {
        const a = villagerPose(n.id, t).position,
          b = villagerPose(n.id, t + 0.1).position;
        expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThanOrEqual(0.115001);
      }
    }
  });
  it('reconstructs nighttime destinations and quest rewards from old saves without migration', () => {
    const save = freshSave();
    save.playTime = 600;
    save.quests.q01 = {
      status: 'active',
      progress: Object.fromEntries(QUESTS[0].objectives.map((o) => [o.id, o.count])),
    };
    const hint = missionGuidance(save).find((h) => h.id === 'q01:reward');
    expect(hint?.position).toEqual(homePoint('moss', 3.5));
    expect(hint?.help).toContain('home door');
    for (const n of NPCS) expect(npcPosition(n.id, save.playTime)).toEqual(homePoint(n.id, 3.5));
    expect(save.version).toBe(1);
  });
  it('allows trading beside Foxy at home and rejects remote trades', () => {
    const save = freshSave();
    save.playTime = 600;
    save.position = homePoint('foxy', 3.5);
    save.coins = 1000;
    useGame.setState({ save });
    const before = useGame.getState().save.coins;
    useGame.getState().trade('berry', true);
    expect(useGame.getState().save.coins).toBeLessThan(before);
    useGame.setState({ save: { ...useGame.getState().save, position: [25, 0, 20] } });
    const remote = useGame.getState().save.coins;
    useGame.getState().trade('berry', true);
    expect(useGame.getState().save.coins).toBe(remote);
  });
});

describe('knock and doorstep conversations', () => {
  it('brings a resting villager outside before opening dialogue, then returns them home', async () => {
    const { resetVillagerVisits, visitStatus } = await import('../src/game/villagers');
    resetVillagerVisits();
    const save = freshSave();
    save.playTime = 600;
    save.position = homePoint('moss', 3.5);
    useGame.setState({
      save,
      started: true,
      panel: null,
      dialogue: null,
      visitor: null,
      target: 'moss',
    });
    useGame.getState().interact();
    expect(useGame.getState().visitor).toBe('moss');
    expect(useGame.getState().dialogue).toBeNull();
    expect(visitStatus('moss', 600)).toBe('coming');
    const start = villagerPose('moss', 600).position;
    useGame.getState().tick(1);
    expect(villagerPose('moss', 601).position).not.toEqual(start);
    expect(useGame.getState().dialogue).toBeNull();
    useGame.getState().tick(5);
    expect(useGame.getState().dialogue).toBe('moss');
    expect(useGame.getState().visitor).toBeNull();
    expect(villagerPose('moss', useGame.getState().save.playTime)).toMatchObject({
      indoors: false,
      moving: false,
    });
    expect(villagerPose('moss', 660)).toMatchObject({ indoors: true, resting: true });
    resetVillagerVisits();
    useGame.setState({ started: false, dialogue: null, visitor: null });
  });
  it('ignores remote knocks and duplicate knocks without moving anyone', async () => {
    const { resetVillagerVisits } = await import('../src/game/villagers');
    resetVillagerVisits();
    const save = freshSave();
    save.playTime = 600;
    save.position = [0, 1, 0];
    useGame.setState({ save, visitor: null });
    useGame.getState().knock('moss');
    expect(useGame.getState().visitor).toBeNull();
    useGame.setState({ save: { ...save, position: homePoint('moss', 3.5) } });
    useGame.getState().knock('moss');
    useGame.getState().knock('moss');
    expect(useGame.getState().visitor).toBe('moss');
    resetVillagerVisits();
    useGame.setState({ visitor: null });
  });
});
