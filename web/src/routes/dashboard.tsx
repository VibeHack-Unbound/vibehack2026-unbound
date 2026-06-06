import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { BottomNav } from '../components/BottomNav'
import { PhoneShell } from '../components/PhoneShell'
import { useI18n } from '../lib/i18n'

import type { CSSProperties } from 'react'

const moodDataEn = [
  { day: 'Mon', logged: true, mood: 3 },
  { day: 'Tue', logged: true, mood: 2 },
  { day: 'Wed', logged: true, mood: 2 },
  { day: 'Thu', logged: true, mood: 4 },
  { day: 'Fri', logged: true, mood: 3 },
  { day: 'Sat', logged: false, mood: 5 },
  { day: 'Sun', logged: true, mood: 4 },
]

const moodDataKo = [
  { day: '월', logged: true, mood: 3 },
  { day: '화', logged: true, mood: 2 },
  { day: '수', logged: true, mood: 2 },
  { day: '목', logged: true, mood: 4 },
  { day: '금', logged: true, mood: 3 },
  { day: '토', logged: false, mood: 5 },
  { day: '일', logged: true, mood: 4 },
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
  const { language, t } = useI18n()
  const moodData = language === 'ko' ? moodDataKo : moodDataEn
  const loggedCount = moodData.filter((day) => day.logged).length
  const insights =
    language === 'ko'
      ? [
          { color: '#D9C9E8', icon: '😴', text: '이번 주 7일 중 4일은 잘 주무셨어요' },
          { color: '#F5C5D1', icon: '💭', text: '이번 주 가장 흔한 스트레스 원인은 외로움이었어요' },
          { color: '#5B9FD8', icon: '📉', text: '주 중반에 기분이 낮아지는 경향이 있어요' },
        ]
      : [
          { color: '#D9C9E8', icon: '😴', text: 'You slept well 4 out of 7 days' },
          { color: '#F5C5D1', icon: '💭', text: 'Loneliness was your most common stressor this week' },
          { color: '#5B9FD8', icon: '📉', text: 'Your mood tends to dip mid-week' },
        ]

  return (
    <PhoneShell withNav>
      <div className="screen dashboard-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <header className="page-copy">
          <h1>{t('weekGlance')}</h1>
          <p>
            {loggedCount} {language === 'ko' ? '기록한 날' : 'days logged'}
          </p>
        </header>

        <section className="chart-card">
          <div className="chart-grid" aria-label={t('moodTrend')}>
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
          <h2>{t('weekGlance')}</h2>
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
          <p>
            {language === 'ko'
              ? '요즘 많이 지쳐 보이시네요. 혼자 해결하려 하지 않아도 돼요.'
              : "You've seemed really drained lately. You don't have to figure this out alone."}
          </p>
          <button className="primary-action small" onClick={() => navigate({ to: '/connect' })} type="button">
            {t('findTherapist')} →
          </button>
        </section>
      </div>
      <BottomNav />
    </PhoneShell>
  )
}
