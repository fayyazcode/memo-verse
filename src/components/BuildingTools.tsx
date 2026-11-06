'use client';
import { useMemo } from 'react';
import { Home, RotateCw, Square, Triangle, DoorOpen } from 'lucide-react';
import { useGame } from '@/game/store';
import { count } from '@/game/rules';
import { HOME_COST, homeSite, type BuildPart } from '@/game/building';
export default function BuildingTools() {
  const { save, buildPart, buildRotation, roofHeight, gateFloor } = useGame();
  const site = useMemo(
    () => homeSite(save.blocks, save.position, buildRotation),
    [save.blocks, save.position, buildRotation]
  );
  const blocks = count(save.inventory, 'block');
  const choose = (part: BuildPart) => {
    const index = save.hotbar.indexOf('block');
    useGame.setState({ buildPart: part, ...(index >= 0 ? { selected: index } : {}) });
  };
  return (
    <section className="building-tools" aria-label="House building tools">
      <div className="building-part-options">
        {(
          [
            { id: 'wall', label: 'Wall', icon: Square },
            { id: 'roof', label: 'Roof', icon: Triangle },
            { id: 'gate', label: 'Gate', icon: DoorOpen },
            { id: 'home', label: 'Starter home', icon: Home },
          ] as const
        ).map((part) => (
          <button
            key={part.id}
            aria-label={`Build ${part.label.toLowerCase()}`}
            aria-pressed={buildPart === part.id}
            onClick={() => choose(part.id)}
          >
            <part.icon size={18} />
            <span>{part.label}</span>
          </button>
        ))}
      </div>
      <div className="building-materials">
        <span>{blocks} wooden blocks</span>
        {(buildPart === 'gate' || buildPart === 'home') && (
          <button
            aria-label="Rotate building piece"
            onClick={() => useGame.setState({ buildRotation: buildRotation ? 0 : 1 })}
          >
            <RotateCw size={16} />
            Rotate
          </button>
        )}
        {buildPart === 'roof' && (
          <label>
            Roof height{' '}
            <select
              aria-label="Roof height"
              value={roofHeight}
              onChange={(e) => useGame.setState({ roofHeight: Number(e.target.value) })}
            >
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        {buildPart === 'gate' && (
          <label>
            Gate floor{' '}
            <select
              aria-label="Gate floor"
              value={gateFloor}
              onChange={(e) => useGame.setState({ gateFloor: Number(e.target.value) })}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {buildPart === 'home' ? (
        <>
          <button
            className="build-starter"
            disabled={!site || blocks < HOME_COST}
            onClick={() => site && useGame.getState().buildHome(...site)}
          >
            Build starter home · {HOME_COST} blocks
          </button>
          <small>
            {!site
              ? 'Stand near a clear area on your housing plot.'
              : blocks < HOME_COST
                ? 'Craft 24 blocks from 12 wood at Bruno’s bench.'
                : 'The outline shows where your home will stand.'}
          </small>
        </>
      ) : (
        <small>
          {buildPart === 'roof'
            ? `Stack walls ${roofHeight} blocks high, then tap to place roof panels at level ${roofHeight}.`
            : buildPart === 'gate'
              ? 'Tap a clear doorway. Interact with the gate to open it.'
              : 'Stack walls two blocks high. Leave a doorway.'}{' '}
          Each piece uses 1 wooden block.
        </small>
      )}
    </section>
  );
}
