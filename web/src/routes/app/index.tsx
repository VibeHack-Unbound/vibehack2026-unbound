import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MEI_DATA } from '../../lib/meiData'
import { TIERS, scoreToTier } from '../../lib/tierSystem'

export const Route = createFileRoute('/app/')({
  component: HomePage,
})

function getWeeklyStats() {
  const last7 = MEI_DATA.slice(-7)
  const avgScore = Math.round(
    last7.reduce((s, e) => s + e.score, 0) / last7.length,
  )
  const tier = scoreToTier(avgScore)
  const tagCounts: Record<string, number> = {}
  last7.forEach((e) =>
    e.stressTags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1
    }),
  )
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0] as
    | [string, number]
    | undefined
  return { tier, topTag }
}

function buildAISummary(
  tier: number,
  topTag: [string, number] | undefined,
): string {
  const tierLabel = TIERS[tier as keyof typeof TIERS]?.label ?? 'coping ok'
  const tagPart = topTag
    ? `${topTag[0]} mentioned ${topTag[1]} time${topTag[1] > 1 ? 's' : ''}.`
    : ''
  return `you have been ${tierLabel} this week.\n${tagPart}`
}

function HomePage() {
  const navigate = useNavigate()
  const { tier, topTag } = getWeeklyStats()
  const tierInfo = TIERS[tier]
  const aiSummary = buildAISummary(tier, topTag)
  const todayStr = new Date().toISOString().slice(0, 10)

  function handleLogToday() {
    navigate({ to: '/app/calendar', search: { open: todayStr } })
  }

  return (
    <div className="home-screen screen page-enter">
      <p className="home-greeting">hi, jen</p>

      <div className="home-cat-wrap">
        <img
          src={`/cats/cat-tier-${tier}.webp`}
          alt="your weekly mood cat"
          className={`home-cat-img cat-idle-${tier}`}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
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

      <p className="home-ai-summary">{aiSummary}</p>

      <button
        className="btn-primary home-log-btn"
        onClick={handleLogToday}
        type="button"
      >
        log today
      </button>

      {tier === 5 && (
        <div className="tier5-safety-card">
          <h3>you don't have to face this alone</h3>
          <p>
            we've noticed you might need some extra support right now. please
            reach out — help is available 24/7.
          </p>
          <div className="crisis-btns">
            <a href="tel:116123" className="crisis-btn call">
              📞 samaritans
              <br />
              <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                116 123
              </span>
            </a>
            <a href="sms:85258" className="crisis-btn text">
              💬 shout
              <br />
              <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                text 85258
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
