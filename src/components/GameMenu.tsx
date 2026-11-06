'use client';
import {
  Backpack,
  BookOpen,
  PawPrint,
  Map,
  Settings,
  Hammer,
  Compass,
  Users,
  Save,
  Home,
} from 'lucide-react';
import { useGame, type Panel } from '@/game/store';
import { navigation } from '@/game/input';
export default function GameMenu() {
  const settings = useGame((s) => s.settings),
    build = useGame((s) => s.build);
  const links: { panel: Panel; label: string; icon: typeof Backpack; hint: string }[] = [
    { panel: 'inventory', label: 'Backpack', icon: Backpack, hint: 'Items and equipment' },
    { panel: 'journal', label: 'Quest journal', icon: BookOpen, hint: 'Objectives and rewards' },
    {
      panel: 'creatures',
      label: 'Creature collection',
      icon: PawPrint,
      hint: 'Your forest friends',
    },
    { panel: 'squad', label: 'Creature squad', icon: Users, hint: 'Equipment and tactics' },
    {
      panel: 'commands',
      label: 'Companion commands',
      icon: PawPrint,
      hint: 'Follow, stay and utilities',
    },
    { panel: 'map', label: 'World map', icon: Map, hint: 'Destinations and discoveries' },
    { panel: 'settings', label: 'Settings', icon: Settings, hint: 'UI scale, sound and controls' },
    { panel: 'pause', label: 'Pause & save', icon: Save, hint: 'Save or return to title' },
  ];
  return (
    <div className="adventure-menu">
      <p className="panel-intro">Everything for your adventure, in one place.</p>
      <nav aria-label="Adventure navigation">
        {links.map((a) => (
          <button
            aria-label={a.label}
            key={a.panel}
            onClick={() => useGame.getState().open(a.panel)}
          >
            <a.icon size={22} />
            <span>
              <b>{a.label}</b>
              <small>{a.hint}</small>
            </span>
          </button>
        ))}
      </nav>
      <div className="drawer-tools">
        <h3>World controls</h3>
        <button
          aria-label="Switch camera perspective"
          aria-pressed={settings.perspective === 'adventure'}
          onClick={() =>
            useGame.getState().configure({
              perspective: settings.perspective === 'classic' ? 'adventure' : 'classic',
            })
          }
        >
          <Compass size={20} />
          <span>
            Camera <b>{settings.perspective === 'classic' ? 'Classic' : 'Isometric'}</b>
          </span>
        </button>
        <button
          aria-label="Toggle building mode"
          aria-pressed={build}
          onClick={() => {
            const s = useGame.getState();
            if (s.save.quests.q02?.status !== 'complete') {
              s.notify('Help Bruno first to unlock building.');
              return;
            }
            navigation.destination = null;
            s.open(null);
            useGame.setState({ build: !build });
          }}
        >
          <Hammer size={20} />
          <span>{build ? 'Exit building' : 'Build at your homestead'}</span>
        </button>
      </div>
    </div>
  );
}
