import { useState, useEffect, useRef } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { PhoneShell } from '../components/PhoneShell'
import { AppHeader } from '../components/AppHeader'
import { FloatingAIButton } from '../components/FloatingAIButton'
import { CatIllustration } from '../components/CatIllustration'
import { CatAgentOverlay } from '../components/CatAgentOverlay'
import { MEI_DATA, getEntryByDate } from '../lib/meiData'
import type { DayEntry } from '../lib/meiData'
import { TIERS, scoreToTier } from '../lib/tierSystem'

export const Route = createFileRoute('/calendar')({
  validateSearch: (search: Record<string, unknown>) => ({
    open: typeof search.open === 'string' ? search.open : undefined,
  }),
  component: CalendarPage,
})

const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
]
const DAY_HEADERS = ['su','mo','tu','we','th','fr','sa']

const CHECKIN_QUESTIONS = [
  { id: 'ate',    q: 'did you eat today?',                options: ['nothing', 'snacked only', 'at least 2 meals'] },
  { id: 'energy', q: 'how is your energy right now?',     options: ['stuck in bed', 'getting by', 'normal', 'feeling good'] },
  { id: 'sleep',  q: 'how did you sleep last night?',     options: ['very poor (under 4hrs)', 'okay (4–6hrs)', 'good (7hrs+)'] },
  { id: 'social', q: 'did you connect with anyone today?',options: ['no contact', 'brief interaction', 'had a real conversation'] },
  { id: 'focus',  q: 'could you focus on anything today?',options: ['completely blank', 'some focus', 'fully focused'] },
  { id: 'overall',q: 'how would you describe today overall?', options: ['very hard', 'hard', 'okay', 'good', 'really good'] },
]

type SheetState =
  | { mode: 'view'; entry: DayEntry }
  | { mode: 'input'; date: string; existing: DayEntry | null }
  | null

type TimeRange = '7d' | '30d' | '3m'

