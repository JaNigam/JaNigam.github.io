import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { PortfolioConfig } from '../config/types';
import type { QuestToast } from '../App';
import { useReducedMotion } from '../lib/motion';
import { complete, run, suggestions, type ShellContext } from './engine';
import type { Quest } from './quests';
import type { Line } from './types';
import { Output } from './Output';

interface Entry {
  id: number;
  kind: 'input' | 'output';
  text?: string;
  lines: Line[];
}

interface Props {
  config: PortfolioConfig;
  seen: ReadonlySet<string>;
  quests: Quest[];
  done: string[];
  toast: QuestToast | null;
  onEvents: (events: string[]) => void;
  onSwitchView: () => void;
}

function bootLines(config: PortfolioConfig): Line[] {
  const ok = { text: '[ ok ] ', tone: 'ok' as const };
  return [
    [{ text: `${config.person.handle}-os 1.0 · tty1`, tone: 'dim' }],
    [ok, `mounting /home/${config.person.handle}`],
    [ok, `starting experience-service (${config.experience.length} records)`],
    [ok, `indexing projects/ (${config.projects.length} found)`],
    [ok, 'warming up the JVM'],
    [],
  ];
}

function motd(config: PortfolioConfig, questCount: number): Line[] {
  return [
    [{ text: config.person.name, tone: 'heading' }],
    [{ text: config.person.headline, tone: 'dim' }],
    [],
    ['Type ', { text: 'help', run: 'help', tone: 'accent' }, ' or tap a command below. ', { text: `${questCount} quests`, run: 'quests', tone: 'accent' }, ' are hidden in here.'],
    [],
  ];
}

