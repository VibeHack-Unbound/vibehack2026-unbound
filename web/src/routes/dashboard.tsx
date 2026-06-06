import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { BottomNav } from '../components/BottomNav'
import { PhoneShell } from '../components/PhoneShell'

import type { CSSProperties } from 'react'

const moodData = [
  { day: 'Mon', logged: true, mood: 3 },
  { day: 'Tue', logged: true, mood: 2 },
  { day: 'Wed', logged: true, mood: 2 },
  { day: 'Thu', logged: true, mood: 4 },
  { day: 'Fri', logged: true, mood: 3 },
  { day: 'Sat', logged: false, mood: 5 },
  { day: 'Sun', logged: true, mood: 4 },
]

const moodLabels: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const loggedCount = moodData.filter((day) => day.logged).length
  const insights = [
    { color: '#D9C9E8', icon: '😴', text: 'You slept well 4 out of 7 days' },
    { color: '#F5C5D1', icon: '💭', text: 'Loneliness was your most common stressor this week' },
    { color: '#5B9FD8', icon: '📉', text: 'Your mood tends to dip mid-week' },
  ]

  return (
    <PhoneShell withNav>
      <div className="screen dashboard-screen">
        <header className="page-copy">
          <h1>Your week at a glance</h1>
          <p>{loggedCount} days logged</p>
        </header>

        <section className="chart-card">
          <div className="chart-grid" aria-label="Mood this week">
            {moodData.map((day) => (
              <div className="chart-column" key={day.day}>
                <span style={{ height: `${day.mood * 18 + 10}%` }} />
                <strong>{day.day}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="insight-list">
          {insights.map((insight) => (
            <article className="prototype-card insight-card" key={insight.text} style={{ '--accent': insight.color } as CSSProperties}>
              <span>{insight.icon}</span>
              <p>{insight.text}</p>
            </article>
          ))}
        </section>

        <section className="calendar-section">
          <h2>Your week at a glance</h2>
          <div className="calendar-row">
            {moodData.map((day) => (
              <div className="calendar-cell" data-logged={day.logged} key={day.day}>
                <strong>{day.logged ? moodLabels[day.mood] : '—'}</strong>
                <span>{day.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="support-banner">
          <p>You&apos;ve seemed really drained lately. You don&apos;t have to figure this out alone.</p>
          <button className="primary-action small" onClick={() => navigate({ to: '/connect' })} type="button">
            Find a therapist nearby →
          </button>
        </section>
      </div>
      <BottomNav />
    </PhoneShell>
  )
}
