import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell } from '../components/PhoneShell'
import { AppHeader } from '../components/AppHeader'
import { FloatingAIButton } from '../components/FloatingAIButton'
import { CatIllustration } from '../components/CatIllustration'
import { CatAgentOverlay } from '../components/CatAgentOverlay'
import { MEI_DATA } from '../lib/meiData'
import { TIERS, scoreToTier } from '../lib/tierSystem'

export const Route = createFileRoute('/dashboard')({
  component: HomePage,
})

function getWeeklyStats() {
  const last7 = MEI_DATA.slice(-7)
  const avgScore = Math.round(last7.reduce((s, e) => s + e.score, 0) / last7.length)
  const tier = scoreToTier(avgScore)
  const tagCounts: Record<string, number> = {}
  last7.forEach(e => e.stressTags.forEach(t => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }))
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0] as [string, number] | undefined
  return { avgScore, tier, topTag }
}

function buildAISummary(tier: number, topTag: [string, number] | undefined): string {
  const tierLabel = TIERS[tier as keyof typeof TIERS]?.label ?? 'coping ok'
  const tagPart = topTag ? ` ${topTag[0]} mentioned ${topTag[1]} time${topTag[1] > 1 ? 's' : ''}.` : ''
  return `you have been ${tierLabel} this week.${tagPart}`
}

function HomePage() {
  const navigate = useNavigate()
  const [agentOpen, setAgentOpen] = useState(false)
  const { tier, topTag } = getWeeklyStats()
  const aiSummary = buildAISummary(tier, topTag)
  const isCrisis = tier === 5
  const todayStr = new Date().toISOString().slice(0, 10)

  function handleLogToday() {
    navigate({ to: '/calendar', search: { open: todayStr } })
  }

  return (
    <PhoneShell>
      <AppHeader />
      <div className="screen home-screen page-enter">
        <h1 className="home-greeting">hi, mei 👋</h1>

        <div className="home-cat-wrap">
          <CatIllustration tier={tier} size={180} className={`cat-tier-${tier}`} />
        </div>

        <p className="home-ai-summary">{aiSummary}</p>

        <button
          className="btn-primary home-log-btn"
          onClick={handleLogToday}
          type="button"
        >
          log today
        </button>

        {isCrisis && (
          <div className="crisis-card">
            <p className="crisis-card-title">you don't have to do this alone</p>
            <div className="crisis-resource">
              <span className="crisis-resource-name">samaritans</span>
              <span className="crisis-resource-detail">call 116 123 — free, 24/7, any language</span>
            </div>
            <div className="crisis-resource">
              <span className="crisis-resource-name">shout</span>
              <span className="crisis-resource-detail">text SHOUT to 85258 — free, 24/7</span>
            </div>
            <div className="crisis-resource">
              <span className="crisis-resource-name">student minds</span>
              <span className="crisis-resource-detail">studentminds.org.uk — for students in the UK</span>
            </div>
          </div>
        )}
      </div>

      <FloatingAIButton onClick={() => setAgentOpen(true)} />
      {agentOpen && <CatAgentOverlay onClose={() => setAgentOpen(false)} />}
    </PhoneShell>
  )
}
