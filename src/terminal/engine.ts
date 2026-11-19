import type { PortfolioConfig, Project } from '../config/types';
import type { CommandResult, Line, Segment } from './types';
import { buildQuests } from './quests';

// The shell. `run(input, ctx)` takes what the visitor typed and returns lines to print. Everything is derived from
// the config, so this file never needs editing when your content changes.

export interface ShellContext {
  config: PortfolioConfig;
  /** Commands typed so far, oldest first (for `history`). */
  history: string[];
  /** Quest events already seen (for `quests`). */
  seen: ReadonlySet<string>;
}

interface Command {
  name: string;
  aliases?: string[];
  /** One line for `help`. Commands without a summary are hidden from help. */
  summary?: string;
  /** Usage hint shown in help, e.g. "<project>". */
  args?: string;
  run: (args: string[], ctx: ShellContext) => CommandResult;
  /** Values offered by Tab completion for the first argument. */
  complete?: (ctx: ShellContext) => string[];
  /** Hide the command from help and completion when the config has nothing for it (e.g. no resume uploaded). */
  when?: (config: PortfolioConfig) => boolean;
}

const listed = (config: PortfolioConfig) => commands.filter((c) => c.summary && (c.when?.(config) ?? true));

// ── tiny helpers for building lines ──────────────────────────────────────────────────────────────────────────────
const t = (text: string, tone?: Exclude<Segment, string>['tone']): Segment => (tone ? { text, tone } : text);
const cmd = (text: string, run = text): Segment => ({ text, run, tone: 'accent' });
const link = (text: string, href: string): Segment => ({ text, href, tone: 'accent' });
const blank: Line = [];
const isTodo = (s?: string) => !s || s.includes('TODO(you)');
const show = (s?: string) => (isTodo(s) ? '' : (s as string));

function range(start: string, end: string): string {
  const a = show(start);
  const b = show(end);
  return a && b ? `${a} – ${b}` : a || b;
}

function bullets(items: string[] | undefined): Line[] {
  return (items ?? []).filter((i) => !isTodo(i)).map((i) => [t('  › ', 'bullet'), i]);
}

// ── the "filesystem" a visitor can ls / cat ──────────────────────────────────────────────────────────────────────
const FILES: Record<string, string> = {
  'about.md': 'about',
  'experience/': 'experience',
  'projects/': 'projects',
  'skills.json': 'skills',
  'awards/': 'awards',
  'log/': 'log',
  'education.md': 'education',
  'contact.txt': 'contact',
  'resume.pdf': 'resume',
  'quests.log': 'quests',
};

function visibleFiles(config: PortfolioConfig): string[] {
  return Object.keys(FILES).filter((f) => {
    if (f === 'resume.pdf') return !!config.resume;
    if (f === 'education.md') return config.education.length > 0;
    if (f === 'awards/') return config.awards.length > 0;
    if (f === 'log/') return config.log.length > 0;
    return true;
  });
}

