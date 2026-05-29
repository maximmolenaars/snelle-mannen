# SNELLE MANNEN — Track Club Leaderboard

A dark, futuristic React app for showcasing your running club: club records,
per-event rankings, athlete profiles, and a deltas page for visual head-to-head
comparisons (100m / 200m / 400m and more).

Built with **Vite + React + TypeScript**, charts via **recharts**, routing via
**react-router-dom**. Art direction: dark mode, Anton display type, volt accent,
monospace race times — Nike / adidas energy.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Pages

| Route          | What it shows                                                        |
| -------------- | -------------------------------------------------------------------- |
| `/`            | Hero, **club records** grid, and a per-event **rankings** board      |
| `/athletes`    | The roster — every runner with their sprint PBs                      |
| `/athletes/:id`| One athlete: PB strip, standing vs club record, full results log     |
| `/deltas`      | Compare athletes — grouped bar charts + **head-to-head** delta bars  |

## Updating the data

**You only ever edit one file:** [`src/data/athletes.json`](src/data/athletes.json).

- Times are stored in **seconds**. A 100m in `10.84` → `10.84`.
  For events with minutes, convert: `4:05.30` → `245.30` (4×60 + 5.30).
- Add an athlete by appending an object to the `athletes` array. Each has `id`
  (url-safe slug, must be unique), `name`, `initials`, `birthYear`, `squad`, and
  a `results` list. Each result is `{ event, time, date, meet }`.
- The `event` value on a result must match an `id` from the `events` array.
- To add a new event type, add an entry to the `events` array (`id`, `name`,
  `short`, `group` — one of `sprint`/`middle`/`long`). Sprint events appear in
  the Deltas head-to-head; the track works for any event.

Types and all leaderboard logic live in
[`src/data/athletes.ts`](src/data/athletes.ts), which just reads the JSON — you
don't need to touch it.

Everything else (records, rankings, gaps, deltas) is derived automatically.

## Customising the look

The whole design system lives in CSS variables at the top of
[`src/index.css`](src/index.css) — change `--volt`, `--bg`, fonts, etc. in one
place to re-skin the app.
