import { createFileRoute } from '@tanstack/react-router'

import { BottomNav } from '../components/BottomNav'
import { PhoneShell } from '../components/PhoneShell'

const therapists = [
  {
    avatarColor: '#D4E89E',
    initials: 'YP',
    languages: ['English', '한국어'],
    name: 'Dr. Yuna Park',
    specialty: 'Specialises in anxiety and cultural adjustment',
    tags: ['NHS Free', 'Online'],
  },
  {
    avatarColor: '#F5C5D1',
    initials: 'MO',
    languages: ['English', 'Français'],
    name: 'Marcus Osei',
    specialty: 'Specialises in depression and international student wellbeing',
    tags: ['Private', 'Online'],
  },
  {
    avatarColor: '#D9C9E8',
    initials: 'AR',
    languages: ['English', 'العربية', 'Urdu'],
    name: 'Aisha Rahman',
    specialty: 'Specialises in trauma, identity, and belonging',
    tags: ['NHS Free'],
  },
]

export const Route = createFileRoute('/connect')({
  component: ConnectPage,
})

function ConnectPage() {
  return (
    <PhoneShell withNav>
      <div className="screen support-screen">
        <section className="support-banner hero">
          <span>🌿</span>
          <div>
            <p>You&apos;ve seemed really drained lately. You don&apos;t have to figure this out alone.</p>
            <small>Find immediate help or a professional below.</small>
          </div>
        </section>

        <section className="prototype-card talk-card">
          <h1>Talk to someone now</h1>
          <div>
            <a className="primary-action small" href="tel:116123">
              Samaritans
              <br />
              116 123
            </a>
            <a className="primary-action small warm" href="sms:85258">
              Shout
              <br />
              85258
            </a>
          </div>
        </section>

        <section className="therapist-section">
          <h2>Find a therapist nearby</h2>
          {therapists.map((therapist) => (
            <article className="therapist-card" key={therapist.name}>
              <div className="avatar" style={{ background: therapist.avatarColor }}>
                {therapist.initials}
              </div>
              <div>
                <h3>{therapist.name}</h3>
                <p>{therapist.specialty}</p>
                <div className="tag-row">
                  {therapist.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <small>{therapist.languages.join(' · ')}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="summary-card">
          <h2>Your recent summary</h2>
          <p>
            We&apos;ll prepare a short summary of your recent entries in English so you do not have to
            explain everything from scratch.
          </p>
          <button className="primary-action small" type="button">
            Learn more
          </button>
        </section>
      </div>
      <BottomNav />
    </PhoneShell>
  )
}
