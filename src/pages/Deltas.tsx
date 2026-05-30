import { useEffect, useMemo, useState } from 'react'
import {
  ATHLETES,
  EVENTS,
  EventId,
  RankedResult,
  bestTime,
  formatDelta,
  formatTime,
  getAthlete,
  leaderboardFor,
} from '../data/athletes'

const PALETTE = ['#d7ff1e', '#19e0ff', '#ff2d78', '#ff6b1a', '#a78bfa', '#34d399', '#f43f5e', '#38bdf8']

// Horizontal lanes (in %) — a centre-out zigzag so cars never stack.
const LANES = [50, 30, 70, 22, 78, 40, 60, 50]

// Easter egg: world-record guests you can drop into the race, by distance (m).
const GUEST_ID = '__wr_guest__'
interface Guest {
  name: string
  initials: string
  time: number
  img: string
  fallback: string
  color: string
  textOn: string
  date: string
  meet: string
}
const WR_GUESTS: Record<number, Guest> = {
  100: { name: 'Usain Bolt', initials: 'UB', time: 9.58, img: '/usain-bolt.jpg', fallback: '/usain-bolt.svg', color: '#FED100', textOn: '#000', date: '2009-08-16', meet: 'WR · Berlin' },
  200: { name: 'Usain Bolt', initials: 'UB', time: 19.19, img: '/usain-bolt.jpg', fallback: '/usain-bolt.svg', color: '#FED100', textOn: '#000', date: '2009-08-20', meet: 'WR · Berlin' },
  400: { name: 'Wayde van Niekerk', initials: 'WN', time: 43.03, img: '/wayde-van-niekerk.jpg', fallback: '/wayde-van-niekerk.svg', color: '#007A4D', textOn: '#fff', date: '2016-08-14', meet: 'WR · Rio' },
}

