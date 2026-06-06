import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { CatIllustration } from '../components/CatIllustration'
import { PhoneShell } from '../components/PhoneShell'
import { MEI_DATA, getEntryByDate } from '../lib/meiData'
import type { DayEntry } from '../lib/meiData'
import { TIERS, scoreToTier } from '../lib/tierSystem'

export const Route = createFileRoute('/calendar')({
  component: CalendarPage,
})

const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
]
const DAY_HEADERS = ['sun','mon','tue','wed','thu','fri','sat']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function CalendarPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedEntry, setSelectedEntry] = useState<DayEntry | null>(null)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = getEntryByDate(dateStr)
    if (entry) setSelectedEntry(entry)
  }

  function getCellStyle(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = getEntryByDate(dateStr)
    const isToday = dateStr === today.toISOString().slice(0, 10)
    if (entry) {
      const t = scoreToTier(entry.score)
      return { background: TIERS[t].colour, color: '#2C3E35', isToday, hasEntry: true }
    }
    return { background: '#E8E8E8', color: '#A89F94', isToday, hasEntry: false }
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
          <button className="month-nav-btn" onClick={prevMonth} aria-label="previous month">‹</button>
          <h2>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
          <button className="month-nav-btn" onClick={nextMonth} aria-label="next month">›</button>
        </div>

        {/* Day headers */}
        <div className="calendar-grid">
          {DAY_HEADERS.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {cells.map((cell, i) => {
            if (cell.type === 'empty') {
              return <div key={`e-${i}`} className="cal-cell empty" />
            }
            const style = getCellStyle(cell.day)
            return (
              <div
                key={cell.day}
                className={`cal-cell${style.isToday ? ' today' : ''}${!style.hasEntry ? ' no-entry' : ''}`}
                style={{ background: style.background, color: style.color }}
                onClick={() => handleDayClick(cell.day)}
                role={style.hasEntry ? 'button' : undefined}
                tabIndex={style.hasEntry ? 0 : undefined}
                onKeyDown={(e) => e.key === 'Enter' && handleDayClick(cell.day)}
              >
                {cell.day}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {([1,2,3,4,5] as const).map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: TIERS[t].colour }} />
              {TIERS[t].label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#E8E8E8' }} />
            no entry
          </div>
        </div>

        {/* Logged days count */}
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
          {MEI_DATA.length} days logged
        </div>
      </div>

      {/* Day detail sheet */}
      {selectedEntry && (
        <DayDetailSheet entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}

      <BottomNav />
    </PhoneShell>
  )
}

const CHECKIN_QUESTIONS = [
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
  const dateLabel = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toLowerCase()

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
                style={{ background: `${tierInfo.colour}33`, border: `1.5px solid ${tierInfo.colour}` }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tierInfo.colour, display: 'inline-block' }} />
                {tierInfo.label}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: tierInfo.colour }}>
                {entry.score}/100
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <CatIllustration tier={tier} size={60} className="" />
            <button className="sheet-close" onClick={onClose} aria-label="close">✕</button>
          </div>
        </div>

        {/* Voice transcript */}
        <div>
          <span className="section-label" style={{ display: 'block', marginBottom: 6 }}>voice journal</span>
          <div className="voice-summary">{entry.voiceSummary}</div>
        </div>

        {/* Check-in answers */}
        <div>
          <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>check-in</span>
          <div className="checkin-answers">
            {CHECKIN_QUESTIONS.map(({ key, q }) => (
              <div key={key} className="checkin-row">
                <span className="checkin-q">{q}</span>
                <div className="checkin-chips">
                  <span className="chip selected">{entry.checkIn[key as keyof typeof entry.checkIn]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stress tags */}
        {entry.stressTags.length > 0 && (
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: 6 }}>stress sources</span>
            <div className="stress-tags">
              {entry.stressTags.map(tag => (
                <span key={tag} className="stress-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
