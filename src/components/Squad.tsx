'use client';
import { useEffect } from 'react';
import { X, Lock, Flame, Droplets, Mountain, Zap, ChevronUp } from 'lucide-react';
import { CREATURES, type Species } from '@/game/data';
import { useGame } from '@/game/store';
import {
  ABILITIES,
  ROLES,
  PASSIVES,
  TRAINING,
  isWorking,
  memberOf,
  squadOf,
  type Slot,
  type Order,
  type Stance,
} from '@/game/squad';
import { levelFromXp, maxCreatureHp } from '@/game/rules';
import { bindingLabel } from '@/game/bindings';
import CreaturePortrait from './CreaturePortrait';
export function AbilityList({ id }: { id: Species }) {
  const s = useGame((g) => g.save),
    level = levelFromXp(s.creatures[id]?.xp ?? 0).level;
  return (
    <div className="squad-ability-list">
      <p>{PASSIVES[id]}</p>
      {(['Q', 'E', 'R'] as Slot[]).map((slot) => {
        const a = ABILITIES[id][slot];
        return (
          <div key={slot}>
            <b>
              {slot} · {a.name}
            </b>
            <span>
              {a.target === 'ally' ? 'Healing' : a.target === 'squad' ? 'Shield' : 'Power'}{' '}
              {a.power} · {a.range}u range · {a.cooldown}s cooldown
            </span>
            <small>
              {a.status} {level < a.level ? ` · Unlocks at level ${a.level}` : ''}
              {slot === 'R' ? ' · 100 charge' : ''}
            </small>
          </div>
        );
      })}
    </div>
  );
}
export function SquadPanel() {
  const s = useGame((g) => g.save),
    q = squadOf(s),
    action = useGame.getState();
  return (
    <>
      <p className="panel-intro">
        Equip up to three friends. Command one directly; the others assist according to your stance.
        Train at the three practice targets south of the village fountain. Basic attacks and
        abilities earn creature XP; E unlocks at level 5 and R at level 10.
      </p>
      <div className="squad-slots">
        {Array.from({ length: 3 }, (_, i) => {
          const id = q.equipped[i];
          return (
            <div key={i}>
              {id ? (
                <>
                  <b>{CREATURES[id].name}</b>
                  <small>
                    {ROLES[id]} · {s.active === id ? 'Commanded' : 'AI companion'}
                  </small>
                </>
              ) : (
                <span>Empty squad slot {i + 1}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="squad-orders" role="group" aria-label="Squad stance">
        {(['defensive', 'aggressive', 'passive'] as Stance[]).map((stance) => (
          <button
            key={stance}
            className="secondary"
            aria-pressed={q.stance === stance}
            onClick={() => action.squadStance(stance)}
          >
            {stance}
          </button>
        ))}
      </div>
      <p className="panel-intro">
        Defensive protects nearby allies; aggressive engages within 12 units; passive prevents
        automatic attacks. Critically injured companions retreat. Ultimate abilities are always
        manually commanded.
      </p>
      <label className="squad-target">
        Focus target{' '}
        <select
          aria-label="Squad focus target"
          value={q.target ?? ''}
          onChange={(e) => {
            useGame.setState({ save: { ...s, squad: { ...q, target: e.target.value || null } } });
            void action.persist();
          }}
        >
          <option value="">Nearest valid target</option>
          {s.flags.includes('repaired') && !s.flags.includes('guardianDefeated') && (
            <option value="guardian">Bramble Guardian</option>
          )}
          {TRAINING.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="squad-orders" role="group" aria-label="Squad orders">
        {(['follow', 'stay', 'focus', 'retreat'] as Order[]).map((order) => (
          <button
            key={order}
            className="secondary"
            aria-pressed={q.order === order}
            onClick={() => action.squadOrder(order)}
          >
            {order === 'focus' ? 'Focus target' : order}
          </button>
        ))}
        <button
          className="secondary"
          onClick={() => {
            useGame.setState({ panel: null });
            action.interact();
          }}
        >
          Use utility nearby
        </button>
        <button
          className="secondary"
          onClick={() => {
            action.recallSquad();
          }}
        >
          Recall squad
        </button>
      </div>
      <div className="creature-grid">
        {(Object.keys(CREATURES) as Species[]).map((id) => {
          const c = s.creatures[id],
            equipped = q.equipped.includes(id);
          return (
            <article
              className="creature-card"
              key={id}
              aria-label={`${CREATURES[id].name} squad card`}
            >
              <div className="squad-portrait">
                <CreaturePortrait species={id} />
              </div>
              <h3>
                {CREATURES[id].name} · {ROLES[id]}
              </h3>
              <p>
                {c
                  ? `Level ${levelFromXp(c.xp).level} · HP ${Math.ceil(c.hp)}/${maxCreatureHp(c)} · Friendship ${c.friendship}`
                  : 'Not befriended'}
              </p>
              <p>
                {isWorking(s, id)
                  ? 'Assigned worker'
                  : equipped
                    ? s.active === id
                      ? 'Directly commanded'
                      : 'AI companion'
                    : 'In collection'}
              </p>
              <div className="card-actions">
                <button
                  className="secondary"
                  disabled={!c || (!equipped && (q.equipped.length === 3 || isWorking(s, id)))}
                  onClick={() => action.equip(id, !equipped)}
                >
                  {equipped ? 'Unequip' : 'Equip'} {CREATURES[id].name}
                </button>
                {equipped && (
                  <button
                    className="primary"
                    disabled={!c?.hp || s.active === id || q.switchCooldown > 0}
                    onClick={() => action.switchCompanion(id)}
                  >
                    Command {CREATURES[id].name}
                  </button>
                )}
              </div>
              <AbilityList id={id} />
            </article>
          );
        })}
      </div>
    </>
  );
}
export function SquadHud() {
  const s = useGame((g) => g.save),
    busy = useGame((g) => !!g.panel || !!g.dialogue),
    bindings = useGame((g) => g.settings.bindings),
    expanded = useGame((g) => g.abilityTrayOpen),
    build = useGame((g) => g.build),
    q = squadOf(s),
    id = s.active;
  useEffect(() => {
    if (busy || build) useGame.setState({ abilityTrayOpen: false });
  }, [busy, build]);
  if (!q.equipped.length) return null;
  const m = id ? memberOf(s, id) : null,
    level = id ? levelFromXp(s.creatures[id]!.xp).level : 0;
  return (
    <section className="squad-hud" aria-label="Creature squad" data-expanded={expanded}>
      <button
        className="companion-summary"
        aria-label="Toggle companion abilities"
        aria-expanded={expanded}
        onClick={() => useGame.setState({ abilityTrayOpen: !expanded })}
      >
        {id ? (
          <>
            <span className="companion-summary-portrait">
              <CreaturePortrait species={id} />
            </span>
            <span>
              <b>
                {CREATURES[id].name} <small>Lv. {level}</small>
              </b>
              <span>
                {Math.ceil(s.creatures[id]!.hp)}/{maxCreatureHp(s.creatures[id]!)} HP{' '}
                <em className="summary-charge">· {m!.charge}% ult</em>
              </span>
            </span>
            <ChevronUp size={16} />
          </>
        ) : (
          <span>Choose a companion</span>
        )}
      </button>
      <div className="ability-tray" role="group" aria-label="Companion ability tray">
        <div className="ability-tray-heading">
          <b>{id ? CREATURES[id].name : 'Your squad'}</b>
          <button
            aria-label="Close companion abilities"
            onClick={() => useGame.setState({ abilityTrayOpen: false })}
          >
            <X size={20} />
          </button>
        </div>
        <div className="squad-hud-members">
          <button
            aria-label="Open squad management"
            onClick={() => useGame.getState().open('squad')}
          >
            Squad {q.equipped.length}/3
          </button>
          {q.equipped.map((c) => (
            <button
              key={c}
              aria-label={`Command ${CREATURES[c].name}`}
              aria-pressed={id === c}
              disabled={busy || !s.creatures[c]!.hp || q.switchCooldown > 0}
              onClick={() => useGame.getState().switchCompanion(c)}
            >
              {CREATURES[c].name}
              <small>
                {Math.ceil(s.creatures[c]!.hp)} HP · {ROLES[c]}
              </small>
            </button>
          ))}
        </div>
        {id && m && (
          <div className="squad-hud-abilities">
            {(['Q', 'E', 'R'] as const).map((slot) => {
              const a = ABILITIES[id][slot],
                cd = m.cooldowns[slot],
                locked = level < a.level;
              return (
                <button
                  key={slot}
                  aria-label={`Cast ${a.name}`}
                  disabled={
                    busy ||
                    !s.creatures[id]!.hp ||
                    locked ||
                    cd > 0 ||
                    (slot === 'R' && m.charge < 100)
                  }
                  onClick={() => useGame.getState().castAbility(slot)}
                  data-state={
                    locked
                      ? 'locked'
                      : cd > 0
                        ? 'cooldown'
                        : slot === 'R' && m.charge < 100
                          ? 'charge'
                          : 'ready'
                  }
                  data-element={id}
                  style={{ '--cooldown': `${(cd / a.cooldown) * 100}%` } as React.CSSProperties}
                  title={`${a.name}: ${a.status}. ${a.power} power, ${a.range} units`}
                >
                  <span className="ability-icon">
                    {locked ? (
                      <Lock size={20} />
                    ) : id === 'emberfox' ? (
                      <Flame size={20} />
                    ) : id === 'aquabub' ? (
                      <Droplets size={20} />
                    ) : id === 'mosshell' ? (
                      <Mountain size={20} />
                    ) : (
                      <Zap size={20} />
                    )}
                  </span>
                  <kbd>{bindingLabel(bindings[slot])}</kbd>
                  <b>{a.name}</b>
                  <small>
                    {locked
                      ? `Level ${a.level}`
                      : cd > 0
                        ? `${cd.toFixed(1)}s`
                        : slot === 'R'
                          ? `${m.charge}/100 charge`
                          : 'Ready'}
                  </small>
                </button>
              );
            })}
            <span className="ultimate-meter" aria-label="Ultimate charge">
              {m.charge}/100
              <progress aria-label="Ultimate charge" max={100} value={m.charge} />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
