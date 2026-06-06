import { createFileRoute } from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { CatIllustration } from '../components/CatIllustration'
import { PhoneShell } from '../components/PhoneShell'
import { MEI_DATA, getLatestEntry } from '../lib/meiData'
import { TIERS, scoreToTier } from '../lib/tierSystem'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

const DAY_LABELS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return DAY_LABELS[d.getDay()]
}

function DashboardPage() {
  const latest = getLatestEntry()
  const tier = scoreToTier(latest.score)
  const tierInfo = TIERS[tier]

  // Last 7 days (or all available if fewer)
  const last7 = MEI_DATA.slice(-7)

  return (
    <PhoneShell withNav>
      <div className="screen page-enter">
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">hi, mei 👋</h1>
            <p className="page-subtitle">here's how you've been doing</p>
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--muted)',
              textAlign: 'right',
            }}
          >
            {new Date()
              .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
              .toLowerCase()}
          </div>
        </header>

        {/* Two-column layout */}
        <div className="dashboard-two-col">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Wellness score ring */}
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
            >
              <span className="section-label">wellness score</span>
              <div
                className="wellness-score-ring"
                style={{ color: tierInfo.colour, borderColor: tierInfo.colour }}
              >
                {latest.score}
                <small>/ 100</small>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  borderRadius: 999,
                  padding: '3px 10px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: tierInfo.colour,
                  color: tier === 3 ? '#2C3E35' : tier === 4 ? '#2C3E35' : 'white',
                }}
              >
                {tierInfo.label}
              </span>
            </div>

            {/* AI summary */}
            <div className="card card-pad" style={{ gap: 8 }}>
              <span className="section-label">this week</span>
              <p className="ai-summary">
                you have been {tierInfo.label} this week. exam stress mentioned{' '}
                {MEI_DATA.filter((d) => d.stressTags.includes('exams')).length} times.
              </p>
            </div>

            {/* Recommendation */}
            <div
              className="recommendation-card"
              style={{
                background: `${tierInfo.colour}22`,
                border: `1.5px solid ${tierInfo.colour}66`,
              }}
            >
              {tierInfo.recommendation}
            </div>
          </div>

          {/* Right column – cat (weekly trend analysis, no interaction) */}
          <div className="cat-column">
            <CatIllustration tier={tier} size={150} className={`cat-idle cat-idle-${tier}`} />
          </div>
        </div>

        {/* Last 7 days bar chart */}
        <div className="card card-pad">
          <span className="section-label" style={{ display: 'block', marginBottom: 10 }}>
            last 7 days
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 64 }}>
            {last7.map((entry) => {
              const t = scoreToTier(entry.score)
              const colour = TIERS[t].colour
              const heightPct = Math.max(20, entry.score)
              return (
                <div key={entry.date} className="week-bar-col" style={{ flex: 1 }}>
                  <div
                    className="week-dot"
                    style={{
                      height: `${heightPct * 0.56}px`,
                      background: colour,
                      width: '100%',
                    }}
                  />
                  <div className="week-dot-label">{formatDate(entry.date)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tier 5 safety card – hard requirement, always visible when tier 5 */}
        {tier === 5 && (
          <div className="tier5-safety-card">
            <h3>you don't have to face this alone</h3>
            <p>
              we've noticed you might need some extra support right now. please reach out — help is
              available 24/7.
            </p>
            <div className="crisis-btns">
              <a href="tel:116123" className="crisis-btn call">
                📞 samaritans
                <br />
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>116 123</span>
              </a>
              <a href="sms:85258" className="crisis-btn text">
                💬 shout
                <br />
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>text 85258</span>
              </a>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </PhoneShell>
  )
}
