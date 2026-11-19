import type { Line, Segment } from './types';

// Draws the lines a command returned. Clickable segments are real <button>s and <a>s, so keyboard and
// screen-reader users can use them too.

function Seg({ seg, onRun }: { seg: Segment; onRun: (cmd: string) => void }) {
  if (typeof seg === 'string') return <>{seg}</>;
  const cls = seg.tone ? `tone-${seg.tone}` : undefined;
  if (seg.href) {
    const external = /^https?:/.test(seg.href);
    return (
      <a className={cls} href={seg.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {seg.text}
      </a>
    );
  }
  if (seg.run) {
    return (
      <button type="button" className={`run ${cls ?? ''}`} onClick={() => onRun(seg.run!)}>
        {seg.text}
      </button>
    );
  }
  return <span className={cls}>{seg.text}</span>;
}

export function Output({ lines, onRun, animate }: { lines: Line[]; onRun: (cmd: string) => void; animate: boolean }) {
  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          className={`line${animate ? ' reveal' : ''}`}
          // Stagger each line a little, capped so long outputs do not crawl.
          style={animate ? { animationDelay: `${Math.min(i, 24) * 22}ms` } : undefined}
        >
          {line.length === 0 ? ' ' : line.map((s, j) => <Seg key={j} seg={s} onRun={onRun} />)}
        </div>
      ))}
    </>
  );
}
