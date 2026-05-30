import { useEffect, useState } from 'react'

// Glitches the name and briefly flips it to "De Snelste Man". The real name
// stays on screen far longer than the alias.
export function GlitchName({
  name,
  as: Tag = 'span',
}: {
  name: string
  as?: 'h1' | 'span'
}) {
  const ALT = 'De Snelste Man'
  const [text, setText] = useState(name)
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    setText(name)
    const timers: number[] = []
    const at = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))

    const toAlt = () => {
      setGlitching(true)
      at(() => setText(ALT), 200)
      at(() => setGlitching(false), 480)
      at(toReal, 1700) // alias visible ~1.7s
    }
    const toReal = () => {
      setGlitching(true)
      at(() => setText(name), 200)
      at(() => setGlitching(false), 480)
      at(toAlt, 5200) // real name visible ~5.2s
    }
    at(toAlt, 5200)

    return () => timers.forEach(clearTimeout)
  }, [name])

  return (
    <Tag className={'glitch-name' + (glitching ? ' on' : '')} data-text={text}>
      {text}
    </Tag>
  )
}

// Gold rosette with volt ribbon tails, pinned to a champion's avatar.
export function VictoryRibbon() {
  return (
    <span className="avatar-ribbon">
      <svg viewBox="0 0 44 62" width="44" height="62" aria-hidden="true">
        <defs>
          <linearGradient id="goldR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe680" />
            <stop offset="1" stopColor="#e3a008" />
          </linearGradient>
        </defs>
        <polygon points="12,30 20,30 17,61 14,55 11,61" fill="#d7ff1e" />
        <polygon points="24,30 32,30 33,61 30,55 27,61" fill="#aacc18" />
        <circle cx="22" cy="19" r="15" fill="#0a0a0b" />
        <circle cx="22" cy="19" r="13" fill="url(#goldR)" />
        <circle cx="22" cy="19" r="13" fill="none" stroke="#fff6cf" strokeOpacity="0.5" strokeWidth="1" />
        <text x="22" y="20" fontSize="16" textAnchor="middle" dominantBaseline="central" fill="#2a2204">
          ★
        </text>
      </svg>
    </span>
  )
}

// The full champion avatar decoration (shine sweep + ribbon).
export function ChampionFx() {
  return (
    <>
      <span className="avatar-shine" />
      <VictoryRibbon />
    </>
  )
}
