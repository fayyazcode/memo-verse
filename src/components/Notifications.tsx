'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkles, TriangleAlert, Check } from 'lucide-react';
import { useGame } from '@/game/store';
import { noticeTone, combinePickup, enqueueNotice, notificationPriority } from '@/game/ui';
type Item = { text: string; tone: ReturnType<typeof noticeTone>; time: number };
const priority = notificationPriority;
export default function Notifications() {
  const notice = useGame((s) => s.notice),
    id = useGame((s) => s.noticeId);
  const [visible, setVisible] = useState<Item | null>(null),
    current = useRef<Item | null>(null),
    queue = useRef<Item[]>([]),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (item: Item | null) => {
    if (timer.current) clearTimeout(timer.current);
    current.current = item;
    setVisible(item);
    if (item)
      timer.current = setTimeout(
        () => show(queue.current.shift() ?? null),
        item.tone === 'danger' ? 6000 : item.tone === 'reward' ? 4000 : 2800
      );
  };
  useEffect(() => {
    if (!notice) return;
    const item: Item = { text: notice, tone: noticeTone(notice), time: Date.now() },
      old = current.current;
    if (old && priority[old.tone] > priority[item.tone]) {
      queue.current = enqueueNotice(queue.current, item);
      return;
    }
    const combined =
      old && Date.now() - old.time < 1500 ? combinePickup(old.text, item.text) : null;
    show(combined ? { ...item, text: combined } : item);
  }, [notice, id]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  if (!visible) return null;
  return (
    <div
      className="toast"
      data-tone={visible.tone}
      role={visible.tone === 'danger' ? 'alert' : 'status'}
    >
      {visible.tone === 'danger' || visible.tone === 'warning' ? (
        <TriangleAlert size={20} />
      ) : visible.tone === 'reward' ? (
        <Check size={20} />
      ) : (
        <Sparkles size={20} />
      )}
      <span>{visible.text}</span>
    </div>
  );
}