export function Terminal({ config, seen, quests, done, toast, onEvents, onSwitchView }: Props) {
  const reduced = useReducedMotion();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [booting, setBooting] = useState(true);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  /** Caret position, used to draw the block cursor over the hidden native caret. */
  const [caret, setCaret] = useState(0);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const bootTimers = useRef<number[]>([]);
  const prompt = `${config.person.handle}@${config.person.host}:~$`;

  const push = useCallback((entry: Omit<Entry, 'id'>) => {
    setEntries((prev) => [...prev, { ...entry, id: nextId.current++ }]);
  }, []);

  // ── boot sequence: typed one line at a time, instant under reduced motion, skippable with any key ──────────────
  const finishBoot = useCallback(() => {
    bootTimers.current.forEach(window.clearTimeout);
    bootTimers.current = [];
    setEntries([
      { id: -1, kind: 'output', lines: bootLines(config) },
      { id: nextId.current++, kind: 'output', lines: motd(config, quests.length) },
    ]);
    setBooting(false);
  }, [config, quests.length]);

  useEffect(() => {
    if (reduced) {
      finishBoot();
      return;
    }
    const lines = bootLines(config);
    lines.forEach((_, i) => {
      bootTimers.current.push(
        window.setTimeout(() => setEntries([{ id: -1, kind: 'output', lines: lines.slice(0, i + 1) }]), 140 * i + 120),
      );
    });
    bootTimers.current.push(window.setTimeout(finishBoot, 140 * lines.length + 260));
    return () => bootTimers.current.forEach(window.clearTimeout);
  }, [reduced, config, finishBoot]);

  // Keep the newest output in view.
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [booting]);

  // After any value change (typing, history, Tab), read where the browser put the caret.
  useEffect(() => {
    setCaret(inputRef.current?.selectionStart ?? value.length);
  }, [value]);

  const ctx = useMemo<ShellContext>(() => ({ config, history, seen }), [config, history, seen]);

  const execute = useCallback(
    (raw: string) => {
      if (booting) finishBoot();
      const input = raw.trim();
      setValue('');
      setCursor(null);
      if (!input) {
        push({ kind: 'input', text: '', lines: [] });
        return;
      }
      const nextHistory = [...history, input];
      setHistory(nextHistory);
      const result = run(input, { ...ctx, history: nextHistory });

      if (result.effects?.some((e) => e.type === 'clear')) {
        setEntries([]);
      } else {
        push({ kind: 'input', text: input, lines: [] });
        push({ kind: 'output', lines: result.lines });
      }
      for (const e of result.effects ?? []) {
        if (e.type === 'open') window.open(e.href, '_blank', 'noopener');
        if (e.type === 'view') window.setTimeout(onSwitchView, reduced ? 0 : 380);
      }
      if (result.events?.length) onEvents(result.events);
    },
    [booting, finishBoot, history, ctx, push, onEvents, onSwitchView, reduced],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (booting && e.key !== 'Enter') finishBoot();
    if (e.key === 'Enter') {
      e.preventDefault();
      execute(value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const r = complete(value, ctx);
      if (r.value !== value) {
        setValue(r.value);
        onEvents(['tab']);
      }
      if (r.options.length > 1) {
        push({ kind: 'input', text: value, lines: [] });
        push({ kind: 'output', lines: [r.options.map((o, i) => (i ? `  ${o}` : o))] });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const i = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(i);
      setValue(history[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cursor === null) return;
      const i = cursor + 1;
      if (i >= history.length) {
        setCursor(null);
        setValue('');
      } else {
        setCursor(i);
        setValue(history[i]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      push({ kind: 'input', text: value + '^C', lines: [] });
      setValue('');
    }
  };

  // Clicking the screen focuses the prompt, unless the visitor is selecting text to copy.
  const focusPrompt = () => {
    if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
  };

  const total = quests.length;
  const allDone = done.length === total;

  return (
    <div className="term">
      <header className="statusbar">
        <span className="statusbar-id">
          <span className="dot" aria-hidden="true" /> {config.person.handle}@{config.person.host}
        </span>
        <button type="button" className="meter" onClick={() => execute('quests')} aria-label={`Quests ${done.length} of ${total}. Show quests.`}>
          <span className="meter-label">quests</span>
          <span className="meter-cells" aria-hidden="true">
            {quests.map((q) => (
              <span key={q.id} className={done.includes(q.id) ? 'cell on' : 'cell'} />
            ))}
          </span>
          <span className="meter-count">
            {done.length}/{total}
          </span>
        </button>
        <button type="button" className="switch" onClick={onSwitchView}>
          page view
        </button>
      </header>

      <div className="term-body">
        <div className="screen" ref={screenRef} onClick={focusPrompt}>
          <div role="log" aria-live="polite" aria-label="Terminal output">
            {entries.map((e) =>
              e.kind === 'input' ? (
                <div key={e.id} className="line echo">
                  <span className="prompt">{prompt}</span> {e.text}
                </div>
              ) : (
                <Output key={e.id} lines={e.lines} onRun={execute} animate={!reduced && e.id >= 0} />
              ),
            )}
          </div>

          <form
            className="prompt-row"
            onSubmit={(ev) => {
              ev.preventDefault();
              execute(value);
            }}
          >
            <label htmlFor="cmd" className="prompt">
              {prompt}
            </label>
            <span className="input-wrap" style={{ '--pos': caret } as CSSProperties}>
            <input
              id="cmd"
              ref={inputRef}
              value={value}
              onChange={(ev) => setValue(ev.target.value)}
              onSelect={(ev) => setCaret(ev.currentTarget.selectionStart ?? 0)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-label="Type a command"
            />
            <span className="cursor" aria-hidden="true" />
            </span>
          </form>

          <nav className="chips" aria-label="Suggested commands">
            {suggestions(ctx).map((s) => (
              <button key={s} type="button" onClick={() => execute(s)}>
                {s}
              </button>
            ))}
          </nav>
        </div>

        <aside className="questlog" aria-label="Quest log">
          <h2>Quest log</h2>
          <ol>
            {quests.map((q) => {
              const ok = done.includes(q.id);
              return (
                <li key={q.id} className={ok ? 'ok' : undefined}>
                  <span className="box" aria-hidden="true">{ok ? 'x' : ' '}</span>
                  <span>
                    <span className="q-title">{ok ? q.title : '???'}</span>
                    {!ok && <span className="q-hint">{q.hint}</span>}
                  </span>
                  <span className="sr-only">{ok ? 'completed' : 'not completed'}</span>
                </li>
              );
            })}
          </ol>
          {allDone ? (
            <p className="q-final">
              Root access granted. You have seen everything. <button type="button" className="run tone-accent" onClick={() => execute('contact')}>contact</button>
            </p>
          ) : (
            <p className="q-foot">Progress is saved in this browser.</p>
          )}
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status" key={toast.id}>
          <span className="toast-kicker">{toast.done === toast.total ? 'all quests complete' : 'quest complete'}</span>
          <span className="toast-title">{toast.title}</span>
          <span className="toast-count">
            {toast.done}/{toast.total}
          </span>
        </div>
      )}
    </div>
  );
}
