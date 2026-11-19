// The shape of portfolio.config.ts. You normally never edit this file: it only exists so TypeScript can tell you,
// while you type in the config, that a field is missing or misspelled (the same job a Java record or a Spring
// @ConfigurationProperties class does for application.yml).

export interface Link {
  label: string;
  href: string;
}

export interface Job {
  company: string;
  role: string;
  /** Free text, shown as written. "Jan 2022" or "2022" both work. */
  start: string;
  /** Use "Present" for your current role. */
  end: string;
  location?: string;
  /** One sentence on what the role was about. */
  summary?: string;
  /** 2 to 4 bullets. Lead with what YOU did, end with the result. */
  highlights: string[];
  tech?: string[];
}

export interface Project {
  /** Lowercase slug, no spaces. Becomes the terminal command `open <id>` and the folder name in `ls projects`. */
  id: string;
  name: string;
  /** One line, shown in lists. */
  tagline: string;
  /** A short paragraph, shown when the project is opened. */
  description: string;
  highlights?: string[];
  tech: string[];
  links?: Link[];
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Award {
  title: string;
  issuer: string;
  year?: string;
  note?: string;
}

export interface LogEntry {
  /** Free text, e.g. "Nov 2026". */
  date: string;
  title: string;
  href?: string;
  note?: string;
}

export interface Education {
  degree: string;
  school: string;
  start?: string;
  end?: string;
  note?: string;
}

export interface EasterEgg {
  /** The exact command a visitor has to type, e.g. "coffee". */
  command: string;
  /** Lines printed back. */
  output: string[];
}

export interface Theme {
  /** Screen background. */
  bg: string;
  /** Main text (the phosphor colour). */
  fg: string;
  /** Secondary text: dates, hints, borders. */
  dim: string;
  /** Highlights: links, prompt, unlocked quests. */
  accent: string;
  /** Errors such as "command not found". */
  danger: string;
  /** Faint CRT scanlines over the screen. */
  scanlines: boolean;
}

export interface PortfolioConfig {
  site: {
    /** Browser tab title. */
    title: string;
    /** Shown in search results and link previews. */
    description: string;
  };
  person: {
    name: string;
    /** Used in the prompt: <handle>@<host>:~$ */
    handle: string;
    host: string;
    headline: string;
    location?: string;
    /** One short paragraph per entry. */
    about: string[];
    /** Optional status line, e.g. "Open to senior backend roles". Leave empty to hide. */
    status?: string;
  };
  theme: Theme;
  experience: Job[];
  projects: Project[];
  skills: SkillGroup[];
  awards: Award[];
  log: LogEntry[];
  education: Education[];
  contact: {
    /** Leave empty ("") to hide the email everywhere. */
    email: string;
    links: Link[];
  };
  /** Path of your resume inside the public/ folder, e.g. "/resume.pdf". Empty string hides the download. */
  resume: string;
  easterEggs: EasterEgg[];
}
