import { useState, useEffect, useRef } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import {
  CHECKIN_QUESTIONS,
  STRESS_TAGS,
  VIEW_CHECKIN_QUESTIONS,
} from '../../lib/checkIn'
import type { DayEntry } from '../../lib/meiData'
import {
  getEntryByDateFromEntries,
  saveJournalEntry,
  useJournalEntries,
} from '../../lib/journalStore'
import { TIERS, scoreToTier } from '../../lib/tierSystem'

export const Route = createFileRoute('/app/calendar')({
  validateSearch: (search: Record<string, unknown>) => ({
    open: typeof search.open === 'string' ? search.open : undefined,
  }),
  component: CalendarPage,
})

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]
const DAY_HEADERS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

type SheetState =
  | { mode: 'view'; entry: DayEntry }
  | { mode: 'input'; date: string; existing: DayEntry | null }
  | null

type TimeRange = '7d' | '30d' | '3m'

function scoreFromCheckIn(
  checkIn: DayEntry['checkIn'],
  stressTags: string[],
): number {
  let score = 64

  if (checkIn.ate === 'nothing') score -= 10
  if (checkIn.ate === 'at least 2 meals') score += 5
  if (checkIn.energy === 'stuck in bed') score -= 14
  if (checkIn.energy === 'feeling good') score += 8
  if (checkIn.sleep === 'very poor (under 4hrs)') score -= 12
  if (checkIn.sleep === 'good (7hrs+)') score += 7
  if (checkIn.social === 'no contact') score -= 7
  if (checkIn.social === 'had a real conversation') score += 6
  if (checkIn.focus === 'completely blank') score -= 9
  if (checkIn.focus === 'fully focused') score += 7
  if (checkIn.overall === 'very hard') score -= 22
  if (checkIn.overall === 'hard') score -= 10
  if (checkIn.overall === 'good') score += 8
  if (checkIn.overall === 'really good') score += 16
  score -= Math.min(stressTags.length, 4) * 3

  return Math.min(95, Math.max(5, Math.round(score)))
}

function summaryFromManualCheckIn(
  checkIn: DayEntry['checkIn'],
  stressTags: string[],
) {
  const stress = stressTags.length
    ? ` main stress sources: ${stressTags.join(', ')}.`
    : ''
  return `manual check-in saved. today felt ${checkIn.overall}; energy was ${checkIn.energy}.${stress}`
}