function CalendarPage() {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const { open } = useSearch({ from: '/calendar' })

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [sheet, setSheet] = useState<SheetState>(null)
  const [agentOpen, setAgentOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open) {
      const existing = getEntryByDate(open) ?? null
      setSheet({ mode: 'input', date: open, existing })
    }
  }, [open])

  // Draw mood line graph
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

    // Filter data by time range
    const now = new Date()
    const cutoff = new Date(now)
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7)
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30)
    else cutoff.setMonth(now.getMonth() - 3)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const data = MEI_DATA.filter(e => e.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date))

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

    // Y-axis grid lines
    ctx.strokeStyle = '#EAE4DA'
    ctx.lineWidth = 1
    ;[0, 25, 50, 75, 100].forEach(v => {
      const y = pad.top + gH - (v / 100) * gH
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + gW, y)
      ctx.stroke()
      ctx.fillStyle = '#A89F94'
      ctx.font = `9px Montserrat, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(String(v), pad.left - 4, y + 3)
    })

    // Build gradient line segments by tier colour
    const pts = data.map((e, i) => ({
      x: pad.left + (i / (data.length - 1)) * gW,
      y: pad.top + gH - (e.score / 100) * gH,
      colour: TIERS[scoreToTier(e.score)].colour,
    }))

    // Draw filled area under line
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pad.top + gH)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, pad.top + gH)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + gH)
    grad.addColorStop(0, 'rgb(128 176 232 / 22%)')
    grad.addColorStop(1, 'rgb(128 176 232 / 0%)')
    ctx.fillStyle = grad
    ctx.fill()

    // Draw line segments coloured by tier
    for (let i = 0; i < pts.length - 1; i++) {
      ctx.beginPath()
      ctx.moveTo(pts[i].x, pts[i].y)
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y)
      ctx.strokeStyle = pts[i].colour
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    // Draw dots
    pts.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = p.colour
      ctx.fill()
      ctx.strokeStyle = '#FAF6F0'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  }, [timeRange])

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
    const isToday = dateStr === todayStr
    const entry = getEntryByDate(dateStr)
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
    const entry = getEntryByDate(dateStr)
    const isToday = dateStr === todayStr
    const isFuture = dateStr > todayStr
    if (entry) {
      const t = scoreToTier(entry.score)
      return { bg: TIERS[t].colour, textColor: '#2C3E35', isToday, clickable: true, isFuture: false }
    }
    if (isToday) return { bg: '#E8E8E8', textColor: '#A89F94', isToday: true, clickable: true, isFuture: false }
    return { bg: '#E8E8E8', textColor: isFuture ? '#D0C8C0' : '#B0A898', isToday: false, clickable: false, isFuture }
  }

  return (
    <PhoneShell>
      <AppHeader />
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

        {/* Circle grid */}
        <div className="calendar-circle-grid">
          {DAY_HEADERS.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {cells.map((cell, i) => {
            if (cell.type === 'empty') return <div key={`e-${i}`} className="cal-circle empty" />
            const props = getCellProps(cell.day)
            const classes = [
              'cal-circle',
              props.clickable ? 'has-entry' : 'no-entry',
              props.isToday ? 'is-today' : '',
            ].filter(Boolean).join(' ')
            return (
              <div
                key={cell.day}
                className={classes}
                style={{ background: props.bg, color: props.textColor }}
                onClick={props.clickable ? () => handleDayClick(cell.day) : undefined}
                role={props.clickable ? 'button' : undefined}
                tabIndex={props.clickable ? 0 : undefined}
                onKeyDown={props.clickable ? (e) => e.key === 'Enter' && handleDayClick(cell.day) : undefined}
              >
                {cell.day}
              </div>
            )
          })}
        </div>

        {/* Mood graph */}
        <div className="mood-graph-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="section-label">mood over time</span>
            <div className="mood-graph-toggles">
              {(['7d', '30d', '3m'] as TimeRange[]).map(r => (
                <button
                  key={r}
                  className={`mood-toggle-btn${timeRange === r ? ' active' : ''}`}
                  onClick={() => setTimeRange(r)}
                  type="button"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="mood-graph-canvas-wrap">
            <canvas ref={canvasRef} style={{ width: '100%', height: '140px', display: 'block' }} />
          </div>
        </div>
      </div>

      {/* View sheet */}
      {sheet?.mode === 'view' && (
        <DayDetailSheet entry={sheet.entry} onClose={() => setSheet(null)} />
      )}

      {/* Check-in sheet */}
      {sheet?.mode === 'input' && (
        <CheckInSheet date={sheet.date} existing={sheet.existing} onClose={() => setSheet(null)} />
      )}

      <FloatingAIButton onClick={() => setAgentOpen(true)} />
      {agentOpen && <CatAgentOverlay onClose={() => setAgentOpen(false)} />}
    </PhoneShell>
  )
}

// ── View sheet ────────────────────────────────────────────────────────────
const VIEW_QUESTIONS = [
  { key: 'ate',    q: 'did you eat today?' },
  { key: 'energy', q: 'how is your energy?' },
  { key: 'sleep',  q: 'how did you sleep?' },
  { key: 'social', q: 'did you connect with anyone?' },
  { key: 'focus',  q: 'could you focus today?' },
  { key: 'overall',q: 'how would you describe today?' },
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
              <span className="day-tier-badge" style={{ background: `${tierInfo.colour}33`, border: `1.5px solid ${tierInfo.colour}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tierInfo.colour, display: 'inline-block' }} />
                {tierInfo.label}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: tierInfo.colour }}>{entry.score}/100</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <CatIllustration tier={tier} size={56} className="" />
            <button className="sheet-close" onClick={onClose} aria-label="close">✕</button>
          </div>
        </div>
        <div>
          <span className="section-label" style={{ display: 'block', marginBottom: 6 }}>voice journal</span>
          <div className="voice-summary">{entry.voiceSummary}</div>
        </div>
        <div>
          <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>check-in</span>
          <div className="checkin-answers">
            {VIEW_QUESTIONS.map(({ key, q }) => (
              <div key={key} className="checkin-row">
                <span className="checkin-q">{q}</span>
                <div className="checkin-chips">
                  <span className="chip selected">{entry.checkIn[key as keyof typeof entry.checkIn]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {entry.stressTags.length > 0 && (
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: 6 }}>stress sources</span>
            <div className="stress-tags">
              {entry.stressTags.map(tag => <span key={tag} className="stress-tag">{tag}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Check-in input sheet ──────────────────────────────────────────────────
function CheckInSheet({ date, existing, onClose }: { date: string; existing: DayEntry | null; onClose: () => void }) {
  const d = new Date(date)
  const isToday = date === new Date().toISOString().slice(0, 10)
  const dateLabel = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toLowerCase()
  const [answers, setAnswers] = useState<Record<string, string>>(existing ? { ...existing.checkIn } : {})
  const [submitted, setSubmitted] = useState(false)
  const allAnswered = CHECKIN_QUESTIONS.every(q => answers[q.id])

  function handleSave() {
    setSubmitted(true)
    setTimeout(() => onClose(), 800)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--fg)' }}>{isToday ? "today's check-in" : dateLabel}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0 0', fontWeight: 600 }}>
              {existing ? 'edit your entry' : 'log how you are feeling'}
            </p>
          </div>
          <button className="sheet-close" onClick={onClose} aria-label="close">✕</button>
        </div>
        <div className="checkin-section">
          {CHECKIN_QUESTIONS.map(({ id, q, options }) => (
            <div key={id} className="checkin-question">
              <p>{q}</p>
              <div className="answer-chips">
                {options.map(opt => (
                  <button
                    key={opt}
                    className={`answer-chip${answers[id] === opt ? ' selected' : ''}`}
                    onClick={() => setAnswers(prev => ({ ...prev, [id]: opt }))}
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
          {submitted ? '✓ saved!' : existing ? 'update entry' : "save today's entry"}
        </button>
      </div>
    </div>
  )
}
