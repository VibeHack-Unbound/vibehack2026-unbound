import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/connect')({
  component: SupportPage,
})

const NHS_URL =
  'https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/nhs-talking-therapies/'

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
    web: NHS_URL,
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
  return (
    <div className="screen support-screen page-enter">
      <header>
        <h1 className="page-title">support</h1>
        <p className="page-subtitle">
          you are not alone. here are people who can help.
        </p>
      </header>

      <div className="support-grid">
        {RESOURCES.map((r) => (
          <div key={r.name} className="support-card">
            <span className="support-card-category">{r.category}</span>
            <h3>{r.name}</h3>
            <p>{r.desc}</p>

            <div className="support-card-actions">
              {r.phone && (
                <a
                  href={
                    r.phone.startsWith('text')
                      ? 'sms:85258'
                      : `tel:${r.phone.replace(/\s/g, '')}`
                  }
                  className="support-link"
                >
                  📞 {r.phone}
                </a>
              )}
              {r.web && (
                <a
                  href={r.web}
                  target="_blank"
                  rel="noreferrer"
                  className="support-link"
                >
                  🌐 {r.web}
                </a>
              )}
            </div>

            {r.langs.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  marginTop: 4,
                }}
              >
                {r.langs.map((lang) => (
                  <span key={lang} className="lang-tag">
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
