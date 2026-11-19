import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import config from './portfolio.config';
import { buildQuests, completedQuests } from './terminal/quests';
import { Terminal } from './terminal/Terminal';
import { PageView } from './page/PageView';
import { load, save } from './lib/storage';

type View = 'terminal' | 'page';

// Which view to open first: a #page or #terminal link wins; otherwise phones get the page view, since typing
// commands on a phone keyboard is a chore (they can still switch to the terminal).
function initialView(): View {
  if (location.hash === '#page') return 'page';
  if (location.hash === '#terminal') return 'terminal';
  return window.matchMedia('(max-width: 640px)').matches ? 'page' : 'terminal';
}

function applyTheme() {
  const root = document.documentElement.style;
  const { theme } = config;
  root.setProperty('--bg', theme.bg);
  root.setProperty('--fg', theme.fg);
  root.setProperty('--dim', theme.dim);
  root.setProperty('--accent', theme.accent);
  root.setProperty('--danger', theme.danger);
  document.documentElement.dataset.scanlines = String(theme.scanlines);
  document.title = config.site.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', config.site.description);
}

export interface QuestToast {
  id: number;
  title: string;
  done: number;
  total: number;
}

export default function App() {
  const [view, setView] = useState<View>(initialView);
  const [seen, setSeen] = useState<Set<string>>(() => new Set(load<string[]>('quest-events', [])));
  const [toast, setToast] = useState<QuestToast | null>(null);
  const quests = useMemo(() => buildQuests(config), []);
  const done = useMemo(() => completedQuests(quests, seen), [quests, seen]);
  const toastTimer = useRef<number | undefined>(undefined);
  const seenRef = useRef(seen);

  useEffect(applyTheme, []);
  useEffect(() => save('quest-events', [...seen]), [seen]);

  const switchView = useCallback((next: View) => {
    setView(next);
    history.replaceState(null, '', `#${next}`);
    window.scrollTo(0, 0);
  }, []);

  /** Record quest events; announce any quest that just became complete. */
  const record = useCallback(
    (events: string[]) => {
      const prev = seenRef.current;
      if (events.every((e) => prev.has(e))) return;
      const next = new Set(prev);
      events.forEach((e) => next.add(e));
      seenRef.current = next;
      setSeen(next);

      const before = new Set(completedQuests(quests, prev));
      const after = completedQuests(quests, next);
      const fresh = quests.find((q) => after.includes(q.id) && !before.has(q.id));
      if (fresh) {
        window.clearTimeout(toastTimer.current);
        setToast({ id: Date.now(), title: fresh.title, done: after.length, total: quests.length });
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
      }
    },
    [quests],
  );

  return view === 'terminal' ? (
    <Terminal
      config={config}
      seen={seen}
      quests={quests}
      done={done}
      toast={toast}
      onEvents={record}
      onSwitchView={() => switchView('page')}
    />
  ) : (
    <PageView config={config} onSwitchView={() => switchView('terminal')} />
  );
}