// Confetti burst — fixed particle layout (angle/distance/colour) so it never
// re-randomises between renders.
const CONFETTI = Array.from({ length: 14 }, (_, k) => {
  const angle = (k / 14) * Math.PI * 2 + (k % 2 ? 0.35 : -0.25)
  const dist = 30 + (k % 3) * 12
  const colors = ['#d7ff1e', '#19e0ff', '#ff2d78', '#ff6b1a', '#a78bfa', '#34d399', '#ffffff']
  return {
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
    rot: (k * 67) % 360,
    color: colors[k % colors.length],
    w: k % 3 === 0 ? 5 : 7,
    h: k % 2 === 0 ? 8 : 5,
    stagger: (k % 5) * 22,
  }
})

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

  // --- Full-screen "true distance" view -------------------------------------
  // Convert each time gap into the real distance (in metres) the athlete would
  // be behind P1 at the moment P1 crosses the line: gap_m = leaderSpeed * delta.
  const [expanded, setExpanded] = useState(false)
  const [racing, setRacing] = useState(false)
  const evRef = EVENTS.find((e) => e.id === event)!
  const raceMeters = parseFloat(evRef.short) || 0
  const leaderSpeed = leader ? raceMeters / leader.result.time : 0 // m/s

  const PX_PER_M = 70 // vertical scale of the expanded track
  const LEADER_Y = 150 // px from the top where the finish line / P1 sits

  const placedTrue = rows.map((row, i) => {
    const delta = row.result.time - leader.result.time
    const metres = leaderSpeed * delta
    const y = LEADER_Y + metres * PX_PER_M
    const left = LANES[i % LANES.length]
    return { ...row, delta, metres, y, left }
  })
  const maxMetres = placedTrue.length
    ? placedTrue[placedTrue.length - 1].metres
    : 0
  const trackTall = LEADER_Y + maxMetres * PX_PER_M + 200

  // Distance gridlines every "step" metres.
  const gridStep =
    maxMetres <= 4 ? 1 : maxMetres <= 12 ? 2 : maxMetres <= 30 ? 5 : maxMetres <= 80 ? 10 : 25
  const gridLines: number[] = []
  for (let m = gridStep; m <= maxMetres + gridStep; m += gridStep) gridLines.push(m)

  // Close the modal on Escape.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [expanded])

  // Reset to the map view whenever the modal is closed.
  useEffect(() => {
    if (!expanded) setRacing(false)
  }, [expanded])

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

          {placed.length > 0 && (
            <button
              className="track-expand"
              onClick={() => setExpanded(true)}
              title="Open full-screen true-distance view"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              Expand
            </button>
          )}

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

        {/* Full-screen true-distance view */}
        {expanded && (
          <div className="track-modal" role="dialog" aria-modal="true">
            <div className="track-modal-head">
              <div>
                <div className="eyebrow">
                  {racing
                    ? 'Race · ready, set, go'
                    : 'True Distance · gap behind P1 in metres'}
                </div>
                <h3 className="display">{evRef.name}</h3>
              </div>
              <div className="track-modal-actions">
                <button
                  className={'track-race-btn' + (racing ? ' on' : '')}
                  onClick={() => setRacing((r) => !r)}
                >
                  {racing ? '◂ Map view' : '▸ Race'}
                </button>
                <button
                  className="track-modal-close"
                  onClick={() => setExpanded(false)}
                  aria-label="Close"
                  title="Close (Esc)"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="track-modal-scroll">
              {racing ? (
                <RaceView key={event} rows={rows} meters={raceMeters} event={event} />
              ) : (
                <div className="track track-tall" style={{ height: trackTall }}>
                  {/* finish line sits where P1 crossed (0 m) */}
                  <div className="finish" style={{ top: LEADER_Y, transform: 'translateY(-50%)' }} />
                  <div className="dist-label finish-zero" style={{ top: LEADER_Y }}>
                    0 m · P1
                  </div>

                  {/* distance gridlines */}
                  {gridLines.map((m) => (
                    <div key={m} className="dist-grid" style={{ top: LEADER_Y + m * PX_PER_M }}>
                      <span className="dist-grid-label">{m} m</span>
                    </div>
                  ))}

                  {placedTrue.map((p, i) => (
                    <div
                      key={p.athlete.id}
                      className={'runner' + (i === 0 ? ' leader' : '')}
                      style={{ top: p.y, left: `${p.left}%`, ['--c' as string]: colorOf(p.athlete.id) }}
                    >
                      <div className="pin-avatar" title={p.athlete.name}>
                        {p.athlete.initials}
                      </div>
                      <div className="pin-time">
                        {i === 0 ? formatTime(p.result.time) : `+ ${p.delta.toFixed(3)}`}
                      </div>
                      <div className="pin-name">
                        {p.athlete.name}
                        {i > 0 && (
                          <span className="pin-metres"> · {p.metres.toFixed(2)} m back</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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

// ---------------------------------------------------------------------------
//  RaceView — READY/SET/GO, then everyone runs to the finish in their REAL time
//  (an 11.25s 100m literally takes 11.25s), so the finishing gaps are the true
//  gaps. Horizontal lanes on wide screens, bottom-to-top columns on mobile.
// ---------------------------------------------------------------------------
function RaceView({
  rows,
  meters,
  event,
}: {
  rows: RankedResult[]
  meters: number
  event: EventId
}) {
  const [phase, setPhase] = useState<'ready' | 'set' | 'go' | 'run' | 'done'>('ready')
  const [runId, setRunId] = useState(0)
  const [clock, setClock] = useState(0) // stopwatch seconds
  const [speed, setSpeed] = useState(1) // playback multiplier
  const showSpeed = meters >= 400 // long events only
  const cycleSpeed = () => setSpeed((s) => (s >= 8 ? 1 : s * 2))

  // Switch to the vertical (bottom-to-top) layout on narrow screens.
  const [vertical, setVertical] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = () => setVertical(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Easter egg: drop the event's world-record holder into the race.
  const guest = WR_GUESTS[meters]
  const canGuest = !!guest
  const [guestOn, setGuestOn] = useState(false)
  const toggleGuest = () => {
    setGuestOn((b) => !b)
    setRunId((x) => x + 1) // restart so they line up from the gun
  }

  const racers: RankedResult[] =
    guestOn && guest
      ? [
          ...rows,
          {
            athlete: {
              id: GUEST_ID,
              name: guest.name,
              initials: guest.initials,
              birthYear: 0,
              squad: '',
              results: [],
            },
            result: { event, time: guest.time, date: guest.date, meet: guest.meet },
          },
        ].sort((a, b) => a.result.time - b.result.time)
      : rows

  const leaderTime = racers[0]?.result.time ?? 0
  const data = racers.map((r) => ({ ...r, delta: r.result.time - leaderTime }))
  const raceColor = (id: string) => (id === GUEST_ID && guest ? guest.color : colorOf(id))
  const avatarInner = (r: RankedResult) =>
    r.athlete.id === GUEST_ID && guest ? (
      <img
        className="guest-img"
        src={guest.img}
        alt={guest.name}
        onError={(e) => {
          const t = e.currentTarget
          if (!t.dataset.fb) {
            t.dataset.fb = '1'
            t.src = guest.fallback
          }
        }}
      />
    ) : (
      r.athlete.initials
    )

  // True time: each runner takes their actual result, sped up by the multiplier.
  const durMs = (t: number) => (t * 1000) / speed
  const slowestTime = data.length ? data[data.length - 1].result.time : 0
  const lastFinish = durMs(slowestTime)
  const GO_DELAY = 2500 // ready + set + go before the runners move

  // Distance markers along the track — interval scaled to the event.
  const gridStep =
    meters <= 100 ? 10 : meters <= 150 ? 25 : meters <= 200 ? 40 : meters <= 400 ? 100 : meters <= 800 ? 200 : meters <= 1500 ? 500 : 1000
  const markers: number[] = []
  if (meters > 0) for (let m = gridStep; m < meters; m += gridStep) markers.push(m)
  const posPct = (m: number) => 5 + (m / meters) * 87 // horizontal: 5% → 92%
  const vPosPct = (m: number) => 86 - (m / meters) * 72 // vertical: 86% → 14%

  useEffect(() => {
    setPhase('ready')
    setClock(0)
    const t: number[] = []
    t.push(window.setTimeout(() => setPhase('set'), 900))
    t.push(window.setTimeout(() => setPhase('go'), 1800))
    t.push(window.setTimeout(() => setPhase('run'), GO_DELAY))
    t.push(window.setTimeout(() => setPhase('done'), GO_DELAY + lastFinish + 600))
    return () => t.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, lastFinish])

  // Stopwatch: count up from GO (sped up by the multiplier so it still shows the
  // real race time), and freeze the instant the last athlete finishes.
  useEffect(() => {
    if (phase !== 'run') return
    const start = performance.now()
    let raf = 0
    const tick = () => {
      const el = ((performance.now() - start) / 1000) * speed
      if (el >= slowestTime) {
        setClock(slowestTime) // freeze on the last finisher
        return
      }
      setClock(el)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, slowestTime, speed])

  const running = phase === 'run' || phase === 'done'
  // Results show each athlete's actual finish time.
  const resultText = (r: (typeof data)[number]) => formatTime(r.result.time)

  // Confetti that pops around an avatar exactly when it crosses the line.
  const burst = (finishDelay: number) =>
    running ? (
      <span className="confetti" aria-hidden="true">
        {CONFETTI.map((p, k) => (
          <i
            key={k}
            className="confetti-piece"
            style={{
              ['--tx' as string]: `${p.tx}px`,
              ['--ty' as string]: `${p.ty}px`,
              ['--rot' as string]: `${p.rot}deg`,
              background: p.color,
              width: p.w,
              height: p.h,
              animationDelay: `${finishDelay + p.stagger}ms`,
            }}
          />
        ))}
      </span>
    ) : null
  const fmtClock = (s: number) => {
    if (s >= 60) {
      const m = Math.floor(s / 60)
      return `${m}:${(s - m * 60).toFixed(2).padStart(5, '0')}`
    }
    return s.toFixed(2)
  }

  return (
    <div className={'race' + (running ? ' running' : '') + (vertical ? ' vertical' : '')}>
      {(phase === 'ready' || phase === 'set' || phase === 'go') && (
        <div className={`race-count ${phase}`} key={`${phase}-${runId}`}>
          {phase.toUpperCase()}
        </div>
      )}

      <div className="race-clockbar">
        <div className={'race-clock' + (phase === 'done' ? ' stopped' : '')}>
          {fmtClock(clock)}
          <span className="race-clock-unit">s</span>
        </div>
        {showSpeed && (
          <button
            className={'race-speed' + (speed > 1 ? ' on' : '')}
            onClick={cycleSpeed}
            title="Tap to change playback speed"
          >
            {speed}×
          </button>
        )}
        {canGuest && guest && (
          <button
            className={'race-guest' + (guestOn ? ' on' : '')}
            onClick={toggleGuest}
            title="Add the world record holder"
            style={
              guestOn
                ? { background: guest.color, borderColor: guest.color, color: guest.textOn }
                : undefined
            }
          >
            {guestOn ? `✓ ${guest.name}` : `+ Add ${guest.name}`}
          </button>
        )}
      </div>

      {vertical ? (
        /* ---------- Mobile: bottom-to-top columns ---------- */
        <div className="vrace-track">
          <div className="vrace-finish" />
          <div className="vrace-finish-tag eyebrow">Finish</div>
          {markers.map((m) => (
            <div key={`g${m}`} className="vrace-grid" style={{ top: `${vPosPct(m)}%` }}>
              <span className="vrace-grid-label">{m}m</span>
            </div>
          ))}
          {data.map((r, i) => (
            <div
              key={r.athlete.id}
              className={'vrace-runner' + (i === 0 ? ' leader' : '')}
              style={{
                // spread columns within an inset band so edge runners aren't clipped
                left: `${50 + (((i + 0.5) / data.length) - 0.5) * 84}%`,
                top: running ? '14%' : '86%',
                transition: running ? `top ${durMs(r.result.time)}ms linear` : 'none',
                ['--c' as string]: raceColor(r.athlete.id),
              }}
            >
              <span className="vrace-trail" />
              <span className={'race-ava' + (r.athlete.id === GUEST_ID ? ' guest' : '')}>
                {burst(durMs(r.result.time))}
                {avatarInner(r)}
              </span>
              <span
                className="vrace-delta"
                style={{
                  opacity: running ? 1 : 0,
                  transitionDelay: running ? `${durMs(r.result.time)}ms` : '0ms',
                  color: i === 0 ? 'var(--volt)' : raceColor(r.athlete.id),
                }}
              >
                {resultText(r)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* ---------- Desktop: left-to-right lanes ---------- */
        <div className="race-lanes">
          <div className="race-lane race-ruler-row" aria-hidden="true">
            <div className="race-rank" />
            <div className="race-ruler-strip">
              {markers.map((m) => (
                <span key={`r${m}`} className="ruler-label" style={{ left: `${posPct(m)}%` }}>
                  {m}m
                </span>
              ))}
            </div>
            <div />
          </div>
          {data.map((r, i) => (
            <div className="race-lane" key={r.athlete.id}>
              <div className="race-rank">{i + 1}</div>
              <div className="race-strip">
                <span className="race-start" />
                <span className="race-finish" />
                {markers.map((m) => (
                  <span key={`s${m}`} className="strip-grid" style={{ left: `${posPct(m)}%` }} />
                ))}
                <div
                  className={'race-runner' + (i === 0 ? ' leader' : '')}
                  style={{
                    left: running ? '92%' : '5%',
                    transition: running ? `left ${durMs(r.result.time)}ms linear` : 'none',
                    ['--c' as string]: raceColor(r.athlete.id),
                  }}
                >
                  <span className="race-trail" />
                  <span className={'race-ava' + (r.athlete.id === GUEST_ID ? ' guest' : '')}>
                    {burst(durMs(r.result.time))}
                    {avatarInner(r)}
                  </span>
                </div>
              </div>
              <div className="race-info">
                <div className="race-name">{r.athlete.name}</div>
                <div
                  className="race-delta"
                  style={{
                    opacity: running ? 1 : 0,
                    transitionDelay: running ? `${durMs(r.result.time)}ms` : '0ms',
                    color: i === 0 ? 'var(--volt)' : raceColor(r.athlete.id),
                  }}
                >
                  {resultText(r)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'done' && (
        <button className="race-replay" onClick={() => setRunId((x) => x + 1)}>
          ↻ Replay
        </button>
      )}
    </div>
  )
}
