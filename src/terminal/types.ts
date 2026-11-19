// What a command prints. A command never touches the DOM: it returns data, and the React layer draws it.
// That split is the same idea as a Spring @Service returning a DTO and the controller/view deciding how to render it,
// and it is what lets engine.test.ts test every command without a browser.

export type Tone = 'accent' | 'dim' | 'bold' | 'danger' | 'ok' | 'heading' | 'bullet';

/** One piece of a line: plain text, or text with a tone, a link, or a command it runs when clicked. */
export type Segment = string | { text: string; tone?: Tone; href?: string; run?: string };

/** A printed line is a list of segments. An empty array prints a blank line. */
export type Line = Segment[];

export type Effect =
  | { type: 'clear' }
  | { type: 'view'; view: 'page' }
  | { type: 'open'; href: string };

export interface CommandResult {
  lines: Line[];
  effects?: Effect[];
  /** Quest events this command produced (see quests.ts). */
  events?: string[];
}
