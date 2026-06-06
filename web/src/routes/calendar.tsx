import { useState, useEffect } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { CatIllustration } from '../components/CatIllustration'
import { PhoneShell } from '../components/PhoneShell'
import { MEI_DATA, getEntryByDate } from '../lib/meiData'
import type { DayEntry } from '../lib/meiData'
import { TIERS, scoreToTier } from '../lib/tierSystem'

// Route supports ?open=YYYY-MM-DD so the Today tab can deep-link to today's sheet
export const Route = createFileRoute('/calendar')({
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

// ── Check-in questions (shared with today tab) ────────────────────────────
const CHECKIN_QUESTIONS = [
  { id: 'ate', q: 'did you eat today?', options: ['nothing', 'snacked only', 'at least 2 meals'] },
  {
    id: 'energy',
    q: 'how is your energy right now?',
    options: ['stuck in bed', 'getting by', 'normal', 'feeling good'],
  },
  {
    id: 'sleep',
    q: 'how did you sleep last night?',
    options: ['very poor (under 4hrs)', 'okay (4–6hrs)', 'good (7hrs+)'],
  },
  {
    id: 'social',
    q: 'did you connect with anyone today?',
    options: ['no contact', 'brief interaction', 'had a real conversation'],
  },
  {
    id: 'focus',
    q: 'could you focus on anything today?',
    options: ['completely blank', 'some focus', 'fully focused'],
  },
  {
    id: 'overall',
    q: 'how would you describe today overall?',
    options: ['very hard', 'hard', 'okay', 'good', 'really good'],
  },
]
const STRESS_TAGS = ['exams', 'family', 'loneliness', 'money', 'health', 'other']

// ── Sheet mode ────────────────────────────────────────────────────────────
type SheetState =
  | { mode: 'view'; entry: DayEntry }
  | { mode: 'input'; date: string; existing: DayEntry | null }
  | null

function CalendarPage() {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const { open } = useSearch({ from: '/calendar' })

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [sheet, setSheet] = useState<SheetState>(null)

  // If navigated here with ?open=YYYY-MM-DD, auto-open that day's sheet
  useEffect(() => {
    if (open) {
      const existing = getEntryByDate(open)
      setSheet({ mode: 'input', date: open, existing: existing ?? null })
    }
  }, [open])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

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
    const entry = getEntryByDate(dateStr)

    if (isToday) {
      // Today: always open input/edit sheet
      setSheet({ mode: 'input', date: dateStr, existing: entry ?? null })
    } else if (entry) {
      // Past day with entry: open view sheet
      setSheet({ mode: 'view', entry })
    }
    // Future days or past days with no entry: do nothing
  }

  function getCellStyle(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = getEntryByDate(dateStr)
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
      // Today with no entry: show as interactive with a "+" hint
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
      isFuture: isFuture,
    }
  }

  // Build grid: empty cells + day cells
  const cells: Array<{ type: 'empty' } | { type: 'day'; day: number }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ type: 'empty' })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ type: 'day', day: d })

  return (
    <PhoneShell withNav>
      <div className="screen calendar-screen page-enter">
        <header>
          <h1 className="page-title">calendar</h1>
          <p className="page-subtitle">your emotional journey</p>
        </header>

        {/* Month navigation */}
        <div className="calendar-month-nav">
          <button className="month-nav-btn" onClick={prevMonth} aria-label="previous month">
            ‹
          </button>
          <h2>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button className="month-nav-btn" onClick={nextMonth} aria-label="next month">
            ›
          </button>
        </div>

        {/* Day headers + grid */}
        <div className="calendar-grid">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="calendar-day-header">
              {d}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (cell.type === 'empty') {
              return <div key={`e-${i}`} className="cal-cell empty" />
            }
            const style = getCellStyle(cell.day)
            return (
              <div
                key={cell.day}
                className={[
                  'cal-cell',
                  style.isToday ? 'today' : '',
                  !style.hasEntry ? 'no-entry' : '',
                  style.isClickable ? 'clickable' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ background: style.background, color: style.color }}
                onClick={style.isClickable ? () => handleDayClick(cell.day) : undefined}
                role={style.isClickable ? 'button' : undefined}
                tabIndex={style.isClickable ? 0 : undefined}
                onKeyDown={
                  style.isClickable
                    ? (e) => e.key === 'Enter' && handleDayClick(cell.day)
                    : undefined
                }
                aria-label={
                  style.isToday && !style.hasEntry ? `${cell.day} — tap to log today` : undefined
                }
              >
                {cell.day}
                {style.isToday && !style.hasEntry && <span className="cal-today-plus">+</span>}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {([1, 2, 3, 4, 5] as const).map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.68rem',
                color: 'var(--muted)',
                fontWeight: 600,
              }}
            >
              <div
                style={{ width: 12, height: 12, borderRadius: 3, background: TIERS[t].colour }}
              />
              {TIERS[t].label}
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.68rem',
              color: 'var(--muted)',
              fontWeight: 600,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#E8E8E8' }} />
            no entry
          </div>
        </div>

        {/* Logged days count */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--muted)',
            fontWeight: 600,
          }}
        >
          {MEI_DATA.length} days logged
        </div>
      </div>

      {/* Sheet: view mode (past entries) */}
      {sheet?.mode === 'view' && (
        <DayDetailSheet entry={sheet.entry} onClose={() => setSheet(null)} />
      )}

      {/* Sheet: input/edit mode (today) */}
      {sheet?.mode === 'input' && (
        <CheckInSheet date={sheet.date} existing={sheet.existing} onClose={() => setSheet(null)} />
      )}

      <BottomNav />
    </PhoneShell>
  )
}

