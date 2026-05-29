import { useMemo, useState } from 'react'
import {
  ATHLETES,
  EVENTS,
  EventId,
  bestTime,
  formatDelta,
  formatTime,
  getAthlete,
  leaderboardFor,
} from '../data/athletes'

const PALETTE = ['#d7ff1e', '#19e0ff', '#ff2d78', '#ff6b1a', '#a78bfa', '#34d399', '#f43f5e', '#38bdf8']

// Horizontal lanes (in %) — a centre-out zigzag so cars never stack.
const LANES = [50, 30, 70, 22, 78, 40, 60, 50]

// Stable colour per athlete (doesn't shift when selection changes).
const colorOf = (id: string) =>
  PALETTE[Math.max(0, ATHLETES.findIndex((a) => a.id === id)) % PALETTE.length]

export default function Deltas() {
  const [event, setEvent] = useState<EventId>('100m')
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ATHLETES.map((a) => a.id)),
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Ranked field for the chosen event, limited to selected athletes.
  const rows = useMemo(
    () => leaderboardFor(event).filter((r) => selected.has(r.athlete.id)),
    [event, selected],
  )
  const leader = rows[0]
  const maxDelta = rows.length ? rows[rows.length - 1].result.time - leader.result.time : 0

  // Position cars: fastest at the finish (top), gap grows downward.
  const TOP_MIN = 16
  const TOP_MAX = 86
  const placed = rows.map((row, i) => {
    const delta = row.result.time - leader.result.time
    const top = maxDelta > 0 ? TOP_MIN + (delta / maxDelta) * (TOP_MAX - TOP_MIN) : TOP_MIN
    const left = LANES[i % LANES.length]
    return { ...row, delta, top, left }
  })

  // Head-to-head: pick any two athletes, compared across every event.
  const [aId, setAId] = useState(ATHLETES[0].id)
  const [bId, setBId] = useState(ATHLETES[1].id)
  const athA = getAthlete(aId)!
  const athB = getAthlete(bId)!

  const h2h = useMemo(() => {
    // Bar length = time, so the slower athlete has the longer bar and the
    // faster one is shorter. Gaps are tiny in %, so exaggerate to stay readable.
    const widthFor = (t: number, slowest: number) => {
      const rel = (slowest - t) / slowest // 0 for the slower athlete
      const shrink = Math.min(rel * 2500, 68) // amplify, capped
      return 100 - shrink
    }
    return EVENTS.map((e) => {
      const ta = bestTime(athA, e.id)
      const tb = bestTime(athB, e.id)
      if (ta === undefined || tb === undefined) return null
      const slow = Math.max(ta, tb)
      return {
        e,
        ta,
        tb,
        wa: widthFor(ta, slow),
        wb: widthFor(tb, slow),
        delta: ta - tb,
      }
    }).filter((x): x is NonNullable<typeof x> => x !== null)
  }, [athA, athB])

  const ev = EVENTS.find((e) => e.id === event)!

  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Compare · Gaps On Track</div>
        <div className="section-head">
          <h2>Head 2 Head</h2>
          <span className="eyebrow">Distance = time gap to the leader</span>
        </div>

        {/* Event selector */}
        <div className="field" style={{ marginBottom: 18 }}>
          <label className="eyebrow">Event</label>
          <div className="chips">
            {EVENTS.map((e) => (
              <button
                key={e.id}
                className={'chip' + (e.id === event ? ' active' : '')}
                onClick={() => setEvent(e.id)}
              >
                {e.short}m
              </button>
            ))}
          </div>
        </div>

        {/* Athlete selector */}
        <div className="field" style={{ marginBottom: 24 }}>
          <label className="eyebrow">On track ({rows.length})</label>
          <div className="chips">
            {ATHLETES.map((a) => {
              const on = selected.has(a.id)
              const hasTime = bestTime(a, event) !== undefined
              return (
                <button
                  key={a.id}
                  className={'chip' + (on ? ' active' : '')}
                  onClick={() => toggle(a.id)}
                  style={
                    on
                      ? { background: colorOf(a.id), borderColor: colorOf(a.id), color: '#000' }
                      : !hasTime
                        ? { opacity: 0.45 }
                        : undefined
                  }
                  title={hasTime ? a.name : `${a.name} — no ${event} time`}
                >
                  {a.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* The track */}
        <div className="track">
          <div className="finish" />
          <div className="finish-tag eyebrow">
            Finish · {ev.name} — lower is faster
          </div>

          {placed.length === 0 && (
            <div className="track-empty">Select athletes with a {ev.short}m time</div>
          )}

          {placed.map((p, i) => (
            <div
              key={p.athlete.id}
              className={'runner' + (i === 0 ? ' leader' : '')}
              style={{ top: `${p.top}%`, left: `${p.left}%`, ['--c' as string]: colorOf(p.athlete.id) }}
            >
              <div className="pin-avatar" title={p.athlete.name}>
                {p.athlete.initials}
              </div>
              <div className="pin-time">
                {i === 0 ? formatTime(p.result.time) : `+ ${p.delta.toFixed(3)}`}
              </div>
              <div className="pin-name">{p.athlete.name}</div>
            </div>
          ))}
        </div>

        {/* Head-to-head across all events */}
        <div className="section-head" style={{ marginTop: 56 }}>
          <h2>Event&nbsp;Breakdown</h2>
          <span className="eyebrow">{athA.name} vs {athB.name}</span>
        </div>

        {/* Pick the two athletes to compare */}
        <div className="h2h-pick">
          <div className="field">
            <label className="eyebrow" style={{ color: colorOf(aId) }}>
              ● Athlete A
            </label>
            <div className="chips">
              {ATHLETES.map((a) => (
                <button
                  key={a.id}
                  className={'chip' + (a.id === aId ? ' active' : '')}
                  disabled={a.id === bId}
                  onClick={() => setAId(a.id)}
                  style={
                    a.id === aId
                      ? { background: colorOf(a.id), borderColor: colorOf(a.id), color: '#000' }
                      : undefined
                  }
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="eyebrow" style={{ color: colorOf(bId) }}>
              ● Athlete B
            </label>
            <div className="chips">
              {ATHLETES.map((a) => (
                <button
                  key={a.id}
                  className={'chip' + (a.id === bId ? ' active' : '')}
                  disabled={a.id === aId}
                  onClick={() => setBId(a.id)}
                  style={
                    a.id === bId
                      ? { background: colorOf(a.id), borderColor: colorOf(a.id), color: '#000' }
                      : undefined
                  }
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h2h">
          {h2h.length === 0 && (
            <div className="h2h-row">
              <span />
              <span style={{ color: 'var(--text-faint)' }}>
                No shared events between these two athletes.
              </span>
              <span />
            </div>
          )}
          {h2h.map(({ e, ta, tb, wa, wb, delta }) => {
            const aFaster = delta < 0
            return (
              <div className="h2h-row" key={e.id}>
                <div className="h2h-ev">{e.short}</div>
                <div className="h2h-bars">
                  <div className="h2h-bar-track">
                    <span className="h2h-bar-name">{athA.name}</span>
                    <div
                      className={'h2h-bar' + (aFaster ? ' win' : '')}
                      style={{ width: `${wa}%`, background: colorOf(aId), color: colorOf(aId) }}
                    />
                    <span className="h2h-bar-time">{formatTime(ta)}</span>
                  </div>
                  <div className="h2h-bar-track">
                    <span className="h2h-bar-name">{athB.name}</span>
                    <div
                      className={'h2h-bar' + (!aFaster ? ' win' : '')}
                      style={{ width: `${wb}%`, background: colorOf(bId), color: colorOf(bId) }}
                    />
                    <span className="h2h-bar-time">{formatTime(tb)}</span>
                  </div>
                </div>
                <div className="h2h-delta">
                  <div className="d" style={{ color: aFaster ? colorOf(aId) : colorOf(bId) }}>
                    {formatDelta(Math.abs(delta) * (aFaster ? -1 : 1))}
                  </div>
                  <div className="l">{aFaster ? athA.initials : athB.initials} ahead</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
