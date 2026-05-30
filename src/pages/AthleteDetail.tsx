import { Link, useParams } from 'react-router-dom'
import {
  EVENTS,
  EVENT_MAP,
  EventId,
  bestTime,
  clubRecord,
  formatDelta,
  formatTime,
  getAthlete,
  leaderboardFor,
} from '../data/athletes'
import { ChampionFx, GlitchName } from '../components/Champion'

const SPRINT_EVENTS: EventId[] = ['100m', '200m']

export default function AthleteDetail() {
  const { id } = useParams()
  const athlete = id ? getAthlete(id) : undefined

  if (!athlete) {
    return (
      <section className="section">
        <div className="container">
          <h2 className="display">Athlete not found</h2>
          <Link to="/athletes" className="chip active" style={{ marginTop: 18, display: 'inline-block' }}>
            ← Back to roster
          </Link>
        </div>
      </section>
    )
  }

  const results = [...athlete.results].sort((a, b) => b.date.localeCompare(a.date))

  // "De snelste man": holds the club record on BOTH the 100m and 200m.
  const isSprintKing = SPRINT_EVENTS.every(
    (e) => clubRecord(e)?.athlete.id === athlete.id,
  )

  // Medal tally — count top-3 finishes across every event.
  const medals = EVENTS.reduce(
    (acc, ev) => {
      if (bestTime(athlete, ev.id) === undefined) return acc
      const board = leaderboardFor(ev.id)
      const pos = board.findIndex((r) => r.athlete.id === athlete.id) + 1
      if (pos === 1) acc.gold += 1
      else if (pos === 2) acc.silver += 1
      else if (pos === 3) acc.bronze += 1
      return acc
    },
    { gold: 0, silver: 0, bronze: 0 },
  )
  const hasMedals = medals.gold + medals.silver + medals.bronze > 0

  return (
    <>
      <section>
        <div className="container">
          <div className="detail-hero">
            <div className={'avatar' + (isSprintKing ? ' champ' : '')}>
              {athlete.initials}
              {isSprintKing && <ChampionFx />}
            </div>
            <div>
              <div className="eyebrow">{athlete.squad} · b. {athlete.birthYear}</div>
              {isSprintKing ? (
                <GlitchName name={athlete.name} as="h1" />
              ) : (
                <h1>{athlete.name}</h1>
              )}
              {hasMedals && (
                <div className="medal-tally">
                  {medals.gold > 0 && (
                    <span className="tally-item">
                      <span className="medal medal-1">1</span>×{medals.gold}
                    </span>
                  )}
                  {medals.silver > 0 && (
                    <span className="tally-item">
                      <span className="medal medal-2">2</span>×{medals.silver}
                    </span>
                  )}
                  {medals.bronze > 0 && (
                    <span className="tally-item">
                      <span className="medal medal-3">3</span>×{medals.bronze}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PB strip across every event */}
      <section className="section" style={{ paddingBottom: 28 }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Personal Bests
          </div>
          <div className="pb-strip">
            {EVENTS.map((ev) => {
              const t = bestTime(athlete, ev.id)
              return (
                <div className="cell" key={ev.id}>
                  <div className="ev">
                    {ev.short}
                    <small style={{ fontSize: 13 }}>m</small>
                  </div>
                  <div className={'t' + (t ? '' : ' none')}>
                    {t ? formatTime(t) : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Standing in each event */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Standing</h2>
            <span className="eyebrow">Rank &amp; gap to club record</span>
          </div>
          <div className="board">
            <div className="board-row head">
              <span className="eyebrow">Event</span>
              <span className="eyebrow">Position in club</span>
              <span className="eyebrow" style={{ textAlign: 'right' }}>
                PB
              </span>
              <span className="eyebrow gap" style={{ textAlign: 'right' }}>
                vs Record
              </span>
            </div>
            {EVENTS.map((ev) => {
              const t = bestTime(athlete, ev.id)
              if (t === undefined) return null
              const board = leaderboardFor(ev.id)
              const pos = board.findIndex((r) => r.athlete.id === athlete.id) + 1
              const rec = clubRecord(ev.id)!
              const gap = t - rec.result.time
              const isRecord = rec.athlete.id === athlete.id
              return (
                <div className="board-row" key={ev.id}>
                  <div className="rank" style={{ fontSize: 22 }}>
                    {ev.short}
                  </div>
                  <div className="athlete-name" style={{ fontSize: 15 }}>
                    {pos <= 3 && (
                      <span className={`medal medal-${pos}`} aria-label={`Rank ${pos}`}>
                        {pos}
                      </span>
                    )}
                    {pos === 1 ? '1st' : pos === 2 ? '2nd' : pos === 3 ? '3rd' : `${pos}th`} of{' '}
                    {board.length}
                    {isRecord && <span className="record-flag">★ Record</span>}
                  </div>
                  <div className="time" style={{ textAlign: 'right', fontSize: 20 }}>
                    {formatTime(t)}
                  </div>
                  <div className="gap">{isRecord ? '—' : formatDelta(gap)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Full results log */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Results Log</h2>
          </div>
          <div className="board results">
            <div className="board-row head">
              <span className="eyebrow">Event</span>
              <span className="eyebrow">Meet</span>
              <span className="eyebrow" style={{ textAlign: 'right' }}>
                Time
              </span>
              <span className="eyebrow" style={{ textAlign: 'right' }}>
                Avg Speed
              </span>
              <span className="eyebrow gap" style={{ textAlign: 'right' }}>
                Date
              </span>
            </div>
            {results.map((r, i) => {
              const metres = parseFloat(EVENT_MAP[r.event].short) || 0
              const ms = metres / r.time // metres per second
              const kmh = ms * 3.6
              return (
                <div className="board-row" key={i}>
                  <div className="rank" style={{ fontSize: 20 }}>
                    {r.event}
                  </div>
                  <div className="athlete-name" style={{ fontSize: 15 }}>
                    {r.meet ?? '—'}
                  </div>
                  <div className="time" style={{ textAlign: 'right', fontSize: 20 }}>
                    {formatTime(r.time)}
                  </div>
                  <div className="speed">
                    <span className="speed-main">{kmh.toFixed(1)} km/h</span>
                    <span className="speed-sub">{ms.toFixed(2)} m/s</span>
                  </div>
                  <div className="gap mono">{r.date}</div>
                </div>
              )
            })}
          </div>
          <Link
            to="/athletes"
            className="chip"
            style={{ marginTop: 22, display: 'inline-block' }}
          >
            ← Back to roster
          </Link>
        </div>
      </section>
    </>
  )
}
