import { Link, useParams } from 'react-router-dom'
import {
  EVENTS,
  bestTime,
  clubRecord,
  formatDelta,
  formatTime,
  getAthlete,
  leaderboardFor,
} from '../data/athletes'

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

  return (
    <>
      <section>
        <div className="container">
          <div className="detail-hero">
            <div className="avatar">{athlete.initials}</div>
            <div>
              <div className="eyebrow">{athlete.squad} · b. {athlete.birthYear}</div>
              <h1>{athlete.name}</h1>
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
          <div className="board">
            <div className="board-row head">
              <span className="eyebrow">Event</span>
              <span className="eyebrow">Meet</span>
              <span className="eyebrow" style={{ textAlign: 'right' }}>
                Time
              </span>
              <span className="eyebrow gap" style={{ textAlign: 'right' }}>
                Date
              </span>
            </div>
            {results.map((r, i) => (
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
                <div className="gap mono">{r.date}</div>
              </div>
            ))}
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
