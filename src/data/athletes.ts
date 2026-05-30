// =============================================================================
//  SNELLE MANNEN — DATA TYPES & HELPERS
//
//  To add real data, edit  src/data/athletes.json  — you do NOT need to touch
//  this file. Times are stored in SECONDS (100m in 10.84s -> 10.84). For events
//  with minutes, convert to seconds: 4:05.30 -> 245.30  (4*60 + 5.30).
// =============================================================================

import raw from './athletes.json'

export type EventId =
  | '100m'
  | '200m'
  | '400m'
  | '800m'
  | '1500m'
  | '5000m'

export interface TrackEvent {
  id: EventId
  name: string
  /** Short label used in compact UI */
  short: string
  /** Sprint events get the delta-comparison treatment */
  group: 'sprint' | 'middle' | 'long'
}

export interface Result {
  event: EventId
  /** Time in seconds */
  time: number
  /** ISO date the time was set */
  date: string
  /** Where it was set */
  meet?: string
}

/** A jump mark — distance/height in METRES (higher is better). */
export interface FieldMark {
  event: string // field event id (e.g. "long-jump")
  mark: number // metres
  date: string
  meet?: string
}

export interface Athlete {
  id: string
  name: string
  /** Short tag shown on cards, e.g. "MM" */
  initials: string
  /** Birth year — used to compute age category if you want it */
  birthYear: number
  /** Hometown / squad accent */
  squad: string
  results: Result[]
  /** Field-event (jump) marks. Optional — omit or use [] if none. */
  jumps?: FieldMark[]
}


export const EVENTS = (raw.events as TrackEvent[])

export const ATHLETES = (raw.athletes as Athlete[])

// -----------------------------------------------------------------------------
//  FIELD EVENTS (jumps) — measured in metres, higher is better.
//  Separate from the timed events so none of the race/speed logic is affected.
// -----------------------------------------------------------------------------

export interface FieldEvent {
  id: string
  name: string
  short: string
  unit: string
}

export const FIELD_EVENTS = (raw.fieldEvents as FieldEvent[]) ?? []

export interface RankedMark {
  athlete: Athlete
  mark: number
  date: string
  meet?: string
}

/** Best jump per athlete for a field event, sorted furthest/highest first. */
export function fieldLeaderboard(eventId: string): RankedMark[] {
  const rows: RankedMark[] = []
  for (const ath of ATHLETES) {
    const marks = (ath.jumps ?? []).filter((j) => j.event === eventId)
    if (marks.length === 0) continue
    const best = marks.reduce((a, b) => (a.mark >= b.mark ? a : b))
    rows.push({ athlete: ath, mark: best.mark, date: best.date, meet: best.meet })
  }
  return rows.sort((a, b) => b.mark - a.mark)
}

/** Best mark an athlete has for a field event, or undefined. */
export function bestMark(athlete: Athlete, eventId: string): number | undefined {
  const marks = (athlete.jumps ?? []).filter((j) => j.event === eventId)
  if (marks.length === 0) return undefined
  return Math.max(...marks.map((j) => j.mark))
}

/** Format a field mark in metres, e.g. 6.55 -> "6.55 m" */
export function formatMark(metres: number): string {
  return `${metres.toFixed(2)} m`
}

// -----------------------------------------------------------------------------
//  DERIVED HELPERS — no need to edit below this line
// -----------------------------------------------------------------------------

export const EVENT_MAP: Record<EventId, TrackEvent> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
) as Record<EventId, TrackEvent>

/** Format seconds as a human race time. 10.84 -> "10.84", 245.3 -> "4:05.30" */
export function formatTime(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(2)
  const mins = Math.floor(seconds / 60)
  const secs = seconds - mins * 60
  return `${mins}:${secs.toFixed(2).padStart(5, '0')}`
}

/** Format a signed delta in seconds, e.g. +0.34 / -1.10 */
export function formatDelta(seconds: number): string {
  const sign = seconds > 0 ? '+' : seconds < 0 ? '−' : ''
  return `${sign}${Math.abs(seconds).toFixed(2)}`
}

export interface RankedResult {
  athlete: Athlete
  result: Result
}

/** Best result per athlete for an event, sorted fastest-first. */
export function leaderboardFor(event: EventId): RankedResult[] {
  const rows: RankedResult[] = []
  for (const athlete of ATHLETES) {
    const forEvent = athlete.results.filter((r) => r.event === event)
    if (forEvent.length === 0) continue
    const best = forEvent.reduce((a, b) => (a.time <= b.time ? a : b))
    rows.push({ athlete, result: best })
  }
  return rows.sort((a, b) => a.result.time - b.result.time)
}

/** The single club record (fastest) for an event. */
export function clubRecord(event: EventId): RankedResult | undefined {
  return leaderboardFor(event)[0]
}

export function getAthlete(id: string): Athlete | undefined {
  return ATHLETES.find((a) => a.id === id)
}

/** Best time an athlete has for an event, or undefined. */
export function bestTime(athlete: Athlete, event: EventId): number | undefined {
  const forEvent = athlete.results.filter((r) => r.event === event)
  if (forEvent.length === 0) return undefined
  return Math.min(...forEvent.map((r) => r.time))
}
