import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { PortfolioConfig } from '../config/types';

// The plain page view ("recruiter mode"): the same config, laid out as a fast, scannable page.
// Each section is headed by the terminal command that would show it, so the two views feel like one product.

const isTodo = (s?: string) => !s || s.includes('TODO(you)');
const show = (s?: string) => (isTodo(s) ? '' : (s as string));
const dates = (a?: string, b?: string) => [show(a), show(b)].filter(Boolean).join(' – ');

function Section({ id, cmd, title, children }: { id: string; cmd: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="pv-section" aria-labelledby={`${id}-h`}>
      <p className="pv-cmd" aria-hidden="true">
        <span className="pv-dollar">$</span> {cmd}
      </p>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

/** Fades sections in as they scroll into view. Skipped entirely under reduced motion (see styles.css). */
function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const targets = el.querySelectorAll('.pv-section');
    const io = new IntersectionObserver(
      (items) =>
        items.forEach((it) => {
          if (it.isIntersecting) {
            it.target.classList.add('in');
            io.unobserve(it.target);
          }
        }),
      { rootMargin: '0px 0px -10% 0px' },
    );
    targets.forEach((t) => {
      t.classList.add('pending');
      io.observe(t);
    });
    return () => io.disconnect();
  }, [root]);
}

export function PageView({ config, onSwitchView }: { config: PortfolioConfig; onSwitchView: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const p = config.person;
  const links = config.contact.links.filter((l) => !isTodo(l.href));

  const nav = [
    ['about', 'About'],
    ['experience', 'Experience'],
    ['projects', 'Projects'],
    ['skills', 'Skills'],
    ...(config.awards.length ? [['awards', 'Awards']] : []),
    ...(config.log.length ? [['log', 'Log']] : []),
    ['contact', 'Contact'],
  ];

  return (
    <div className="pv">
      <header className="pv-bar">
        <a className="pv-home" href="#page" onClick={() => window.scrollTo(0, 0)}>
          {p.handle}@{p.host}
        </a>
        <nav aria-label="Sections">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }}>
              {label}
            </a>
          ))}
        </nav>
        <button type="button" className="switch" onClick={onSwitchView}>
          terminal
        </button>
      </header>

      <main ref={ref} className="pv-main">
        <div className="pv-hero">
          <p className="pv-kicker">{[show(p.headline), show(p.location)].filter(Boolean).join('  ·  ')}</p>
          <h1>{p.name}</h1>
          {show(p.status) && <p className="pv-status">{p.status}</p>}
          <div className="pv-actions">
            <button type="button" className="pv-btn primary" onClick={onSwitchView}>
              Play the terminal version
            </button>
            {config.resume && (
              <a className="pv-btn" href={config.resume} download>
                Download resume
              </a>
            )}
          </div>
        </div>

        <Section id="about" cmd="cat about.md" title="About">
          <div className="pv-prose">
            {p.about.filter((x) => !isTodo(x)).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Section>

        <Section id="experience" cmd="experience" title="Experience">
          <ol className="pv-timeline">
            {config.experience.map((j, i) => (
              <li key={i}>
                <p className="pv-when">{dates(j.start, j.end)}</p>
                <div>
                  <h3>
                    {j.role} <span className="pv-at">at {j.company}</span>
                  </h3>
                  {show(j.location) && <p className="pv-meta">{j.location}</p>}
                  {show(j.summary) && <p>{j.summary}</p>}
                  <ul className="pv-bullets">
                    {j.highlights.filter((h) => !isTodo(h)).map((h, k) => (
                      <li key={k}>{h}</li>
                    ))}
                  </ul>
                  {j.tech && <p className="pv-tech">{j.tech.filter((x) => !isTodo(x)).join(' · ')}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="projects" cmd="ls projects/" title="Projects">
          <ol className="pv-projects">
            {config.projects.map((pr, i) => (
              <li key={pr.id}>
                <span className="pv-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{pr.name}</h3>
                  <p className="pv-tagline">{pr.tagline}</p>
                  {show(pr.description) && <p>{pr.description}</p>}
                  {pr.highlights && (
                    <ul className="pv-bullets">
                      {pr.highlights.filter((h) => !isTodo(h)).map((h, k) => (
                        <li key={k}>{h}</li>
                      ))}
                    </ul>
                  )}
                  <p className="pv-tech">{pr.tech.filter((x) => !isTodo(x)).join(' · ')}</p>
                  {pr.links && pr.links.length > 0 && (
                    <p className="pv-links">
                      {pr.links.filter((l) => !isTodo(l.href)).map((l) => (
                        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                          {l.label} ↗
                        </a>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="skills" cmd="cat skills.json" title="Skills">
          <dl className="pv-skills">
            {config.skills.map((g) => (
              <div key={g.group}>
                <dt>{g.group}</dt>
                <dd>{g.items.join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {config.awards.length > 0 && (
          <Section id="awards" cmd="awards" title="Awards & achievements">
            <ul className="pv-awards">
              {config.awards.map((a) => (
                <li key={a.title}>
                  <span className="pv-star" aria-hidden="true">★</span>
                  <div>
                    <h3>{a.title}</h3>
                    <p className="pv-meta">{[a.issuer, show(a.year)].filter(Boolean).join(', ')}</p>
                    {a.note && <p>{a.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {config.log.length > 0 && (
          <Section id="log" cmd="log" title="Learning log">
            <ul className="pv-log">
              {config.log.map((e) => (
                <li key={e.title}>
                  <span className="pv-when">{e.date}</span>
                  <div>
                    {e.href ? (
                      <a href={e.href} target="_blank" rel="noopener noreferrer">
                        {e.title} ↗
                      </a>
                    ) : (
                      <strong>{e.title}</strong>
                    )}
                    {e.note && <p className="pv-meta">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {config.education.length > 0 && (
          <Section id="education" cmd="cat education.md" title="Education">
            <ul className="pv-log">
              {config.education.map((e) => (
                <li key={e.degree}>
                  <span className="pv-when">{dates(e.start, e.end)}</span>
                  <div>
                    <strong>{e.degree}</strong>
                    <p className="pv-meta">{e.school}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section id="contact" cmd="contact" title="Contact">
          {config.contact.email && (
            <p className="pv-email">
              <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a>
            </p>
          )}
          <ul className="pv-contact">
            {links.map((l) => (
              <li key={l.href}>
                <span className="pv-meta">{l.label}</span>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.href.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </li>
            ))}
            {config.resume && (
              <li>
                <span className="pv-meta">resume</span>
                <a href={config.resume} download>
                  resume.pdf
                </a>
              </li>
            )}
          </ul>
        </Section>

        <footer className="pv-foot">
          <span>Built with Vite + React, deployed by GitHub Actions.</span>
          <button type="button" className="linkish" onClick={onSwitchView}>
            There is a terminal version with quests →
          </button>
        </footer>
      </main>
    </div>
  );
}
