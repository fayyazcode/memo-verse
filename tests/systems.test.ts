import { beforeEach, describe, expect, it, vi } from 'vitest';
import { freshSave, useGame } from '../src/game/store';
import { count } from '../src/game/rules';
beforeEach(() => {
  vi.stubGlobal('document', { hidden: false });
  useGame.setState({
    save: freshSave(),
    started: true,
    panel: null,
    dialogue: null,
    command: 'follow',
    persist: vi.fn(async () => {}),
  });
});
describe('resource lifecycle', () => {
  it('regrows only after active-play time and pauses in menus', () => {
    const s = freshSave();
    s.quests.q01 = { status: 'complete', progress: {} };
    useGame.setState({ save: s });
    useGame.getState().gather('tree0');
    expect(count(useGame.getState().save.inventory, 'wood')).toBe(4);
    useGame.getState().gather('tree0');
    expect(count(useGame.getState().save.inventory, 'wood')).toBe(4);
    useGame.setState({ panel: 'pause' });
    useGame.getState().tick(180);
    expect(useGame.getState().save.playTime).toBe(0);
    useGame.setState({ panel: null });
    useGame.getState().tick(180);
    useGame.getState().gather('tree0');
    expect(count(useGame.getState().save.inventory, 'wood')).toBe(8);
  });
});
describe('creature transactions', () => {
  it('requires food, consumes it once and refuses duplicate collection', () => {
    const s = freshSave();
    s.quests.q02 = { status: 'complete', progress: {} };
    useGame.setState({ save: s, target: 'creature:emberfox' });
    useGame.getState().interact();
    expect(useGame.getState().save.creatures.emberfox).toBeUndefined();
    useGame.setState((s) => ({ save: { ...s.save, inventory: [{ item: 'warmTreat', qty: 2 }] } }));
    useGame.getState().interact();
    expect(count(useGame.getState().save.inventory, 'warmTreat')).toBe(1);
    useGame.getState().interact();
    expect(count(useGame.getState().save.inventory, 'warmTreat')).toBe(1);
    expect(useGame.getState().save.active).toBe('emberfox');
  });
  it('does not summon defeated companions and healing is free', () => {
    const s = freshSave();
    s.creatures.emberfox = { hp: 0, xp: 0, friendship: 20 };
    useGame.setState({ save: s });
    useGame.getState().summon('emberfox');
    expect(useGame.getState().save.active).toBeNull();
    useGame.setState({ target: 'heal' });
    useGame.getState().interact();
    expect(useGame.getState().save.creatures.emberfox?.hp).toBe(60);
    expect(useGame.getState().save.coins).toBe(50);
    useGame.getState().summon('emberfox');
    expect(useGame.getState().command).toBe('follow');
  });
});
describe('economy', () => {
  it('buys and sells at listed prices without negative balances', () => {
    const s = freshSave();
    s.position = [-15, 1, 6];
    useGame.setState({ save: s });
    useGame.getState().trade('wood', true);
    expect(useGame.getState().save.coins).toBe(40);
    expect(count(useGame.getState().save.inventory, 'wood')).toBe(1);
    useGame.getState().trade('wood', false);
    expect(useGame.getState().save.coins).toBe(44);
    useGame.getState().trade('wood', false);
    expect(useGame.getState().save.coins).toBe(44);
    useGame.getState().trade('pickaxe', true);
    expect(count(useGame.getState().save.inventory, 'pickaxe')).toBe(0);
  });
});