function findProject(config: PortfolioConfig, id: string | undefined): Project | undefined {
  if (!id) return undefined;
  const key = id.replace(/\/$/, '').replace(/^projects\//, '').toLowerCase();
  return config.projects.find((p) => p.id === key);
}

function projectLines(p: Project): Line[] {
  const lines: Line[] = [[t(p.name, 'heading')], [t(p.tagline, 'dim')], blank];
  if (!isTodo(p.description)) lines.push([p.description], blank);
  lines.push(...bullets(p.highlights));
  const tech = p.tech.filter((x) => !isTodo(x));
  if (tech.length) lines.push(blank, [t('stack  ', 'dim'), tech.join(' · ')]);
  const links = (p.links ?? []).filter((l) => !isTodo(l.href));
  if (links.length) {
    const segs: Line = [t('links  ', 'dim')];
    links.forEach((l, i) => {
      if (i) segs.push(t('  '));
      segs.push(link(`[${l.label}]`, l.href));
    });
    lines.push(segs);
  }
  return lines;
}

// ── commands ─────────────────────────────────────────────────────────────────────────────────────────────────────
const commands: Command[] = [
  {
    name: 'help',
    summary: 'list commands',
    run: (_a, { config }) => {
      const shown = listed(config);
      const width = Math.max(...shown.map((c) => (c.name + (c.args ? ' ' + c.args : '')).length)) + 3;
      return {
        events: ['cmd:help'],
        lines: [
          [t('Commands', 'heading')],
          ...shown.map((c): Line => [
            cmd(c.name),
            t((c.args ? ' ' + c.args : '').padEnd(width - c.name.length), 'dim'),
            c.summary!,
          ]),
          blank,
          [t('Tip: ', 'dim'), 'Tab completes, ↑/↓ walks history, and anything ', t('highlighted', 'accent'), ' is clickable.'],
        ],
      };
    },
  },
  {
    name: 'about',
    aliases: ['whoami'],
    summary: 'who I am',
    run: (_a, { config }) => {
      const p = config.person;
      const lines: Line[] = [[t(p.name, 'heading')], [t(show(p.headline), 'dim')]];
      if (show(p.location)) lines.push([t('loc  ', 'dim'), show(p.location)]);
      if (show(p.status)) lines.push([t('now  ', 'dim'), t(p.status!, 'ok')]);
      lines.push(blank);
      p.about.filter((x) => !isTodo(x)).forEach((para, i) => {
        if (i) lines.push(blank);
        lines.push([para]);
      });
      lines.push(blank, [t('next → ', 'dim'), cmd('experience'), t('  '), cmd('ls projects')]);
      return { events: ['cmd:about'], lines };
    },
  },
  {
    name: 'experience',
    aliases: ['work', 'jobs'],
    summary: 'where I have worked',
    run: (_a, { config }) => {
      const lines: Line[] = [];
      config.experience.forEach((j, i) => {
        if (i) lines.push(blank);
        const when = range(j.start, j.end);
        lines.push([t(j.role, 'heading'), t(' @ ', 'dim'), t(j.company, 'bold')]);
        const meta = [when, show(j.location)].filter(Boolean).join('  ·  ');
        if (meta) lines.push([t(meta, 'dim')]);
        if (j.summary && !isTodo(j.summary)) lines.push([j.summary]);
        lines.push(...bullets(j.highlights));
        const tech = (j.tech ?? []).filter((x) => !isTodo(x));
        if (tech.length) lines.push([t('  stack  ', 'dim'), t(tech.join(' · '), 'dim')]);
      });
      return { events: ['cmd:experience'], lines };
    },
  },
  {
    name: 'projects',
    summary: 'things I have built',
    run: (_a, { config }) => {
      const width = Math.max(...config.projects.map((p) => p.id.length)) + 2;
      return {
        events: ['cmd:projects'],
        lines: [
          ...config.projects.map((p): Line => [cmd(p.id + '/', `open ${p.id}`), t(' '.repeat(width - p.id.length)), t(p.tagline, 'dim')]),
          blank,
          [t('open one: ', 'dim'), cmd(`open ${config.projects[0]?.id ?? ''}`)],
        ],
      };
    },
  },
  {
    name: 'open',
    args: '<project>',
    summary: 'open a project',
    complete: ({ config }) => config.projects.map((p) => p.id),
    run: (args, ctx) => {
      const p = findProject(ctx.config, args[0]);
      if (!p) {
        const ids = ctx.config.projects.map((x) => x.id);
        return {
          lines: [
            [t(args[0] ? `open: no such project: ${args[0]}` : 'open: which one?', args[0] ? 'danger' : undefined)],
            [t('try: ', 'dim'), ...ids.flatMap((id, i) => (i ? [t('  '), cmd(id, `open ${id}`)] : [cmd(id, `open ${id}`)]))],
          ],
        };
      }
      return { events: [`open:${p.id}`], lines: projectLines(p) };
    },
  },
  {
    name: 'skills',
    aliases: ['stack'],
    summary: 'tools and languages',
    run: (_a, { config }) => {
      const width = Math.max(...config.skills.map((g) => g.group.length)) + 2;
      return {
        events: ['cmd:skills'],
        lines: config.skills.map((g): Line => [t(g.group.padEnd(width), 'dim'), g.items.join(' · ')]),
      };
    },
  },
  {
    name: 'awards',
    aliases: ['achievements'],
    summary: 'recognition',
    when: (c) => c.awards.length > 0,
    run: (_a, { config }) => {
      if (!config.awards.length) return { lines: [[t('Nothing here yet.', 'dim')]] };
      const lines: Line[] = [];
      config.awards.forEach((a) => {
        const meta = [a.issuer, show(a.year)].filter(Boolean).join(', ');
        lines.push([t('★ ', 'accent'), t(a.title, 'bold'), t(`  ${meta}`, 'dim')]);
        if (a.note) lines.push([t('  ' + a.note, 'dim')]);
      });
      return { events: ['cmd:awards'], lines };
    },
  },
  {
    name: 'log',
    aliases: ['blog', 'learning'],
    summary: 'what I am learning and writing',
    when: (c) => c.log.length > 0,
    run: (_a, { config }) => {
      if (!config.log.length) return { lines: [[t('Nothing logged yet.', 'dim')]] };
      const lines: Line[] = [];
      config.log.forEach((e) => {
        lines.push([t(e.date.padEnd(10), 'dim'), e.href ? link(e.title, e.href) : t(e.title, 'bold')]);
        if (e.note) lines.push([t(' '.repeat(10) + e.note, 'dim')]);
      });
      return { events: ['cmd:log'], lines };
    },
  },
  {
    name: 'education',
    run: (_a, { config }) => ({
      lines: config.education.length
        ? config.education.map((e): Line => [t(e.degree, 'bold'), t(`  ${e.school}  ${range(e.start ?? '', e.end ?? '')}`, 'dim')])
        : [[t('Not listed.', 'dim')]],
    }),
  },
  {
    name: 'contact',
    aliases: ['email', 'ping'],
    summary: 'get in touch',
    run: (_a, { config }) => {
      const lines: Line[] = [];
      if (config.contact.email) lines.push([t('email'.padEnd(10), 'dim'), link(config.contact.email, `mailto:${config.contact.email}`)]);
      config.contact.links
        .filter((l) => !isTodo(l.href))
        .forEach((l) => lines.push([t(l.label.padEnd(10), 'dim'), link(l.href.replace(/^https?:\/\/(www\.)?/, ''), l.href)]));
      if (config.resume) lines.push([t('resume'.padEnd(10), 'dim'), cmd('resume')]);
      return { events: ['cmd:contact'], lines };
    },
  },
  {
    name: 'resume',
    aliases: ['cv'],
    summary: 'download my resume',
    when: (c) => !!c.resume,
    run: (_a, { config }) =>
      config.resume
        ? { lines: [[t('Opening resume.pdf ...', 'dim')]], effects: [{ type: 'open', href: config.resume }], events: ['cmd:resume'] }
        : { lines: [[t('resume: not uploaded yet', 'dim')]] },
  },
  {
    name: 'quests',
    summary: 'your progress',
    run: (_a, { config, seen }) => {
      const quests = buildQuests(config);
      const done = quests.filter((q) => q.done(seen));
      const lines: Line[] = [[t(`Quests ${done.length}/${quests.length}`, 'heading')]];
      quests.forEach((q) => {
        const ok = q.done(seen);
        lines.push(ok ? [t('[x] ', 'ok'), t(q.title, 'bold')] : [t('[ ] ', 'dim'), t(q.title + '  ', 'dim'), t(`hint: ${q.hint}`, 'dim')]);
      });
      return { lines };
    },
  },
  {
    name: 'ls',
    args: '[dir]',
    summary: 'list files',
    complete: ({ config }) => visibleFiles(config).filter((f) => f.endsWith('/')),
    run: (args, ctx) => {
      const target = (args[0] ?? '').replace(/^\.\//, '').replace(/\/$/, '');
      if (!target || target === '.' || target === '~') {
        const segs: Line = [];
        visibleFiles(ctx.config).forEach((f, i) => {
          if (i) segs.push(t('  '));
          segs.push(cmd(f, FILES[f]));
        });
        return { lines: [segs] };
      }
      if (target === 'projects') return run('projects', ctx);
      const file = Object.keys(FILES).find((f) => f.replace(/\/$/, '') === target);
      if (file) return run(FILES[file], ctx);
      return { lines: [[t(`ls: cannot access '${args[0]}': No such file or directory`, 'danger')]] };
    },
  },
  {
    name: 'cat',
    args: '<file>',
    summary: 'print a file',
    complete: ({ config }) => [...visibleFiles(config), ...config.projects.map((p) => `projects/${p.id}`)],
    run: (args, ctx) => {
      const target = (args[0] ?? '').replace(/^\.\//, '');
      if (!target) return { lines: [[t('cat: which file? try ', 'dim'), cmd('ls')]] };
      if (target.startsWith('projects/') && target !== 'projects/') return run(`open ${target}`, ctx);
      const file = FILES[target] ?? FILES[target + '/'] ?? FILES[target.replace(/\/$/, '') + '/'];
      if (file) return run(file, ctx);
      return { lines: [[t(`cat: ${target}: No such file or directory`, 'danger')]] };
    },
  },
  {
    name: 'cd',
    run: (args, ctx) => {
      if (!args[0] || args[0] === '~') return { lines: [[t('Already home.', 'dim')]] };
      const r = run(`ls ${args[0]}`, ctx);
      return { ...r, lines: [[t(`(no need to cd here: showing ${args[0]})`, 'dim')], ...r.lines] };
    },
  },
  {
    name: 'history',
    run: (_a, { history }) => ({
      lines: history.length
        ? history.map((h, i): Line => [t(String(i + 1).padStart(4) + '  ', 'dim'), cmd(h)])
        : [[t('No history yet.', 'dim')]],
    }),
  },
  {
    name: 'echo',
    run: (args) => ({ lines: [[args.join(' ')]] }),
  },
  {
    name: 'date',
    run: () => ({ lines: [[new Date().toString()]] }),
  },
  {
    name: 'sudo',
    run: (args, ctx) => {
      if (args[0] === 'hire') {
        const email = ctx.config.contact.email;
        return {
          events: ['sudo:hire'],
          lines: [
            [t('[sudo] password for recruiter: ', 'dim'), t('********', 'dim')],
            [t('Access granted. ', 'ok'), 'Good call.'],
            email
              ? [t('Next step: ', 'dim'), link(`mail ${email}`, `mailto:${email}`), t(' or ', 'dim'), cmd('contact')]
              : [t('Next step: ', 'dim'), cmd('contact')],
          ],
        };
      }
      if (args.join(' ').startsWith('rm -rf')) {
        return { lines: [[t('Nice try. This box has backups and a change-approval board.', 'danger')]] };
      }
      return { lines: [[t(`${ctx.config.person.handle} is not in the sudoers file. This incident will be reported.`, 'danger')], [t('(the only thing sudo can do here is ', 'dim'), cmd('sudo hire'), t(')', 'dim')]] };
    },
  },
  {
    name: 'rm',
    run: () => ({ lines: [[t('rm: permission denied. Production is read-only on Fridays and every other day.', 'danger')]] }),
  },
  {
    name: 'page',
    aliases: ['gui', 'exit', 'recruiter'],
    summary: 'switch to the plain page view',
    run: () => ({ lines: [[t('Switching to page view ...', 'dim')]], effects: [{ type: 'view', view: 'page' }] }),
  },
  {
    name: 'clear',
    aliases: ['cls'],
    summary: 'clear the screen',
    run: () => ({ lines: [], effects: [{ type: 'clear' }] }),
  },
];

// ── public API ───────────────────────────────────────────────────────────────────────────────────────────────────
function lookup(name: string): Command | undefined {
  return commands.find((c) => c.name === name || c.aliases?.includes(name));
}

/** Splits input into the command name (lowercased) and its arguments. */
export function parse(input: string): { name: string; args: string[] } {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  return { name: (parts[0] ?? '').toLowerCase(), args: parts.slice(1) };
}

/** Levenshtein distance: how many single-letter edits turn a into b. Used for "did you mean". */
export function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function run(input: string, ctx: ShellContext): CommandResult {
  const { name, args } = parse(input);
  if (!name) return { lines: [] };

  const egg = ctx.config.easterEggs.find((e) => e.command.toLowerCase() === input.trim().toLowerCase());
  if (egg) return { events: ['egg'], lines: egg.output.map((l) => [l]) };

  // `open stackcraft`, but also just `stackcraft`.
  if (findProject(ctx.config, name) && !lookup(name)) return run(`open ${name}`, ctx);

  const command = lookup(name);
  if (command) return command.run(args, ctx);

  const names = listed(ctx.config).map((c) => c.name);
  const best = names.map((n) => ({ n, d: distance(name, n) })).sort((a, b) => a.d - b.d)[0];
  const lines: Line[] = [[t(`command not found: ${name}`, 'danger')]];
  if (best && best.d <= 2) lines.push([t('did you mean ', 'dim'), cmd(best.n), t('?', 'dim')]);
  else lines.push([t('type ', 'dim'), cmd('help'), t(' to see what this shell can do', 'dim')]);
  return { lines };
}

/**
 * Tab completion. Returns the completed input, or the input unchanged plus the candidates when it is ambiguous.
 */
export function complete(input: string, ctx: ShellContext): { value: string; options: string[] } {
  const endsWithSpace = /\s$/.test(input);
  const parts = input.trimStart().split(/\s+/);
  const prefixPart = endsWithSpace ? '' : (parts.pop() ?? '');
  const before = parts.join(' ');

  let pool: string[];
  if (parts.length === 0) {
    pool = listed(ctx.config).map((c) => c.name);
  } else {
    const c = lookup(parts[0].toLowerCase());
    pool = parts.length === 1 && c?.complete ? c.complete(ctx) : [];
  }

  const matches = pool.filter((p) => p.startsWith(prefixPart.toLowerCase()));
  if (matches.length === 0) return { value: input, options: [] };
  const join = (s: string) => (before ? `${before} ${s}` : s);
  if (matches.length === 1) {
    const done = matches[0];
    return { value: join(done) + (done.endsWith('/') ? '' : ' '), options: [] };
  }
  // Extend to the longest common prefix, like bash does.
  let common = matches[0];
  for (const m of matches) while (!m.startsWith(common)) common = common.slice(0, -1);
  return { value: join(common.length > prefixPart.length ? common : prefixPart), options: matches };
}

/** Commands suggested as tap targets under the prompt (useful on phones). */
export function suggestions(ctx: ShellContext): string[] {
  const all = ['help', 'about', 'experience', 'projects', 'skills', 'awards', 'log', 'contact', 'quests', 'sudo hire'];
  if (ctx.config.resume) all.splice(8, 0, 'resume');
  return all;
}
