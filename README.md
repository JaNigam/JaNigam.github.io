# janigam.github.io

My portfolio, built as a terminal you can play. Visitors type commands (`help`, `about`, `open stackcraft`,
`sudo hire`) and unlock quests as they explore. A plain **page view** shows the same content as a normal,
scannable page for recruiters and phones.

Live: https://janigam.github.io (after the first deploy)

## Edit your content: one file

Everything personal lives in **[`src/portfolio.config.ts`](src/portfolio.config.ts)**: bio, jobs, projects, skills,
awards, learning log, contact links, resume, easter eggs and theme colours. Both views and every terminal command
are generated from it.

| I want to...           | Do this in `portfolio.config.ts`                                                        |
| ---------------------- | --------------------------------------------------------------------------------------- |
| Add a job              | Copy one `{ ... }` block in `experience` and edit it. Newest first.                     |
| Add a project          | Copy a block in `projects`. Its `id` becomes the command `open <id>`.                   |
| Add a resume           | Put the PDF at `public/resume.pdf` and set `resume: '/resume.pdf'`.                     |
| Show my email          | Set `contact.email`. Empty string hides it everywhere.                                  |
| Add a hidden command   | Add `{ command: 'coffee', output: ['...'] }` to `easterEggs`.                           |
| Change colours         | Edit `theme`. Keep enough contrast between `fg` and `bg`.                               |

Lines marked `TODO(you)` are placeholders. They are hidden on the site until you replace them, and a test fails
if one ever leaks into the output. Search the file for `TODO(you)` to find them all.

If you mistype a field name, VS Code underlines it in red and `npm run build` fails at that line: the type in
[`src/config/types.ts`](src/config/types.ts) checks the file the same way a Java compiler checks a record.

## Run it locally

Needs Node 24.

```bash
npm ci          # install exact dependency versions from package-lock.json
npm run dev     # http://localhost:5180, reloads on save
npm test        # unit tests for the terminal engine
npm run build   # type-check + production build into dist/
```

## How it is built

```
src/
  portfolio.config.ts     <- your content (the only file you edit)
  config/types.ts         <- the shape of the config
  terminal/engine.ts      <- commands, Tab completion, "did you mean" (pure TS, unit-tested)
  terminal/quests.ts      <- the quest list, derived from the config
  terminal/Terminal.tsx   <- the terminal view (boot sequence, prompt, quest log, toasts)
  page/PageView.tsx       <- the plain page view
  styles.css              <- amber CRT theme; all motion is off under prefers-reduced-motion
```

Commands return data (lines of text segments), never DOM. React draws it. That is why `engine.test.ts` can test
every command without a browser, and why CI can stop a broken config from going live.

## Deploy

GitHub Actions builds and publishes the site to GitHub Pages on every push to `main`. The workflow lives in
`.github/workflows/deploy.yml`, and [docs/DEPLOY.md](docs/DEPLOY.md) explains it line by line.