// ── View sheet (past entries) ─────────────────────────────────────────────
const VIEW_CHECKIN_QUESTIONS = [
  { key: 'ate', q: 'did you eat today?' },
  { key: 'energy', q: 'how is your energy?' },
  { key: 'sleep', q: 'how did you sleep?' },
  { key: 'social', q: 'did you connect with anyone?' },
  { key: 'focus', q: 'could you focus today?' },
  { key: 'overall', q: 'how would you describe today?' },
]

function DayDetailSheet({ entry, onClose }: { entry: DayEntry; onClose: () => void }) {
  const tier = scoreToTier(entry.score)
  const tierInfo = TIERS[tier]
  const d = new Date(entry.date)
  const dateLabel = d
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    .toLowerCase()

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--fg)' }}>{dateLabel}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
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
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: tierInfo.colour }}>
                {entry.score}/100
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <CatIllustration tier={tier} size={60} className="" />
            <button className="sheet-close" onClick={onClose} aria-label="close">
              ✕
            </button>
          </div>
        </div>

        {/* Voice transcript */}
        <div>
          <span className="section-label" style={{ display: 'block', marginBottom: 6 }}>
            voice journal
          </span>
          <div className="voice-summary">{entry.voiceSummary}</div>
        </div>

        {/* Check-in answers */}
        <div>
          <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>
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

        {/* Stress tags */}
        {entry.stressTags.length > 0 && (
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: 6 }}>
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

// ── Check-in input sheet (today's entry) ─────────────────────────────────
function CheckInSheet({
  date,
  existing,
  onClose,
}: {
  date: string
  existing: DayEntry | null
  onClose: () => void
}) {
  const d = new Date(date)
  const dateLabel = d
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    .toLowerCase()
  const isToday = date === new Date().toISOString().slice(0, 10)

  const [answers, setAnswers] = useState<Record<string, string>>(
    existing ? { ...existing.checkIn } : {},
  )
  const [selectedStress, setSelectedStress] = useState<string[]>(
    existing ? [...existing.stressTags] : [],
  )
  const [submitted, setSubmitted] = useState(false)

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function toggleStress(tag: string) {
    setSelectedStress((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const allAnswered = CHECKIN_QUESTIONS.every((q) => answers[q.id])

  function handleSave() {
    setSubmitted(true)
    // In a real app this would persist; for the prototype we just close after a beat
    setTimeout(() => onClose(), 900)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel sheet-panel-tall" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Header */}
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

        {/* Stress tags */}
        <div>
          <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>
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

        {/* Check-in questions */}
        <div className="checkin-section">
          {CHECKIN_QUESTIONS.map(({ id, q, options }) => (
            <div key={id} className="checkin-question">
              <p>{q}</p>
              <div className="answer-chips">
                {options.map((opt) => (
                  <button
                    key={opt}
                    className={`answer-chip${answers[id] === opt ? ' selected' : ''}`}
                    onClick={() => setAnswer(id, opt)}
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save button */}
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!allAnswered || submitted}
          type="button"
          style={{ opacity: allAnswered ? 1 : 0.5, marginTop: 4 }}
        >
          {submitted ? '✓ saved!' : existing ? 'update entry' : "save today's entry"}
        </button>
      </div>
    </div>
  )
}
