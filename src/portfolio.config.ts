// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//  portfolio.config.ts  ·  THE ONLY FILE YOU NEED TO EDIT
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//  Everything the site shows comes from here: the terminal commands (`about`, `ls projects`, `open stackcraft` ...)
//  and the plain page view are both generated from this object. Add a job or a project here and it appears in both
//  places; there is nothing else to wire up.
//
//  How to edit:
//    1. Change a value, save, and `npm run dev` reloads the page instantly.
//    2. If you break the shape (typo in a field name, missing comma), VS Code underlines it in red and
//       `npm run build` fails with the exact line. That is the type in src/config/types.ts doing its job.
//    3. Lines marked  TODO(you)  are placeholders I could not fill from what I know. Replace them before you share
//       the link. Search the file for "TODO(you)" to find them all.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

import type { PortfolioConfig } from './config/types';

const config: PortfolioConfig = {
  site: {
    title: 'Jayant Nigam | Software Engineer', // TODO(you): confirm the name as you want it shown
    description:
      'Software engineer building data platforms and GenAI developer tooling. An interactive terminal portfolio: type help to start.',
  },

  person: {
    name: 'Jayant Nigam', // TODO(you): confirm
    handle: 'jayant',
    host: 'prod',
    headline: 'Software Engineer · data platforms & GenAI tooling', // TODO(you): your one-line title
    location: 'India', // TODO(you): city, country
    about: [
      // TODO(you): rewrite in your own voice. Two or three short paragraphs read best.
      'I am a software engineer at Wells Fargo. I started in data engineering, moving millions of records a day through Spark pipelines, and now build full-stack services and GenAI tooling that other engineering teams rely on.',
      'Most of what I ship is backend: Java and Spring Boot services, Kafka, Kubernetes, and the plumbing that turns a large language model from a demo into something 100+ teams use every sprint.',
      'Right now I am going deep on JVM internals, concurrency and system design, and building Stackcraft, a platform that teaches exactly that.',
    ],
    status: '', // e.g. 'Open to senior backend roles'. Empty hides it.
  },

  // Colours of the amber CRT look. Any CSS colour works. Keep fg/bg contrast high so the text stays readable.
  theme: {
    bg: '#14110d',
    fg: '#ffb347',
    dim: '#a07a45',
    accent: '#ffd28a',
    danger: '#ff6b5a',
    scanlines: true,
  },

  // Newest first. Add a job by copying one { ... } block.
  experience: [
    {
      company: 'Wells Fargo',
      role: 'Software Engineer',
      start: 'TODO(you)', // e.g. 'Jul 2024'
      end: 'Present',
      location: 'TODO(you)',
      summary: 'Full-stack and GenAI engineering for internal developer and data platforms.',
      highlights: [
        'Built a GenAI release-note generator now used by 100+ scrum teams, cutting manual effort by about 80% (Manager Spotlight Award).',
        'Modelled data lineage in Neo4j with Cypher and added a natural-language GenAI agent on top, reducing discovery effort by 60% and onboarding time by 40%.',
        'Exposed internal tools to autonomous agents through MCP servers, including lineage-driven impact analysis.',
        'Built a low-code data migration platform (React + Spring Boot) used by 20+ teams to move millions of records, about 5x faster than before.',
      ],
      tech: ['Java', 'Spring Boot', 'React', 'Neo4j', 'Cypher', 'MCP', 'GCP'],
    },
    {
      company: 'Wells Fargo',
      role: 'Program Associate, Data Engineering',
      start: 'TODO(you)',
      end: 'TODO(you)',
      location: 'TODO(you)',
      summary: 'Data curation and ETL pipelines.',
      highlights: [
        'Ran data curation pipelines processing 1M+ records a day.',
        'Rewrote ETL jobs in Sparkflow (Scala) and shell, making them about 40% faster.',
      ],
      tech: ['Scala', 'Spark', 'Shell', 'SQL'],
    },
  ],

  // `id` becomes the command `open <id>`. Order here = order on the site.
  projects: [
    {
      id: 'stackcraft',
      name: 'Stackcraft',
      tagline: 'A hostable learning platform for Java internals, with a live code runner.',
      description:
        'Three services: a React SPA, a Spring Boot API for content, grading and XP, and an isolated runner that compiles and runs Java with hard limits. Lessons are content as code, and every snippet is re-run on the JDK in CI so the shown output is always true.',
      highlights: [
        'SOLID / hexagonal Spring Boot 4 API with ADRs and an OpenAPI-first contract',
        'Sandboxed Java runner kept private by design (no DB, no secrets, internal only)',
        'Static offline build deployed to GitHub Pages by GitHub Actions',
      ],
      tech: ['Java 21', 'Spring Boot', 'React', 'TypeScript', 'Vite', 'GitHub Actions'],
      links: [
        { label: 'live', href: 'https://janigam.github.io/stackcraft/' },
        { label: 'source', href: 'https://github.com/JaNigam/stackcraft' },
      ],
    },
    {
      id: 'everythingcs',
      name: 'EverythingCS',
      tagline: 'A computer science learning platform with 500+ users.', // TODO(you): confirm wording
      description:
        'TODO(you): two or three sentences on what EverythingCS is, who uses it, and what you built.',
      highlights: [
        'Designed 20+ REST APIs that cut frontend latency by about 30%',
        'Built a shared component library that reduced page load by about 40%',
      ],
      tech: ['TODO(you)'],
      links: [
        // TODO(you): add { label: 'live', href: '...' } and/or { label: 'source', href: '...' }, or leave empty.
      ],
    },
  ],

  skills: [
    { group: 'Languages', items: ['Java', 'TypeScript', 'Scala', 'SQL', 'Shell'] },
    { group: 'Backend', items: ['Spring Boot', 'Microservices', 'REST', 'Kafka', 'JWT', 'Spring AI'] },
    { group: 'Data', items: ['Spark', 'Neo4j / Cypher', 'Relational DBs', 'ETL pipelines'] },
    { group: 'Platform', items: ['Docker', 'Kubernetes', 'GCP', 'Jenkins', 'Harness', 'UCD', 'GitHub Actions'] },
    { group: 'GenAI', items: ['LLM integration', 'MCP servers', 'Agents', 'Prompt design'] },
    { group: 'Frontend', items: ['React', 'Vite'] },
    { group: 'Practice', items: ['System design', 'Unit & regression testing', 'Debugging', 'CI/CD'] },
  ],

  awards: [
    {
      title: 'Manager Spotlight Award',
      issuer: 'Wells Fargo',
      year: 'TODO(you)',
      note: 'For the GenAI release-note generator adopted by 100+ teams.',
    },
  ],

  // What you are learning or writing. Newest first.
  log: [
    {
      date: 'Nov 2026',
      title: 'Stackcraft: Java Core series',
      href: 'https://janigam.github.io/stackcraft/',
      note: 'Collections, memory, strings, OOP, streams, concurrency, JVM.',
    },
    // TODO(you): add posts, notes or talks: { date: '...', title: '...', href: '...', note: '...' },
  ],

  education: [
    // TODO(you): { degree: 'B.Tech, Computer Science', school: '...', start: '2016', end: '2020' },
  ],

  contact: {
    email: '', // TODO(you): the address you want public. Empty hides it.
    links: [
      { label: 'github', href: 'https://github.com/JaNigam' },
      // TODO(you): { label: 'linkedin', href: 'https://www.linkedin.com/in/...' },
    ],
  },

  // Drop your PDF at public/resume.pdf, then set this to '/resume.pdf'. Empty hides the download everywhere.
  resume: '',

  // Hidden commands. They are not listed in `help`; finding one unlocks a quest.
  easterEggs: [
    {
      command: 'coffee',
      output: ['Brewing...', 'HTTP 418: I am a teapot. Try tea?'], // TODO(you): make it yours
    },
    {
      command: 'kafka',
      output: ['Consumer group "visitors" rebalanced.', 'Your offset has been committed. You will not see this message twice.'],
    },
  ],
};

export default config;
