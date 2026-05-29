import { Link } from 'react-router-dom'
import { ATHLETES, EventId, bestTime, formatTime } from '../data/athletes'

// PBs we surface on the roster card
const HIGHLIGHT: EventId[] = ['100m', '200m', '400m']

export default function Athletes() {
  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">The Squad</div>
        <div className="section-head">
          <h2>Athletes</h2>
          <span className="eyebrow">{ATHLETES.length} runners</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...ATHLETES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => (
              <Link to={`/athletes/${a.id}`} key={a.id} className="ath-card">
                <div className="avatar">{a.initials}</div>
                <div>
                  <div className="athlete-name">{a.name}</div>
                  <div className="athlete-meta">
                    {a.squad} · b. {a.birthYear} · {a.results.length} PBs
                  </div>
                </div>
                <div className="pbs">
                  {HIGHLIGHT.map((ev) => {
                    const t = bestTime(a, ev)
                    return (
                      <div className="pb" key={ev}>
                        <div className="pb-ev">{ev}</div>
                        <div
                          className="pb-time"
                          style={!t ? { color: 'var(--text-faint)' } : undefined}
                        >
                          {t ? formatTime(t) : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  )
}
