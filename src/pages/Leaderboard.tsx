import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ATHLETES,
  EVENTS,
  EventId,
  FIELD_EVENTS,
  clubRecord,
  fieldLeaderboard,
  formatDelta,
  formatMark,
  formatTime,
  leaderboardFor,
} from '../data/athletes'
import { ChampionFx, GlitchName } from '../components/Champion'

export default function Leaderboard() {
  const [event, setEvent] = useState<EventId>('100m')
  const navigate = useNavigate()

  const rows = useMemo(() => leaderboardFor(event), [event])
  const leader = rows[0]

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="eyebrow">Track &amp; Field · Club Leaderboard</div>
          <h1 className="display" style={{ marginTop: 18 }}>
            Built
            <br />
            <span className="volt">To Be</span> <span className="stroke">Fast</span>
          </h1>
          <p className="hero-sub">
            Every personal best, every club record, every margin between you and
            the front. This is where the squad's fastest times live.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">{ATHLETES.length}</div>
              <div className="lbl eyebrow">Athletes</div>
            </div>
            <div className="hero-stat">
              <div className="num">{EVENTS.length}</div>
              <div className="lbl eyebrow">Events</div>
            </div>
            <div className="hero-stat">
              <div className="num mono">
                {formatTime(clubRecord('100m')?.result.time ?? 0)}
              </div>
              <div className="lbl eyebrow">100m Record</div>
            </div>
          </div>
        </div>
      </section>

      {/* Club records grid */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>De Snelste Man</h2>
            <span className="eyebrow">The fastest ever, per event</span>
          </div>
          <div className="grid">
            {EVENTS.map((ev) => {
              const rec = clubRecord(ev.id)
              return (
                <div
                  key={ev.id}
                  className="rec-card"
                  onClick={() => setEvent(ev.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ev">
                    {ev.short}
                    <small>m</small>
                  </div>
                  {rec ? (
                    <>
                      <div className="rec-time mono">{formatTime(rec.result.time)}</div>
                      <div className="rec-holder">{rec.athlete.name}</div>
                      <div className="rec-when">
                        {rec.result.meet ?? '—'} · {rec.result.date}
                      </div>
                    </>
                  ) : (
                    <div className="rec-time mono" style={{ color: 'var(--text-faint)' }}>
                      —
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Per-event leaderboard */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Rankings</h2>
          </div>

          <div className="chips" style={{ marginBottom: 22 }}>
            {EVENTS.map((ev) => (
              <button
                key={ev.id}
                className={'chip' + (ev.id === event ? ' active' : '')}
                onClick={() => setEvent(ev.id)}
              >
                {ev.short}m
              </button>
            ))}
          </div>

          <div className="board">
            <div className="board-row head">
              <span className="eyebrow">Pos</span>
              <span className="eyebrow">Athlete</span>
              <span className="eyebrow" style={{ textAlign: 'right' }}>
                Time
              </span>
              <span className="eyebrow gap" style={{ textAlign: 'right' }}>
                Gap
              </span>
            </div>

            {rows.length === 0 && (
              <div className="board-row">
                <span />
                <span style={{ color: 'var(--text-faint)' }}>No results recorded yet.</span>
              </div>
            )}

            {rows.map((row, i) => {
              const gap = leader ? row.result.time - leader.result.time : 0
              return (
                <div
                  key={row.athlete.id}
                  className={`board-row clickable r${i + 1}`}
                  onClick={() => navigate(`/athletes/${row.athlete.id}`)}
                >
                  <div className="rank">{String(i + 1).padStart(2, '0')}</div>
                  <div className="athlete-cell">
                    <div className={'avatar' + (i === 0 ? ' champ' : '')}>
                      {row.athlete.initials}
                      {i === 0 && <ChampionFx />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="athlete-name">
                        {i === 0 ? (
                          <GlitchName name={row.athlete.name} />
                        ) : (
                          row.athlete.name
                        )}
                        {i === 0 && (
                          <span className="record-flag">★ Record</span>
                        )}
                      </div>
                      <div className="athlete-meta">
                        {row.athlete.squad} · {row.result.date}
                      </div>
                    </div>
                  </div>
                  <div className="time" style={{ textAlign: 'right' }}>
                    {formatTime(row.result.time)}
                  </div>
                  <div className="gap">{i === 0 ? '—' : formatDelta(gap)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Field events (jumps) — metres, higher is better */}
      {FIELD_EVENTS.map((fe) => {
        const rows = fieldLeaderboard(fe.id)
        const leader = rows[0]
        return (
          <section className="section" style={{ paddingTop: 0 }} key={fe.id}>
            <div className="container">
              <div className="section-head">
                <h2>{fe.name}</h2>
                <span className="eyebrow">
                  {fe.id === 'high-jump' ? 'Highest in the club' : 'Furthest in the club'}
                </span>
              </div>
              <div className="board">
                <div className="board-row head">
                  <span className="eyebrow">Pos</span>
                  <span className="eyebrow">Athlete</span>
                  <span className="eyebrow" style={{ textAlign: 'right' }}>
                    Mark
                  </span>
                  <span className="eyebrow gap" style={{ textAlign: 'right' }}>
                    Gap
                  </span>
                </div>

                {rows.length === 0 && (
                  <div className="board-row">
                    <span />
                    <span style={{ color: 'var(--text-faint)' }}>No marks recorded yet.</span>
                  </div>
                )}

                {rows.map((row, i) => {
                  const gap = leader ? row.mark - leader.mark : 0
                  return (
                    <div
                      key={row.athlete.id}
                      className={`board-row clickable r${i + 1}`}
                      onClick={() => navigate(`/athletes/${row.athlete.id}`)}
                    >
                      <div className="rank">{String(i + 1).padStart(2, '0')}</div>
                      <div className="athlete-cell">
                        <div className="avatar">{row.athlete.initials}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className="athlete-name">
                            {row.athlete.name}
                            {i === 0 && <span className="record-flag">★ Record</span>}
                          </div>
                          <div className="athlete-meta">
                            {row.athlete.squad} · {row.date}
                          </div>
                        </div>
                      </div>
                      <div className="time" style={{ textAlign: 'right' }}>
                        {formatMark(row.mark)}
                      </div>
                      <div className="gap">{i === 0 ? '—' : formatDelta(gap)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
