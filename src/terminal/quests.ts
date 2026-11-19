import type { PortfolioConfig } from '../config/types';

// Quests are the game layer: small goals that nudge a visitor to see every section.
// Commands emit "events" (e.g. "cmd:experience", "open:stackcraft"); a quest is done once the events it needs
// have all been seen. The list is built from the config, so adding a project automatically extends "Ship it".

export interface Quest {
  id: string;
  title: string;
  /** Shown while locked, so a stuck visitor knows what to try. */
  hint: string;
  done: (seen: ReadonlySet<string>) => boolean;
}

export function buildQuests(config: PortfolioConfig): Quest[] {
  const has = (e: string) => (seen: ReadonlySet<string>) => seen.has(e);
  const projectIds = config.projects.map((p) => p.id);

  const quests: Quest[] = [
    { id: 'hello', title: 'Hello, world', hint: 'ask the shell for help', done: has('cmd:help') },
    { id: 'whoami', title: 'Who goes there', hint: 'find out whose machine this is', done: has('cmd:about') },
    { id: 'history', title: 'Archaeologist', hint: 'dig through the work history', done: has('cmd:experience') },
    {
      id: 'ship',
      title: 'Ship it',
      hint: `open every project (${projectIds.length})`,
      done: (seen) => projectIds.every((id) => seen.has(`open:${id}`)),
    },
    { id: 'stack', title: 'Full stack', hint: 'list the skills', done: has('cmd:skills') },
    { id: 'trophy', title: 'Trophy case', hint: 'look for awards', done: has('cmd:awards') },
    { id: 'tab', title: 'Lazy typist', hint: 'let the shell finish a word for you', done: has('tab') },
    { id: 'sudo', title: 'Bold move', hint: 'try to hire me, with privileges', done: has('sudo:hire') },
  ];

  if (config.easterEggs.length > 0) {
    quests.push({ id: 'egg', title: 'Off the map', hint: 'some commands are not in help', done: has('egg') });
  }
  quests.push({ id: 'ping', title: 'Handshake', hint: 'find a way to reach me', done: has('cmd:contact') });
  return quests;
}

/** Ids of quests that are done given the events seen so far. */
export function completedQuests(quests: Quest[], seen: ReadonlySet<string>): string[] {
  return quests.filter((q) => q.done(seen)).map((q) => q.id);
}
