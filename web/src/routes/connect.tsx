import { createFileRoute } from '@tanstack/react-router'

import { BottomNav } from '../components/BottomNav'
import { PhoneShell } from '../components/PhoneShell'
import { useI18n } from '../lib/i18n'

const therapists = [
  {
    avatarColor: '#D4E89E',
    initials: 'YP',
    languages: ['English', '한국어'],
    name: 'Dr. Yuna Park',
    specialty: 'Specialises in anxiety and cultural adjustment',
    specialtyKo: '불안과 문화적 적응 전문',
    tags: ['NHS Free', 'Online'],
  },
  {
    avatarColor: '#F5C5D1',
    initials: 'MO',
    languages: ['English', 'Français'],
    name: 'Marcus Osei',
    specialty: 'Specialises in depression and international student wellbeing',
    specialtyKo: '우울증 및 유학생 정신건강 전문',
    tags: ['Private', 'Online'],
  },
  {
    avatarColor: '#D9C9E8',
    initials: 'AR',
    languages: ['English', 'العربية', 'Urdu'],
    name: 'Aisha Rahman',
    specialty: 'Specialises in trauma, identity, and belonging',
    specialtyKo: '트라우마, 정체성, 소속감 전문',
    tags: ['NHS Free'],
  },
]

export const Route = createFileRoute('/connect')({
  component: ConnectPage,
})

function ConnectPage() {
  const { language, t } = useI18n()

  return (
    <PhoneShell withNav>
      <div className="screen support-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <section className="support-banner hero">
          <span>🌿</span>
          <div>
            <p>
              {language === 'ko'
                ? '요즘 많이 지쳐 보이시네요. 혼자 해결하려 하지 않아도 돼요.'
                : "You've seemed really drained lately. You don't have to figure this out alone."}
            </p>
            <small>
              {language === 'ko'
                ? '아래에서 즉각적인 도움이나 전문 상담사를 찾을 수 있어요.'
                : 'Find immediate help or a professional below.'}
            </small>
          </div>
        </section>

        <section className="prototype-card talk-card">
          <h1>{language === 'ko' ? '지금 누군가와 이야기하기' : 'Talk to someone now'}</h1>
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
          <h2>{t('findTherapist')}</h2>
          {therapists.map((therapist) => (
            <article className="therapist-card" key={therapist.name}>
              <div className="avatar" style={{ background: therapist.avatarColor }}>
                {therapist.initials}
              </div>
              <div>
                <h3>{therapist.name}</h3>
                <p>{language === 'ko' ? therapist.specialtyKo : therapist.specialty}</p>
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
          <h2>{language === 'ko' ? '최근 요약' : 'Your recent summary'}</h2>
          <p>
            {language === 'ko'
              ? '최근 기록을 영어로 요약해 드려서 처음부터 설명하지 않아도 돼요.'
              : "We'll prepare a short summary of your recent entries in English so you do not have to explain everything from scratch."}
          </p>
          <button className="primary-action small" type="button">
            {language === 'ko' ? '더 알아보기' : 'Learn more'}
          </button>
        </section>
      </div>
      <BottomNav />
    </PhoneShell>
  )
}
