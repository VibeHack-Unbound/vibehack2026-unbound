import { createFileRoute } from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { PhoneShell } from '../components/PhoneShell'

export const Route = createFileRoute('/connect')({
  component: ConnectPage,
})

interface Resource {
  name: string
  category: string
  description: string
  phone?: string
  website?: string
  languages?: string[]
  categoryColour: string
}

const RESOURCES: Resource[] = [
  {
    name: 'samaritans',
    category: 'crisis line',
    description: 'free, confidential listening 24 hours a day, 7 days a week.',
    phone: '116 123',
    website: 'samaritans.org',
    languages: ['english'],
    categoryColour: '#F2B8C6',
  },
  {
    name: 'nhs talking therapies',
    category: 'clinical referral',
    description: 'free nhs therapy for anxiety and depression. self-refer online or by phone.',
    phone: '0300 123 3393',
    website: 'nhs.uk',
    languages: ['english'],
    categoryColour: '#80B0E8',
  },
  {
    name: 'student space',
    category: 'university support',
    description: 'dedicated mental health support for uk students. free and confidential.',
    phone: '0800 138 8598',
    website: 'studentspace.org.uk',
    languages: ['english'],
    categoryColour: '#C3B8E8',
  },
  {
    name: 'shout',
    category: 'crisis text',
    description: 'free, confidential crisis text support. text shout to 85258 any time.',
    phone: 'text SHOUT to 85258',
    languages: ['english'],
    categoryColour: '#F2D06B',
  },
  {
    name: 'betterhelp',
    category: 'online therapy',
    description: 'connect with a licensed therapist online. flexible and multilingual.',
    website: 'betterhelp.com',
    languages: ['english', '中文', 'español', 'français', '한국어'],
    categoryColour: '#D4E89E',
  },
  {
    name: 'mind',
    category: 'community',
    description: 'mental health charity offering information, advice, and local support.',
    website: 'mind.org.uk',
    languages: ['english'],
    categoryColour: '#C4B5A5',
  },
]

function ConnectPage() {
  return (
    <PhoneShell withNav>
      <div className="screen page-enter">
        <header>
          <h1 className="page-title">support</h1>
          <p className="support-intro">you are not alone. here are people who can help.</p>
        </header>

        <div className="support-grid">
          {RESOURCES.map((r) => (
            <div key={r.name} className="support-card">
              <span
                className="support-card-category"
                style={{ background: `${r.categoryColour}44`, color: 'var(--fg)' }}
              >
                {r.category}
              </span>
              <h3>{r.name}</h3>
              <p>{r.description}</p>

              <div className="support-card-actions">
                {r.phone && (
                  <a
                    href={r.phone.startsWith('text') ? `sms:85258` : `tel:${r.phone.replace(/\s/g, '')}`}
                    className="support-link"
                  >
                    📞 {r.phone}
                  </a>
                )}
                {r.website && (
                  <a
                    href={`https://${r.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="support-link"
                  >
                    🌐 {r.website}
                  </a>
                )}
              </div>

              {r.languages && r.languages.length > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                  {r.languages.map(lang => (
                    <span key={lang} className="lang-tag">{lang}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--muted)',
            lineHeight: 1.5,
            padding: '0 8px',
          }}
        >
          all resources are free or low-cost. you deserve support in your own language.
        </div>
      </div>
      <BottomNav />
    </PhoneShell>
  )
}