function CalendarPage() {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const { open } = useSearch({ from: '/app/calendar' })
  const entries = useJournalEntries()

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [sheet, setSheet] = useState<SheetState>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open) {
      const existing = getEntryByDateFromEntries(entries, open) ?? null
      setSheet({ mode: 'input', date: open, existing })
    }
  }, [entries, open])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const now = new Date()
    const cutoff = new Date(now)
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7)
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30)
    else cutoff.setMonth(now.getMonth() - 3)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const data = entries.filter((e) => e.date >= cutoffStr).sort((a, b) =>
      a.date.localeCompare(b.date),
    )

    if (data.length < 2) {
      ctx.fillStyle = '#A89F94'
      ctx.font = '12px Montserrat, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('not enough data for this range', W / 2, H / 2)
      return
    }

    const pad = { top: 10, right: 10, bottom: 24, left: 28 }
    const gW = W - pad.left - pad.right
    const gH = H - pad.top - pad.bottom

    const pts = data.map((e, i) => ({
      x: pad.left + (i / (data.length - 1)) * gW,
      y: pad.top + gH - (e.score / 100) * gH,
      colour: TIERS[scoreToTier(e.score)].colour,
    }))

    function drawGrid() {
      ctx!.strokeStyle = '#EAE4DA'
      ctx!.lineWidth = 1
      ;[0, 25, 50, 75, 100].forEach((v) => {
        const y = pad.top + gH - (v / 100) * gH
        ctx!.beginPath()
        ctx!.moveTo(pad.left, y)
        ctx!.lineTo(pad.left + gW, y)
        ctx!.stroke()
        ctx!.fillStyle = '#A89F94'
        ctx!.font = '9px Montserrat, sans-serif'
        ctx!.textAlign = 'right'
        ctx!.fillText(String(v), pad.left - 4, y + 3)
      })
    }

    let progress = 0
    let animId: number

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      drawGrid()

      const totalPts = pts.length
      const currentEnd = progress * (totalPts - 1)

      // filled area
      ctx!.beginPath()
      ctx!.moveTo(pts[0].x, pad.top + gH)
      for (let i = 0; i < totalPts - 1; i++) {
        const segProgress = Math.min(1, Math.max(0, currentEnd - i))
        if (segProgress <= 0) break
        const x = pts[i].x + (pts[i + 1].x - pts[i].x) * segProgress
        const y = pts[i].y + (pts[i + 1].y - pts[i].y) * segProgress
        ctx!.lineTo(pts[i].x, pts[i].y)
        if (segProgress < 1) ctx!.lineTo(x, y)
      }
      ctx!.lineTo(pts[Math.floor(currentEnd)].x, pad.top + gH)
      ctx!.closePath()
      const grad = ctx!.createLinearGradient(0, pad.top, 0, pad.top + gH)
      grad.addColorStop(0, 'rgb(128 176 232 / 18%)')
      grad.addColorStop(1, 'rgb(128 176 232 / 0%)')
      ctx!.fillStyle = grad
      ctx!.fill()

      // line segments
      for (let i = 0; i < totalPts - 1; i++) {
        const segProgress = Math.min(1, Math.max(0, currentEnd - i))
        if (segProgress <= 0) break
        const x = pts[i].x + (pts[i + 1].x - pts[i].x) * segProgress
        const y = pts[i].y + (pts[i + 1].y - pts[i].y) * segProgress
        ctx!.beginPath()
        ctx!.moveTo(pts[i].x, pts[i].y)
        ctx!.lineTo(x, y)
        ctx!.strokeStyle = pts[i].colour
        ctx!.lineWidth = 2.5
        ctx!.lineJoin = 'round'
        ctx!.lineCap = 'round'
        ctx!.stroke()
      }

      // dots
      pts.forEach((p, i) => {
        if (i > currentEnd) return
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx!.fillStyle = p.colour
        ctx!.fill()
        ctx!.strokeStyle = '#FAF6F0'
        ctx!.lineWidth = 1.5
        ctx!.stroke()
      })

      if (progress < 1) {
        progress = Math.min(1, progress + 0.03)
        animId = requestAnimationFrame(draw)
      }
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [entries, timeRange])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  function handleDayClick(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isToday = dateStr === todayStr
    const entry = getEntryByDateFromEntries(entries, dateStr)
    if (isToday) {
      setSheet({ mode: 'input', date: dateStr, existing: entry ?? null })
    } else if (entry) {
      setSheet({ mode: 'view', entry })
    }
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const cells: Array<{ type: 'empty' } | { type: 'day'; day: number }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ type: 'empty' })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ type: 'day', day: d })

  function getCellProps(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = getEntryByDateFromEntries(entries, dateStr)
    const isToday = dateStr === todayStr
    const isFuture = dateStr > todayStr
    if (entry) {
      const t = scoreToTier(entry.score)
      return {
        background: TIERS[t].colour,
        color: '#2C3E35',
        isToday,
        hasEntry: true,
        isClickable: true,
        isFuture: false,
      }
    }
    if (isToday) {
      return {
        background: '#E8E8E8',
        color: '#A89F94',
        isToday: true,
        hasEntry: false,
        isClickable: true,
        isFuture: false,
      }
    }
    return {
      background: '#E8E8E8',
      color: '#C8C8C8',
      isToday: false,
      hasEntry: false,
      isClickable: false,
      isFuture,
    }
  }

  return (
    <div className="screen calendar-screen page-enter">
      <div className="calendar-month-nav">
        <button
          className="month-nav-btn"
          onClick={prevMonth}
          aria-label="previous month"
        >
          ‹
        </button>
        <h2>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h2>
        <button
          className="month-nav-btn"
          onClick={nextMonth}
          aria-label="next month"
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (cell.type === 'empty')
            return <div key={`e-${i}`} className="cal-cell empty" />
          const props = getCellProps(cell.day)
          return (
            <div
              key={cell.day}
              className={[
                'cal-cell',
                props.isToday ? 'today' : '',
                !props.hasEntry ? 'no-entry' : '',
                props.isClickable ? 'clickable' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ background: props.background, color: props.color }}
              onClick={
                props.isClickable ? () => handleDayClick(cell.day) : undefined
              }
              role={props.isClickable ? 'button' : undefined}
              tabIndex={props.isClickable ? 0 : undefined}
              onKeyDown={
                props.isClickable
                  ? (e) => e.key === 'Enter' && handleDayClick(cell.day)
                  : undefined
              }
              aria-label={
                props.isToday && !props.hasEntry
                  ? `${cell.day} — tap to log today`
                  : undefined
              }
            >
              {cell.day}
              {props.isToday && !props.hasEntry && (
                <span className="cal-today-plus">+</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="calendar-legend">
        {([1, 2, 3, 4, 5] as const).map((t) => (
          <div key={t} className="legend-item">
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: TIERS[t].colour,
              }}
            />
            {TIERS[t].label}
          </div>
        ))}
        <div className="legend-item">
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: '#E8E8E8',
            }}
          />
          no entry
        </div>
      </div>

      <div className="card card-pad">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {(['7d', '30d', '3m'] as TimeRange[]).map((r) => (
            <button
              key={r}
              className={`time-range-btn${timeRange === r ? ' active' : ''}`}
              onClick={() => setTimeRange(r)}
              type="button"
            >
              {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '3 months'}
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 120, display: 'block' }}
        />
      </div>

      {sheet?.mode === 'view' && (
        <DayDetailSheet entry={sheet.entry} onClose={() => setSheet(null)} />
      )}
      {sheet?.mode === 'input' && (
        <CheckInSheet
          date={sheet.date}
          existing={sheet.existing}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}

function DayDetailSheet({
  entry,
  onClose,
}: {
  entry: DayEntry
  onClose: () => void
}) {
  const tier = scoreToTier(entry.score)
  const tierInfo = TIERS[tier]
  const dateLabel = new Date(entry.date)
    .toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    .toLowerCase()

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <button
            className="sheet-close"
            onClick={onClose}
            aria-label="close"
            style={{ alignSelf: 'flex-start', marginLeft: 'auto' }}
          >
            ✕
          </button>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              width: '100%',
            }}
          >
            <h3
              style={{
                fontSize: '0.95rem',
                color: 'var(--fg)',
                textAlign: 'center',
              }}
            >
              {dateLabel}
            </h3>
            <img
              src={`/cats/cat-tier-${tier}.webp`}
              alt="cat illustration"
              width={80}
              height={80}
              style={{ objectFit: 'contain' }}
            />

            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: tierInfo.colour,
              }}
            >
              {entry.score}/100
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="day-tier-badge"
                style={{
                  background: `${tierInfo.colour}33`,
                  border: `1.5px solid ${tierInfo.colour}`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: tierInfo.colour,
                    display: 'inline-block',
                  }}
                />
                {tierInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div>
          <span
            className="section-label"
            style={{ display: 'block', marginBottom: 6 }}
          >
            voice journal
          </span>
          <div className="voice-summary">{entry.voiceSummary}</div>
          {entry.voiceTranscript ? (
            <details className="voice-transcript-detail">
              <summary>transcript</summary>
              <p>{entry.voiceTranscript}</p>
            </details>
          ) : null}
        </div>

        <div>
          <span
            className="section-label"
            style={{ display: 'block', marginBottom: 8 }}
          >
            check-in
          </span>
          <div className="checkin-answers">
            {VIEW_CHECKIN_QUESTIONS.map(({ key, q }) => (
              <div key={key} className="checkin-row">
                <span className="checkin-q">{q}</span>
                <div className="checkin-chips">
                  <span className="chip selected">
                    {entry.checkIn[key as keyof typeof entry.checkIn]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {entry.stressTags.length > 0 && (
          <div>
            <span
              className="section-label"
              style={{ display: 'block', marginBottom: 6 }}
            >
              stress sources
            </span>
            <div className="stress-tags">
              {entry.stressTags.map((tag) => (
                <span key={tag} className="stress-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckInSheet({
  date,
  existing,
  onClose,
}: {
  date: string
  existing: DayEntry | null
  onClose: () => void
}) {
  const isToday = date === new Date().toISOString().slice(0, 10)
  const dateLabel = new Date(date)
    .toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    .toLowerCase()

  const [answers, setAnswers] = useState<Record<string, string>>(
    existing ? { ...existing.checkIn } : {},
  )
  const [selectedStress, setSelectedStress] = useState<string[]>(
    existing ? [...existing.stressTags] : [],
  )
  const [submitted, setSubmitted] = useState(false)

  function toggleStress(tag: string) {
    setSelectedStress((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const allAnswered = CHECKIN_QUESTIONS.every((q) => answers[q.id])

  function handleSave() {
    const checkIn: DayEntry['checkIn'] = {
      ate: answers.ate ?? existing?.checkIn.ate ?? 'snacked only',
      energy: answers.energy ?? existing?.checkIn.energy ?? 'getting by',
      sleep: answers.sleep ?? existing?.checkIn.sleep ?? 'okay (4-6hrs)',
      social: answers.social ?? existing?.checkIn.social ?? 'brief interaction',
      focus: answers.focus ?? existing?.checkIn.focus ?? 'some focus',
      overall: answers.overall ?? existing?.checkIn.overall ?? 'okay',
    }
    const score = scoreFromCheckIn(checkIn, selectedStress)

    saveJournalEntry({
      checkIn,
      date,
      score,
      source: existing?.source ?? 'manual',
      stressTags: selectedStress,
      tier: scoreToTier(score),
      voiceSummary:
        existing?.voiceSummary ?? summaryFromManualCheckIn(checkIn, selectedStress),
      voiceTranscript: existing?.voiceTranscript,
    })

    setSubmitted(true)
    setTimeout(() => onClose(), 800)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--fg)' }}>
              {isToday ? "today's check-in" : dateLabel}
            </h3>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--muted)',
                margin: '4px 0 0',
                fontWeight: 600,
              }}
            >
              {existing ? 'edit your entry' : 'log how you are feeling'}
            </p>
          </div>
          <button className="sheet-close" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>

        <div>
          <span
            className="section-label"
            style={{ display: 'block', marginBottom: 8 }}
          >
            what's been on your mind?
          </span>
          <div className="stress-chips-row">
            {STRESS_TAGS.map((tag) => (
              <button
                key={tag}
                className={`stress-chip-btn${selectedStress.includes(tag) ? ' selected' : ''}`}
                onClick={() => toggleStress(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="checkin-section">
          {CHECKIN_QUESTIONS.map(({ id, q, options }) => (
            <div key={id} className="checkin-question">
              <p>{q}</p>
              <div className="answer-chips">
                {options.map((opt) => (
                  <button
                    key={opt}
                    className={`answer-chip${answers[id] === opt ? ' selected' : ''}`}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [id]: opt }))
                    }
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!allAnswered || submitted}
          type="button"
          style={{ opacity: allAnswered ? 1 : 0.5 }}
        >
          {submitted
            ? '✓ saved!'
            : existing
              ? 'update entry'
              : "save today's entry"}
        </button>
      </div>
    </div>
  )
}
