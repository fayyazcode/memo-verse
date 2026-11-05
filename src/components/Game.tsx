'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Coins,
  Compass,
  Flag,
  Hammer,
  Heart,
  Home,
  Leaf,
  Map,
  MapPin,
  Maximize,
  Moon,
  Music2,
  PawPrint,
  Play,
  Plus,
  Save,
  Settings,
  Shield,
  Sparkles,
  Sprout,
  Sun,
  Swords,
  Volume2,
  X,
} from 'lucide-react';
import {
  CREATURES,
  ITEMS,
  NPCS,
  OBJECTS,
  PLOT,
  QUESTS,
  RECIPES,
  type ItemId,
  type Species,
} from '@/game/data';
import { available, deliver, ready, useGame, type Panel } from '@/game/store';
import { count, levelFromXp, maxCreatureHp, validShelter } from '@/game/rules';
import { keys, motion, navigation } from '@/game/input';
import { riverDepth } from '@/game/river';
import { craftBatch, maxCraftBatches, type Recipe } from '@/game/crafting';
import type { Save as GameSave } from '@/game/store';
import { ambience } from '@/game/audio';
import TouchControls from './TouchControls';
import CreaturePortrait from './CreaturePortrait';
import { missionGuidance } from '@/game/guidance';
const CreaturePreview = dynamic(() => import('./CreaturePreview'), { ssr: false });
const World = dynamic(() => import('./World'), {
  ssr: false,
  loading: () => (
    <div className="world-loading">
      <Sprout size={32} />
      <span>Growing your little world…</span>
    </div>
  ),
});
const panelNames: Record<NonNullable<Panel>, string> = {
  inventory: 'Your backpack',
  journal: 'Adventure journal',
  creatures: 'Forest friends',
  craft: 'The workshop',
  shop: 'Foxy’s little shop',
  map: 'A world to discover',
  settings: 'Make yourself comfortable',
  pause: 'Take a little breather',
  commands: 'A helping paw',
};
function IconButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      className={`icon-button ${active ? 'active' : ''}`}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function MiniMap({ large = false }: { large?: boolean }) {
  const position = useGame((s) => s.save.position),
    discoveries = useGame((s) => s.save.discoveries),
    save = useGame((s) => s.save);
  const hints = missionGuidance(save);
  const [selected, setSelected] = useState<string | null>(null);
  const grouped = hints.reduce<(typeof hints)[]>((groups, hint) => {
    const group = groups.find(
      (g) => g[0].position[0] === hint.position[0] && g[0].position[2] === hint.position[2]
    );
    if (group) group.push(hint);
    else groups.push([hint]);
    return groups;
  }, []);
  const selectedHint = hints.find((h) => h.id === selected);
  const plot = (x: number, z: number) => ({
    left: `${((x + 34) / 144) * 100}%`,
    top: `${((z + 37) / 102) * 100}%`,
  });
  return (
    <div
      className={`map-art ${large ? 'large' : ''}`}
      aria-label="Map showing player, village and forest"
    >
      <div className="map-forest" />
      <div className="map-river" />
      <div className="map-path" />
      <span className="map-label village">MOMO VILLAGE</span>
      <span className="map-label forest">GREENWOOD</span>
      {NPCS.map((n) => (
        <span key={n.id} className="map-house" style={plot(n.pos[0], n.pos[2])} title={n.name}>
          ◆
        </span>
      ))}
      <span className="map-home" style={plot(2, 27)}>
        <Home size={large ? 18 : 10} />
      </span>
      {large &&
        OBJECTS.filter((o) => o.kind === 'landmark').map((o) => (
          <span
            key={o.id}
            className="map-discovery"
            style={plot(o.pos[0], o.pos[2])}
            title={o.name}
          >
            {discoveries.includes(o.id) ? '✧' : '?'}
          </span>
        ))}
      {grouped.map((group, i) => {
        const hint = group[0];
        return large ? (
          <button
            key={hint.id}
            className="mission-marker"
            style={plot(hint.position[0], hint.position[2])}
            aria-label={`Mission destination: ${group.map((h) => h.label).join(', ')}`}
            title={group.map((h) => `${h.mission}: ${h.label}`).join(' · ')}
            onClick={() => setSelected(hint.id)}
          >
            {i + 1}
          </button>
        ) : (
          <span
            key={hint.id}
            className="mission-marker"
            style={plot(hint.position[0], hint.position[2])}
            title={group.map((h) => h.label).join(' · ')}
          >
            {i + 1}
          </span>
        );
      })}
      {large && selectedHint && (
        <div className="map-mission-info" role="status">
          <b>
            {selectedHint.mission} · {selectedHint.label}
          </b>
          <p>{selectedHint.help}</p>
          <button onClick={() => setSelected(null)} aria-label="Close destination hint">
            ×
          </button>
        </div>
      )}
      <span className="map-player" style={plot(position[0], position[2])}>
        <i />
      </span>
      <span className="north">N</span>
      {large && <span className="map-scale">Village ↔ Forest · 1 block = 1 unit</span>}
    </div>
  );
}
function MainMenu() {
  const loading = useGame((s) => s.loading || !s.worldReady),
    hasSave = useGame((s) => s.hasSave),
    start = useGame((s) => s.start);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="welcome">
      <div className="welcome-top">
        <div className="brand">
          <span className="brand-mark">
            <Sprout size={22} />
          </span>
          MomoVerse<span className="alpha">EARLY ADVENTURE</span>
        </div>
        <button className="text-button" onClick={() => useGame.getState().open('settings')}>
          <Settings size={15} /> Settings
        </button>
      </div>
      <div className="welcome-copy">
        <span className="eyebrow">
          <span /> A LITTLE WORLD. A GRAND ADVENTURE.
        </span>
        <h1>
          Somewhere
          <br />
          you <em>belong.</em>
        </h1>
        <p>
          Beyond the village, a little wonder awaits.
          <br />
          Make unusual friends. Follow your curiosity.
          <br />
          Build a place to call your own.
        </p>
        <div className="welcome-actions">
          <button className="primary large" disabled={loading} onClick={() => void start(hasSave)}>
            {loading
              ? 'Preparing your world…'
              : hasSave
                ? 'Continue your adventure'
                : 'Begin your adventure'}
            <ArrowRight size={18} />
          </button>
          {hasSave && (
            <button className="text-button" onClick={() => setConfirm(!confirm)}>
              Start a new adventure
            </button>
          )}
        </div>
        {confirm && (
          <div className="confirm">
            <p>Replace your local adventure? Your current progress will be lost.</p>
            <button className="primary" onClick={() => void start(false)}>
              Start fresh
            </button>
            <button className="secondary" onClick={() => setConfirm(false)}>
              Keep my adventure
            </button>
          </div>
        )}
        <div className="welcome-features">
          <span>
            <Compass size={15} />
            Explore freely
          </span>
          <span>
            <PawPrint size={15} />
            Find your friends
          </span>
          <span>
            <Hammer size={15} />
            Make it yours
          </span>
        </div>
      </div>
      <div className="world-caption">
        <span className="small-dot" />
        <span>MOMO VILLAGE</span>
        <span className="caption-line" />
        YOUR STORY STARTS HERE
        <ArrowUpRight size={15} />
      </div>
      <div className="welcome-bottom">
        <span>Crafted for the curious.</span>
        <span>
          <Save size={13} /> Guest progress saved on this browser
        </span>
        <span>
          KEYBOARD + MOUSE <span className="tiny-leaf">✧</span>
        </span>
      </div>
    </div>
  );
}
function Hud() {
  const [tasksCollapsed, setTasksCollapsed] = useState(false),
    [mapCollapsed, setMapCollapsed] = useState(false);
  useEffect(() => {
    try {
      const small = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
      const saved = JSON.parse(localStorage.getItem('momo-hud') || 'null');
      setTasksCollapsed(saved?.tasks ?? small);
      setMapCollapsed(saved?.map ?? small);
    } catch {}
  }, []);
  const collapse = (which: 'tasks' | 'map', value: boolean) => {
    if (which === 'tasks') setTasksCollapsed(value);
    else setMapCollapsed(value);
    try {
      localStorage.setItem(
        'momo-hud',
        JSON.stringify({
          tasks: which === 'tasks' ? value : tasksCollapsed,
          map: which === 'map' ? value : mapCollapsed,
        })
      );
    } catch {}
  };
  const s = useGame((s) => s.save),
    panel = useGame((s) => s.panel),
    build = useGame((s) => s.build),
    selected = useGame((s) => s.selected),
    target = useGame((s) => s.target),
    open = useGame((s) => s.open),
    saveStatus = useGame((s) => s.saveStatus);
  const level = levelFromXp(s.xp);
  const activeQuest = QUESTS.find((q) => s.quests[q.id]?.status === 'active');
  const targetName =
    (target === 'plant' && s.flags.includes('ability:plant') ? 'Moonflower · watered' : null) ??
    NPCS.find((n) => n.id === target)?.name ??
    OBJECTS.find((o) => o.id === target)?.name ??
    (target?.startsWith('lamp:') ? 'Crystal lamp' : null) ??
    (target?.startsWith('creature:') ? CREATURES[target.slice(9) as Species].name : null);
  const forest = s.position[0] > 22;
  const wading = riverDepth({ x: s.position[0], y: s.position[1], z: s.position[2] }) > 0.12;
  return (
    <div className="hud">
      <header className="game-top">
        <button className="brand small" onClick={() => open('pause')}>
          <span className="brand-mark">
            <Sprout size={19} />
          </span>
          MomoVerse
        </button>
        <div className="location-pill">
          <MapPin size={13} />
          {forest ? 'Greenwood Forest' : 'Momo Village'}
          <span>·</span>
          <Sun size={14} /> Day {Math.floor(s.playTime / 720) + 1}
        </div>
        <div className="top-actions">
          <span className="save-indicator">
            <span />
            {saveStatus}
          </span>
          <IconButton label="Settings" onClick={() => open('settings')}>
            <Settings size={17} />
          </IconButton>
          <IconButton label="Pause game" onClick={() => open('pause')}>
            <span className="pause-symbol">Ⅱ</span>
          </IconButton>
        </div>
      </header>
      <aside className="left-hud">
        <div className="player-card">
          <div className="portrait">
            🌱<span>{level.level}</span>
          </div>
          <div className="player-detail">
            <div>
              <b>Little Wanderer</b>
              <span>LV. {level.level}</span>
            </div>
            <div className="health-bar">
              <i style={{ width: `${(s.hp / (100 + (level.level - 1) * 5)) * 100}%` }} />
            </div>
            <div className="player-stats">
              <span>
                <Heart size={10} />
                {s.hp} / {100 + (level.level - 1) * 5}
              </span>
              <span>{level.level === 10 ? 'MAX LEVEL' : `${level.xp} / ${level.next} XP`}</span>
            </div>
            <div className="xp-bar">
              <i style={{ width: `${level.next ? (level.xp / level.next) * 100 : 100}%` }} />
            </div>
          </div>
        </div>
        <div className="hud-collapse-row">
          <button
            className="hud-collapse-button"
            aria-label={tasksCollapsed ? 'Expand tasks' : 'Minimize tasks'}
            aria-expanded={!tasksCollapsed}
            onClick={() => collapse('tasks', !tasksCollapsed)}
          >
            <Flag size={14} />
            {tasksCollapsed ? 'Tasks' : 'Minimize tasks'}
            <span>{tasksCollapsed ? '+' : '−'}</span>
          </button>
        </div>
        <div
          hidden={tasksCollapsed}
          className="quest-card"
          tabIndex={0}
          aria-label="Active adventure helping hand"
          aria-describedby="adventure-help"
        >
          <div className="section-kicker">
            <Flag size={13} /> YOUR NEXT LITTLE ADVENTURE
            <button onClick={() => open('journal')} title="Open journal">
              <ArrowUpRight size={15} />
            </button>
          </div>
          {activeQuest ? (
            <>
              <h3>{activeQuest.name}</h3>
              <p>{activeQuest.description}</p>
              <div className="objective-list">
                {activeQuest.objectives.map((o) => {
                  const n = s.quests[activeQuest.id].progress[o.id] ?? 0;
                  return (
                    <div key={o.id} className={n >= o.count ? 'done' : ''}>
                      <span className="objective-dot">
                        {n >= o.count ? <Check size={9} /> : null}
                      </span>
                      <span>{o.label}</span>
                      {o.count > 1 && (
                        <small>
                          {n}/{o.count}
                        </small>
                      )}
                    </div>
                  );
                })}
              </div>
              {ready(s, activeQuest.id) && (
                <div className="return-note">
                  Return to {NPCS.find((n) => n.id === activeQuest.giver)?.name} for your reward.
                </div>
              )}
            </>
          ) : (
            <>
              <h3>
                {s.flags.includes('adventureComplete')
                  ? 'The world is still yours'
                  : 'A new beginning'}
              </h3>
              <p>
                {s.flags.includes('adventureComplete')
                  ? 'Keep exploring, building, and helping your friends.'
                  : 'Find Grandpa Moss in the village square. He has a story to share.'}
              </p>
              <button className="inline-link" onClick={() => open('journal')}>
                Open your journal <ChevronRight size={13} />
              </button>
            </>
          )}
          {activeQuest && (
            <div id="adventure-help" className="adventure-help" role="tooltip">
              <span className="eyebrow">A HELPING HAND</span>
              <h3>{activeQuest.name}</h3>
              <ol>
                {missionGuidance(s, activeQuest.id).map((h) => (
                  <li key={h.id}>
                    <strong>{h.label}</strong>
                    <p>{h.help}</p>
                  </li>
                ))}
              </ol>
              <button className="secondary" onClick={() => open('map')}>
                Show destinations on map <MapPin size={13} />
              </button>
            </div>
          )}
          <div className="quest-footer">
            <BookOpen size={12} /> JOURNAL <kbd>J</kbd>
          </div>
        </div>
        {s.active && (
          <button className="companion-card" onClick={() => open('commands')}>
            <span className="companion-icon" style={{ background: CREATURES[s.active].color }}>
              <PawPrint size={21} />
            </span>
            <span>
              <b>{CREATURES[s.active].name}</b>
              <small>
                {s.creatures[s.active]!.hp > 0 ? 'A friend by your side' : 'Needs village healing'}
              </small>
            </span>
            <kbd>V</kbd>
          </button>
        )}
      </aside>
      <aside className="right-hud">
        <button
          className="hud-collapse-button"
          aria-label={mapCollapsed ? 'Expand minimap' : 'Minimize minimap'}
          aria-expanded={!mapCollapsed}
          onClick={() => collapse('map', !mapCollapsed)}
        >
          <Map size={14} />
          {mapCollapsed ? 'Map' : 'Minimize map'}
          <span>{mapCollapsed ? '+' : '−'}</span>
        </button>
        <button
          className="minimap"
          hidden={mapCollapsed}
          onClick={() => open('map')}
          aria-label="Open world map"
        >
          <MiniMap />
          <span className="minimap-bottom">
            <Compass size={12} /> {forest ? 'Greenwood' : 'Momo Village'}
            <kbd>M</kbd>
          </span>
        </button>
        <div className="coin-pill">
          <span className="coin-icon">
            <Coins size={17} />
          </span>
          <b>{s.coins.toLocaleString()}</b>
          <span>COINS</span>
        </div>
      </aside>
      {s.flags.includes('repaired') &&
        !s.flags.includes('guardianDefeated') &&
        Math.hypot(s.position[0] - 92, s.position[2] - 20) < 10 && (
          <div className="combat-banner">
            <Swords size={17} />
            <div>
              <b>Bramble Guardian</b>
              <span>
                Left click: basic attack · Q: elemental ability · Orange ring: incoming attack
              </span>
            </div>
            <span>{s.enemyHp} HP</span>
            <small>
              Ability {s.abilityCooldown > 0 ? s.abilityCooldown.toFixed(1) + 's' : 'ready'}
            </small>
          </div>
        )}
      {build && (
        <div className="build-banner">
          <Hammer size={16} />
          <b>Make it yours</b>
          <span>Left click: place · Right click: remove · Hold middle mouse: camera</span>
          <kbd>B</kbd>
        </div>
      )}
      {targetName && !panel && (
        <div className="interaction">
          <kbd>{OBJECTS.find((o) => o.id === target)?.kind === 'resource' ? 'F' : 'E'}</kbd>
          <div>
            <small>
              {target?.startsWith('creature:')
                ? 'MAKE A FRIEND'
                : OBJECTS.find((o) => o.id === target)?.kind === 'resource'
                  ? 'GATHER'
                  : 'INTERACT'}
            </small>
            <strong>{targetName}</strong>
          </div>
        </div>
      )}
      <footer className="game-bottom">
        <div className="bottom-hint">
          <span className="key-row">
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
          </span>
          <span>Move · or click the ground</span>
          <span className="hint-divider" />
          Hold <kbd>RMB</kbd>
          <span>Look around</span>
        </div>
        <div className="hotbar-wrap">
          <div className="hotbar">
            {s.hotbar.map((item, i) => (
              <button
                key={i}
                className={`hotbar-slot ${selected === i ? 'selected' : ''}`}
                onClick={() => useGame.setState({ selected: i })}
                aria-label={`Hotbar ${i + 1}${item ? ' ' + ITEMS[item].name : ''}`}
              >
                <small>{i + 1}</small>
                {item && count(s.inventory, item) > 0 ? (
                  <>
                    <span>{ITEMS[item].icon}</span>
                    <b>{count(s.inventory, item)}</b>
                  </>
                ) : (
                  <span className="empty-slot">{item ? ITEMS[item].icon : '·'}</span>
                )}
              </button>
            ))}
          </div>
          <span className="hotbar-caption">
            {s.hotbar[selected] && count(s.inventory, s.hotbar[selected]!) > 0
              ? `Holding: ${ITEMS[s.hotbar[selected]!].name}`
              : 'Empty hand · select an item to equip'}
          </span>
        </div>
        <nav className="menu-dock">
          {(
            [
              { panel: 'inventory', icon: Backpack, key: 'I', label: 'Backpack' },
              { panel: 'journal', icon: BookOpen, key: 'J', label: 'Journal' },
              { panel: 'creatures', icon: PawPrint, key: 'C', label: 'Creatures' },
              { panel: 'map', icon: Map, key: 'M', label: 'Map' },
            ] as const
          ).map((a) => (
            <button key={a.key} onClick={() => open(a.panel)} title={`${a.label} (${a.key})`}>
              <a.icon size={19} />
              <kbd>{a.key}</kbd>
            </button>
          ))}
        </nav>
      </footer>
      {wading && (
        <div className="water-hint">Wading · movement is slower · jump to climb the bank</div>
      )}
      <div className="region-caption">
        <span /> {forest ? 'THE FOREST HAS A FEW SECRETS.' : 'TAKE YOUR TIME. YOU’RE HOME.'}
      </div>
    </div>
  );
}
function Dialog() {
  const id = useGame((s) => s.dialogue),
    s = useGame((s) => s.save);
  const [topic, setTopic] = useState(false);
  useEffect(() => setTopic(false), [id]);
  if (!id) return null;
  const npc = NPCS.find((n) => n.id === id)!;
  const quests = QUESTS.filter(
    (q) => q.giver === id && (available(s, q.id) || s.quests[q.id]?.status === 'active')
  );
  const action = useGame.getState();
  return (
    <div className="dialogue-wrap">
      <div className="dialogue-card">
        <div className="dialogue-character" style={{ background: npc.color }}>
          <Sprout size={36} />
        </div>
        <div className="dialogue-content">
          <div className="section-kicker">
            {npc.role}
            <button
              aria-label="Close dialogue"
              onClick={() => useGame.setState({ dialogue: null })}
            >
              <X size={18} />
            </button>
          </div>
          <h2>{npc.name}</h2>
          <p>
            {topic
              ? `There’s always something to discover. ${id === 'luna' ? 'Craft treats at Bruno’s bench. Emberfox likes warm treats, Aquabub likes river fruit, Mosshell likes mineral snacks, and Zaplet loves charged treats.' : id === 'bruno' ? 'Start with a pickaxe. For your shelter, make three two-block-high walls around an empty cell, add a roof, and leave a doorway. Twelve blocks alone won’t make a home.' : id === 'bloop' ? 'Find the Ancient Oak, River Bend, and Crystal Clearing. Your companions can help with plants, rocks, and power devices.' : id === 'foxy' ? 'I buy common resources. All prices are per item. Keep supplies you need for quests!' : 'Speak with villagers, accept missions, and explore. Your journal will keep track of everything.'}`
              : s.flags.includes('adventureComplete') && id === 'moss'
                ? 'You brought the forest together, little wanderer. The passage is open, and this village is your home. Thank you.'
                : npc.greeting}
          </p>
          <div className="dialogue-options">
            {quests.map((q) => (
              <button
                key={q.id}
                className="dialogue-option"
                onClick={() => (s.quests[q.id] ? action.claim(q.id) : action.accept(q.id))}
                disabled={!!s.quests[q.id] && !ready(s, q.id)}
              >
                <Flag size={15} />
                <span>
                  {q.name}
                  <small>
                    {s.quests[q.id]
                      ? ready(s, q.id)
                        ? 'Collect reward'
                        : 'In progress — check your journal'
                      : 'Accept mission'}
                  </small>
                </span>
                <span className="reward-preview">
                  {q.coins} <Coins size={12} />
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
            <div className="dialogue-buttons">
              <button className="secondary" onClick={() => setTopic(!topic)}>
                <CircleHelp size={14} />
                {topic ? 'Tell me about yourself' : 'Any advice?'}
              </button>
              <button className="secondary" onClick={() => deliver(id)}>
                Make a delivery
              </button>
              {id === 'foxy' && (
                <button className="primary" onClick={() => action.open('shop')}>
                  Browse shop
                  <ArrowRight size={14} />
                </button>
              )}
              {id === 'bruno' && (
                <button className="primary" onClick={() => action.open('craft')}>
                  Visit the workshop
                  <ArrowRight size={14} />
                </button>
              )}
              <button className="text-button" onClick={() => useGame.setState({ dialogue: null })}>
                See you around <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Inventory() {
  const inventory = useGame((s) => s.save.inventory),
    save = useGame((s) => s.save),
    selected = useGame((s) => s.selected);
  return (
    <>
      <p className="panel-intro">
        All the little things you’ve found along the way. Select an item to assign it to hotbar slot{' '}
        {selected + 1}.
      </p>
      <div className="inventory-grid">
        {Array.from({ length: 24 }, (_, i) => {
          const stack = inventory[i];
          return (
            <button
              key={i}
              className={`inventory-slot ${stack ? 'filled' : ''}`}
              title={stack ? ITEMS[stack.item].name : 'Empty slot'}
              disabled={!stack}
              onClick={() => {
                const state = useGame.getState(),
                  hotbar = [...state.save.hotbar];
                hotbar[selected] = stack.item;
                useGame.setState({ save: { ...state.save, hotbar } });
                void state.persist();
              }}
            >
              {stack && (
                <>
                  <span className="item-emoji">{ITEMS[stack.item].icon}</span>
                  <small>{ITEMS[stack.item].name}</small>
                  <b>{stack.qty}</b>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="panel-footnote">
        <Backpack size={14} />
        {inventory.length} / 24 slots used<span>Quest parcels travel in a separate pouch.</span>
      </div>
      <div className="quest-pouch">
        <h3>Quest pouch & keepsakes</h3>
        {save.quests.q05?.status === 'active' && !save.quests.q05.progress.parcel && (
          <span>📦 Foxy’s delivery parcel</span>
        )}
        {save.flags.includes('whistle') && <span>♬ Companion whistle</span>}
        {save.flags.includes('badge:guardian') && <span>✧ Forest Guardian badge</span>}
        {save.flags.includes('badge:explorer') && <span>✧ Explorer badge</span>}
        {!save.flags.includes('whistle') && !save.quests.q05 && (
          <small>Your story’s keepsakes will appear here.</small>
        )}
      </div>
    </>
  );
}
function Journal() {
  const s = useGame((s) => s.save);
  return (
    <>
      <p className="panel-intro">
        Small steps make a grand adventure.{' '}
        {QUESTS.filter((q) => s.quests[q.id]?.status === 'complete').length} of 10 missions
        complete.
      </p>
      <div className="journal-list">
        {QUESTS.map((q, i) => {
          const state = s.quests[q.id],
            unlocked = available(s, q.id);
          return (
            <article
              key={q.id}
              className={`journal-quest ${state?.status === 'complete' ? 'completed' : ''}`}
            >
              <div className="quest-number">
                {state?.status === 'complete' ? (
                  <Check size={18} />
                ) : (
                  String(i + 1).padStart(2, '0')
                )}
              </div>
              <div>
                <span className="eyebrow">
                  {q.category} ·{' '}
                  {state?.status === 'complete'
                    ? 'COMPLETE'
                    : state
                      ? 'ACTIVE'
                      : unlocked
                        ? 'AVAILABLE'
                        : 'LOCKED'}
                </span>
                <h3>{q.name}</h3>
                <p>{q.description}</p>
                {state?.status === 'active' && (
                  <ul>
                    {q.objectives.map((o) => (
                      <li
                        key={o.id}
                        className={(state.progress[o.id] ?? 0) >= o.count ? 'done' : ''}
                      >
                        {(state.progress[o.id] ?? 0) >= o.count ? '✓' : '○'} {o.label}{' '}
                        {o.count > 1 ? `(${state.progress[o.id] ?? 0}/${o.count})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {!state && (
                  <small>
                    {unlocked
                      ? `Talk to ${NPCS.find((n) => n.id === q.giver)?.name} to begin.`
                      : `Requires: ${q.prereqs.map((p) => QUESTS.find((q) => q.id === p)?.name).join(', ')}`}
                  </small>
                )}
                <div className="reward-line">
                  <Coins size={12} />
                  {q.coins} coins <Sparkles size={12} />
                  {q.xp} XP
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
function Creatures() {
  const [details, setDetails] = useState<Species | null>(null);
  const s = useGame((s) => s.save),
    action = useGame.getState();
  return (
    <>
      <p className="panel-intro">
        A good adventure is better with company. One friend can travel by your side.
      </p>
      <div className="creature-grid">
        {(Object.entries(CREATURES) as [Species, (typeof CREATURES)[Species]][]).map(([id, c]) => {
          const owned = s.creatures[id],
            level = owned ? levelFromXp(owned.xp) : null;
          return (
            <article className={`creature-card ${owned ? '' : 'undiscovered'}`} key={id}>
              <div className="creature-art" style={{ background: c.color + '44' }}>
                <CreaturePortrait species={id} />
                <span className="element-badge">{c.type}</span>
                {s.active === id && <span className="active-tag">BY YOUR SIDE</span>}
              </div>
              <h3>{c.name}</h3>
              <button
                className="creature-detail-button"
                aria-expanded={details === id}
                onClick={() => setDetails(details === id ? null : id)}
              >
                {' '}
                {details === id ? 'Close details' : 'View creature card'} <ArrowUpRight size={13} />
              </button>
              <p>{c.description}</p>
              <div className="creature-ability">
                <Sparkles size={13} />
                {c.ability}
              </div>
              {details === id && (
                <section
                  className="collectible-card"
                  aria-label={`${c.name} creature details`}
                  style={{ '--creature-color': c.color } as React.CSSProperties}
                >
                  <header>
                    <span>FOREST COMPANIONS · #{Object.keys(CREATURES).indexOf(id) + 1}</span>
                    <strong>
                      {owned ? `${owned.hp} / ${maxCreatureHp(owned)} HP` : 'NOT BEFRIENDED'}
                    </strong>
                  </header>
                  <div className="collectible-title">
                    <h4>{c.name}</h4>
                    <span>{c.type}</span>
                  </div>
                  <div
                    className="pet-preview"
                    role="img"
                    aria-label={`Rotating 3D model of ${c.name}`}
                  >
                    <CreaturePreview species={id} />
                  </div>
                  <p className="creature-flavour">{c.description}</p>
                  <dl>
                    <div>
                      <dt>Level</dt>
                      <dd>{level?.level ?? 'Wild · 1'}</dd>
                    </div>
                    <div>
                      <dt>Friendship</dt>
                      <dd>{owned ? `${owned.friendship} / 100` : 'Not yet bonded'}</dd>
                    </div>
                    <div>
                      <dt>Next level</dt>
                      <dd>
                        {level
                          ? level.next
                            ? `${level.xp} / ${level.next} XP`
                            : 'MAX'
                          : 'Befriend to train'}
                      </dd>
                    </div>
                  </dl>
                  <div className="card-move">
                    <b>Basic attack</b>
                    <span>10 damage · 1.5s cooldown</span>
                  </div>
                  <div className="card-move">
                    <b>{c.type} burst</b>
                    <span>18 base damage · 6s cooldown</span>
                  </div>
                  <div className="card-utility">
                    <b>Exploration ability</b>
                    <span>{c.ability}</span>
                  </div>
                  <p>
                    <b>Befriending:</b> {ITEMS[c.food].name}. Habitat:{' '}
                    {id === 'emberfox'
                      ? 'Warm forest clearing'
                      : id === 'aquabub'
                        ? 'Riverbank'
                        : id === 'mosshell'
                          ? 'Rocky forest area'
                          : 'Crystal grove'}
                    .
                  </p>
                  <footer>
                    Strong against{' '}
                    {
                      (
                        {
                          Fire: 'Earth',
                          Water: 'Fire',
                          Earth: 'Electric',
                          Electric: 'Water',
                        } as const
                      )[c.type]
                    }{' '}
                    ×1.25 · Original MomoVerse species
                  </footer>
                </section>
              )}
              {owned ? (
                <>
                  <div className="creature-stats">
                    <span>Level {level!.level}</span>
                    <span>
                      <Heart size={12} />
                      {owned.hp}/{maxCreatureHp(owned)}
                    </span>
                    <span>Friendship {owned.friendship}</span>
                  </div>
                  <div className="card-actions">
                    <button
                      className="primary"
                      disabled={owned.hp === 0}
                      onClick={() => action.summon(id)}
                    >
                      {s.active === id ? 'Following' : 'Summon'}
                    </button>
                    <button className="secondary" onClick={() => action.feed(id)}>
                      Feed +5 ♥
                    </button>
                  </div>
                  {owned.hp === 0 && <small>Recover at the village healing station.</small>}
                </>
              ) : (
                <div className="befriend-tip">
                  Bring {ITEMS[c.food].name} to its forest habitat.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
function RecipeRow({ recipe: r, save: s }: { recipe: Recipe; save: GameSave }) {
  const [requested, setRequested] = useState(1);
  const unlocked = s.quests[r.unlock]?.status === 'complete';
  const max = maxCraftBatches(s.inventory, r),
    batches = Math.min(requested, Math.max(1, max));
  const supported = !r.companion || !!s.creatures[r.companion]?.hp;
  const possible = !!craftBatch(s.inventory, r, batches);
  const select = (value: number) =>
    setRequested(Math.max(1, Math.min(Math.max(1, max), Math.trunc(value) || 1)));
  return (
    <article className={`recipe batch-recipe ${unlocked ? '' : 'locked'}`}>
      <div className="recipe-icon">{ITEMS[r.id].icon}</div>
      <div className="batch-recipe-info">
        <h3>
          {ITEMS[r.id].name} <small>×{r.output * batches}</small>
        </h3>
        <p>
          {Object.entries(r.ingredients)
            .map(
              ([id, n]) =>
                `${n! * batches} ${ITEMS[id as ItemId].name} (have ${count(s.inventory, id as ItemId)})`
            )
            .join(' + ')}
        </p>
        <small>
          {!unlocked
            ? `Unlock: ${QUESTS.find((q) => q.id === r.unlock)?.name}`
            : r.companion
              ? 'Requires healthy Emberfox assistance'
              : 'Crafted at Bruno’s workshop'}
        </small>
        <div className="batch-controls">
          <label htmlFor={`batch-${r.id}`}>
            Batches{' '}
            <small>
              ({r.output} item{r.output === 1 ? '' : 's'} each)
            </small>
          </label>
          <input
            id={`batch-${r.id}`}
            aria-label={`${ITEMS[r.id].name} batches`}
            type="range"
            min={1}
            max={Math.max(1, max)}
            step={1}
            value={batches}
            disabled={!unlocked || !max}
            onChange={(e) => select(Number(e.target.value))}
          />
          <input
            aria-label={`${ITEMS[r.id].name} batch count`}
            type="number"
            min={1}
            max={Math.max(1, max)}
            step={1}
            value={batches}
            disabled={!unlocked || !max}
            onChange={(e) => select(Number(e.target.value))}
          />
          <button
            className="secondary"
            disabled={!unlocked || !max}
            onClick={() => setRequested(max)}
          >
            Max
          </button>
        </div>
        {unlocked && !possible && (
          <small className="craft-capacity-note">
            Not enough materials or inventory space for this batch.
          </small>
        )}
      </div>
      <button
        className="primary"
        disabled={!unlocked || !possible || !supported}
        onClick={() => useGame.getState().craft(r.id, batches)}
      >
        Craft {r.output * batches}
        <Plus size={13} />
      </button>
    </article>
  );
}
function Crafting() {
  const s = useGame((s) => s.save);
  return (
    <>
      <p className="panel-intro">
        Choose how many batches to craft. Materials and output update together. Each batch makes the
        shown number of items; Max respects your materials and bag space.
      </p>
      <div className="recipe-list">
        {RECIPES.map((r) => (
          <RecipeRow key={r.id} recipe={r} save={s} />
        ))}
      </div>
    </>
  );
}
function Shop() {
  const s = useGame((s) => s.save);
  return (
    <>
      <p className="panel-intro">
        Fair prices, friendly faces. All prices are per item. You have <b>{s.coins} coins</b>.
      </p>
      <div className="recipe-list">
        {(Object.entries(ITEMS) as [ItemId, (typeof ITEMS)[ItemId]][])
          .filter(([, item]) => item.buy)
          .map(([id, item]) => (
            <article className="recipe" key={id}>
              <div className="recipe-icon">{item.icon}</div>
              <div>
                <h3>{item.name}</h3>
                <p>In your bag: {count(s.inventory, id)}</p>
              </div>
              <button
                className="secondary"
                disabled={!count(s.inventory, id)}
                onClick={() => useGame.getState().trade(id, false)}
              >
                Sell {item.sell}
                <Coins size={12} />
              </button>
              <button
                className="primary"
                disabled={s.coins < item.buy!}
                onClick={() => useGame.getState().trade(id, true)}
              >
                Buy {item.buy}
                <Coins size={12} />
              </button>
            </article>
          ))}
      </div>
    </>
  );
}
function SettingsPanel() {
  const s = useGame((s) => s.settings),
    configure = useGame((s) => s.configure);
  return (
    <>
      <p className="panel-intro">Find your own pace. Settings are saved on this browser.</p>
      <div className="settings-list">
        {(
          [
            { key: 'music', name: 'Ambient sound', icon: Music2, min: 0, max: 1, step: 0.05 },
            { key: 'effects', name: 'Sound effects', icon: Volume2, min: 0, max: 1, step: 0.05 },
            {
              key: 'sensitivity',
              name: 'Mouse sensitivity',
              icon: Compass,
              min: 0.2,
              max: 2,
              step: 0.1,
            },
            { key: 'distance', name: 'Camera distance', icon: Maximize, min: 4, max: 14, step: 1 },
          ] as const
        ).map((a) => (
          <label key={a.key}>
            <span>
              <a.icon size={18} />
              {a.name}
            </span>
            <input
              aria-label={a.name}
              type="range"
              min={a.min}
              max={a.max}
              step={a.step}
              value={s[a.key]}
              onChange={(e) => configure({ [a.key]: Number(e.target.value) })}
            />
            <small>{a.max === 1 ? Math.round(s[a.key] * 100) + '%' : s[a.key]}</small>
          </label>
        ))}
        <label>
          <span>
            <Sun size={18} />
            Graphics quality
          </span>
          <select
            value={s.quality}
            onChange={(e) => configure({ quality: e.target.value as typeof s.quality })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          <span>
            <Moon size={18} />
            Reduced camera motion
          </span>
          <input
            type="checkbox"
            checked={s.reducedMotion}
            onChange={(e) => configure({ reducedMotion: e.target.checked })}
          />
        </label>
      </div>
      <div className="control-guide">
        <h3>A few helpful keys</h3>
        <p>WASD move · Shift sprint · Space jump · Hold right mouse to look</p>
        <p>
          Click to move, collect or interact · E interact · F gather · I backpack · J journal · C
          creatures · M map
        </p>
        <p>B building · V companion commands · Q elemental attack · 1–6 hotbar · Esc pause</p>
        <p>Building: left click place · right click remove · hold middle mouse to look</p>
      </div>
    </>
  );
}
function Commands() {
  const s = useGame((s) => s.save),
    command = useGame((s) => s.command);
  return (
    <>
      <p className="panel-intro">Your friend is always happy to lend a paw.</p>
      {s.quests.q03?.status !== 'complete' ? (
        <p className="panel-intro">
          Complete A New Friend with Luna to receive your companion whistle and unlock commands.
          Your first friend already follows you.
        </p>
      ) : s.active ? (
        <>
          <div className="command-title">
            <PawPrint size={32} />
            <h3>{CREATURES[s.active].name}</h3>
          </div>
          <div className="command-grid">
            <button
              className="secondary"
              onClick={() => {
                useGame.setState({ command: 'follow', panel: null });
              }}
            >
              Follow me{command === 'follow' && <Check size={15} />}
            </button>
            <button
              className="secondary"
              onClick={() => {
                useGame.setState({ command: 'stay', panel: null });
              }}
            >
              Stay here{command === 'stay' && <Check size={15} />}
            </button>
            <button
              className="secondary"
              onClick={() => {
                useGame.setState({ panel: null });
                useGame.getState().interact();
              }}
            >
              Use ability on nearby object
            </button>
            <button
              className="secondary"
              onClick={() => {
                const state = useGame.getState();
                useGame.setState({ save: { ...state.save, active: null }, panel: null });
                void state.persist();
              }}
            >
              Recall companion
            </button>
            <button
              className="primary"
              onClick={() => {
                useGame.setState({ panel: null });
                useGame.getState().attack(false);
              }}
            >
              Basic attack
              <Swords size={15} />
            </button>
            <button
              className="primary"
              onClick={() => {
                useGame.setState({ panel: null });
                useGame.getState().attack(true);
              }}
            >
              Elemental attack
              <Sparkles size={15} />
            </button>
          </div>
        </>
      ) : (
        <button className="primary" onClick={() => useGame.getState().open('creatures')}>
          Choose a companion
          <PawPrint size={15} />
        </button>
      )}
    </>
  );
}
function PanelView() {
  const panel = useGame((s) => s.panel),
    s = useGame((s) => s.save);
  if (!panel) return null;
  return (
    <div className="modal-backdrop" onClick={() => useGame.getState().open(null)}>
      <section
        className={`panel panel-${panel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel-header">
          <div>
            <span className="eyebrow">MOMOVERSE · YOUR ADVENTURE</span>
            <h2 id="panel-title">{panelNames[panel]}</h2>
          </div>
          <IconButton label="Close menu" onClick={() => useGame.getState().open(null)}>
            <X size={20} />
          </IconButton>
        </header>
        <div className="panel-body">
          {panel === 'inventory' ? (
            <Inventory />
          ) : panel === 'journal' ? (
            <Journal />
          ) : panel === 'creatures' ? (
            <Creatures />
          ) : panel === 'craft' ? (
            <Crafting />
          ) : panel === 'shop' ? (
            <Shop />
          ) : panel === 'settings' ? (
            <SettingsPanel />
          ) : panel === 'commands' ? (
            <Commands />
          ) : panel === 'map' ? (
            <>
              <p className="panel-intro">
                A familiar village. An unfamiliar forest. A thousand little possibilities.
              </p>
              <MiniMap large />
              <div className="map-legend">
                <span>
                  <Flag size={13} /> Gold markers: active missions
                </span>
                <span>
                  <i className="legend-player" />
                  You are here
                </span>
                <span>◆ Villagers</span>
                <span>✧ Discoveries</span>
                <span>
                  <Home size={13} />
                  Your homestead
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="panel-intro">Your adventure will be right here.</p>
              <div className="pause-menu">
                <button className="primary large" onClick={() => useGame.getState().open(null)}>
                  Back to the adventure
                  <Play size={17} />
                </button>
                <button className="secondary" onClick={() => void useGame.getState().persist()}>
                  Save progress
                  <Save size={16} />
                </button>
                <button className="secondary" onClick={() => useGame.getState().open('settings')}>
                  Settings
                  <Settings size={16} />
                </button>
                <button className="secondary" onClick={() => void useGame.getState().persist(true)}>
                  Save and quit
                  <Home size={16} />
                </button>
              </div>
              <div className="local-save-note">
                <Shield size={16} />
                <div>
                  <b>Guest adventure · saved on this browser</b>
                  <p>
                    Account and cloud saves are not configured. Keep this browser’s data to keep
                    your adventure.
                  </p>
                </div>
              </div>
              <div className="pause-stats">
                <span>{Math.floor(s.playTime / 60)} minutes explored</span>
                <span>{Object.keys(s.creatures).length}/4 friends</span>
                <span>
                  {QUESTS.filter((q) => s.quests[q.id]?.status === 'complete').length}/10 missions
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
export default function Game() {
  const started = useGame((s) => s.started),
    notice = useGame((s) => s.notice),
    noticeId = useGame((s) => s.noticeId),
    settings = useGame((s) => s.settings);
  const [visibleNotice, setVisibleNotice] = useState(false),
    [webgl, setWebgl] = useState(true);
  useEffect(() => {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2')) setWebgl(false);
    void useGame.getState().init();
  }, []);
  useEffect(() => {
    if (!notice) return;
    setVisibleNotice(true);
    const t = setTimeout(() => setVisibleNotice(false), 5000);
    return () => clearTimeout(t);
  }, [noticeId, notice]);
  useEffect(() => {
    if (started) ambience(settings.music);
    else ambience(0);
  }, [started, settings.music]);
  useEffect(() => {
    const loop = setInterval(() => useGame.getState().tick(0.1), 100),
      save = setInterval(() => {
        if (useGame.getState().started) void useGame.getState().persist();
      }, 15000);
    return () => {
      clearInterval(loop);
      clearInterval(save);
    };
  }, []);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches('input,select,textarea')) return;
      const state = useGame.getState();
      if (!state.started) return;
      if (['Space', 'Tab', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown'].includes(e.code))
        e.preventDefault();
      if (e.repeat) return;
      keys.add(e.code);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF', 'KeyB', 'Escape'].includes(e.code))
        navigation.destination = null;
      if (e.code === 'Escape') {
        if (state.dialogue) useGame.setState({ dialogue: null });
        else state.open(state.panel ? null : 'pause');
        keys.clear();
        return;
      }
      const panels: Record<string, Panel> = {
        KeyI: 'inventory',
        KeyJ: 'journal',
        KeyC: 'creatures',
        KeyM: 'map',
        KeyV: 'commands',
      };
      if (panels[e.code]) {
        state.open(state.panel === panels[e.code] ? null : panels[e.code]);
        keys.clear();
        return;
      }
      if (state.panel || state.dialogue) return;
      if (e.code === 'KeyE' || e.code === 'KeyF') state.interact();
      if (e.code === 'KeyQ') state.attack(true);
      if (e.code === 'KeyB') {
        if (state.save.quests.q02?.status !== 'complete') {
          state.notify('Help Bruno first to unlock building.');
          return;
        }
        useGame.setState({ build: !state.build });
      }
      if (/^Digit[1-6]$/.test(e.code)) useGame.setState({ selected: Number(e.code.slice(-1)) - 1 });
    };
    const keyup = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => {
      keys.clear();
      motion.rotating = false;
      if (useGame.getState().started) useGame.getState().open('pause');
    };
    const down = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
      const s = useGame.getState();
      if (s.panel || s.dialogue || !s.started) return;
      if ((e.button === 2 && !s.build) || (e.button === 1 && s.build)) motion.rotating = true;
    };
    const up = () => (motion.rotating = false);
    const move = (e: MouseEvent) => {
      if (!motion.rotating) return;
      motion.yaw -= e.movementX * 0.005 * useGame.getState().settings.sensitivity;
      motion.pitch = Math.max(0.15, Math.min(1.1, motion.pitch + e.movementY * 0.004));
    };
    const wheel = (e: WheelEvent) => {
      if (
        (e.target as HTMLElement).tagName !== 'CANVAS' ||
        !useGame.getState().started ||
        useGame.getState().panel ||
        useGame.getState().dialogue
      )
        return;
      useGame.setState((s) => ({ selected: (s.selected + (e.deltaY > 0 ? 1 : 5)) % 6 }));
    };
    const context = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'CANVAS') e.preventDefault();
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    window.addEventListener('wheel', wheel);
    window.addEventListener('contextmenu', context);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('contextmenu', context);
    };
  }, []);
  return (
    <main className={`game-shell ${started ? 'playing' : 'on-title'}`}>
      <div className="world-container">
        {webgl ? (
          <World />
        ) : (
          <div className="webgl-error">
            <Sprout size={40} />
            <h2>Your world needs WebGL 2</h2>
            <p>Enable hardware acceleration or use a supported desktop browser.</p>
          </div>
        )}
      </div>
      <div className="vignette" />
      {started ? <Hud /> : <MainMenu />}
      <Dialog />
      <PanelView />
      {visibleNotice && (
        <div className="toast" role="status">
          <Sparkles size={17} />
          {notice}
        </div>
      )}
      {started && <TouchControls />}
    </main>
  );
}
