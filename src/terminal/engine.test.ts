import config from '../portfolio.config';
import { complete, distance, parse, run, type ShellContext } from './engine';
import { buildQuests, completedQuests } from './quests';
import type { Line } from './types';

// These tests run in CI before every deploy (see .github/workflows/deploy.yml). If a config edit breaks a command,
// the deploy stops and the live site stays on the last good version.

const ctx = (seen: string[] = []): ShellContext => ({ config, history: [], seen: new Set(seen) });
const text = (lines: Line[]) => lines.map((l) => l.map((s) => (typeof s === 'string' ? s : s.text)).join('')).join('\n');

describe('parse', () => {
  it('lowercases the command and keeps arguments', () => {
    expect(parse('  OPEN  Stackcraft ')).toEqual({ name: 'open', args: ['Stackcraft'] });
  });
});

describe('run', () => {
  it('prints every listed command in help', () => {
    const out = text(run('help', ctx()).lines);
    for (const name of ['about', 'experience', 'projects', 'open', 'skills', 'contact', 'quests', 'clear']) {
      expect(out).toContain(name);
    }
  });

  it('opens each project from the config, by command and by bare name', () => {
    for (const p of config.projects) {
      expect(text(run(`open ${p.id}`, ctx()).lines)).toContain(p.name);
      expect(run(p.id, ctx()).events).toEqual([`open:${p.id}`]);
    }
  });

  it('suggests a close command when one is mistyped', () => {
    const out = text(run('experiance', ctx()).lines);
    expect(out).toContain('command not found');
    expect(out).toContain('experience');
  });

  it('maps cat and ls onto sections', () => {
    expect(run('cat about.md', ctx()).events).toEqual(['cmd:about']);
    expect(run('ls projects', ctx()).events).toEqual(['cmd:projects']);
  });

  it('never prints a TODO placeholder', () => {
    for (const c of ['about', 'experience', 'awards', 'contact', ...config.projects.map((p) => `open ${p.id}`)]) {
      expect(text(run(c, ctx()).lines)).not.toContain('TODO(you)');
    }
  });

  it('runs easter eggs from the config', () => {
    for (const egg of config.easterEggs) expect(run(egg.command, ctx()).events).toEqual(['egg']);
  });
});

describe('complete', () => {
  it('completes a unique command', () => {
    expect(complete('expe', ctx()).value).toBe('experience ');
  });
  it('completes a project id after open', () => {
    expect(complete('open stack', ctx()).value).toBe('open stackcraft ');
  });
  it('lists options when ambiguous', () => {
    expect(complete('c', ctx()).options).toEqual(expect.arrayContaining(['cat', 'contact', 'clear']));
  });
});

describe('quests', () => {
  it('needs every project opened for "Ship it"', () => {
    const quests = buildQuests(config);
    const first = config.projects.map((p) => `open:${p.id}`).slice(0, 1);
    const all = config.projects.map((p) => `open:${p.id}`);
    expect(completedQuests(quests, new Set(first))).not.toContain('ship');
    expect(completedQuests(quests, new Set(all))).toContain('ship');
  });
});

describe('distance', () => {
  it('counts single-letter edits', () => {
    expect(distance('kitten', 'sitting')).toBe(3);
  });
});
