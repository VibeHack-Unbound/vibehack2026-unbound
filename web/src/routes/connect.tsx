import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PhoneShell } from '../components/PhoneShell'
import { AppHeader } from '../components/AppHeader'
import { FloatingAIButton } from '../components/FloatingAIButton'
import { CatAgentOverlay } from '../components/CatAgentOverlay'

export const Route = createFileRoute('/connect')({
  component: SupportPage,
})

const RESOURCES = [
  {
    name: 'samaritans',
    category: 'crisis',
    desc: 'free, confidential emotional support for anyone in distress. available 24/7.',
    phone: '116 123',
    web: 'https://www.samaritans.org',
    langs: [],
  },
  {
    name: 'shout',
    category: 'crisis',
    desc: 'free, confidential 24/7 text support for anyone in crisis. text shout to 85258.',
    phone: 'text 85258',
    web: 'https://giveusashout.org',
    langs: [],
  },
  {
    name: 'nhs talking therapies',
    category: 'therapy',
    desc: 'free nhs-funded cbt, counselling and other therapies. self-refer online.',
    phone: null,
    web: 'https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/nhs-talking-therapies/',
    langs: ['中文', 'español', 'français', '한국어'],
  },
  {
    name: 'student space',
    category: 'students',
    desc: 'dedicated mental health support for uk students — resources, counselling and peer support.',
    phone: null,
    web: 'https://studentspace.org.uk',
    langs: [],
  },
  {
    name: 'mind',
    category: 'information',
    desc: 'mental health information, local services finder and peer support communities.',
    phone: '0300 123 3393',
    web: 'https://www.mind.org.uk',
    langs: [],
  },
  {
    name: 'betterhelp',
    category: 'therapy',
    desc: 'online therapy with licensed counsellors. flexible scheduling, any device.',
    phone: null,
    web: 'https://www.betterhelp.com',
    langs: ['中文', 'español', '한국어'],
  },
]

function SupportPage() {
  const [agentOpen, setAgentOpen] = useState(false)

  return (
    <PhoneShell>
      <AppHeader />
      <div className="screen support-screen page-enter">
        <header>
          <h1 className="page-title">support</h1>
          <p className="page-subtitle">resources for when you need help</p>
        </header>

        {RESOURCES.map((r) => (
          <div key={r.name} className="resource-card">
            <div className="resource-card-header">
              <span className="resource-name">{r.name}</span>
              <span className="resource-badge">{r.category}</span>
            </div>
            <p className="resource-desc">{r.desc}</p>
            <div className="resource-links">
              {r.phone && (
                <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="resource-link">
                  📞 {r.phone}
                </a>
              )}
              {r.web && (
                <a href={r.web} target="_blank" rel="noopener noreferrer" className="resource-link">
                  🌐 website
                </a>
              )}
            </div>
            {r.langs.length > 0 && (
              <div className="resource-lang-tags">
                {r.langs.map(l => <span key={l} className="lang-tag">{l}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <FloatingAIButton onClick={() => setAgentOpen(true)} />
      {agentOpen && <CatAgentOverlay onClose={() => setAgentOpen(false)} />}
    </PhoneShell>
  )
}
