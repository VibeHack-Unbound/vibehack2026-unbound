import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { PhoneShell } from '../components/PhoneShell'
import { languageOptions, useI18n } from '../lib/i18n'

import type { Language } from '../lib/i18n'

const moodOptions = [
  { emoji: '😔', label: 'Very sad', value: 1 },
  { emoji: '😕', label: 'Sad', value: 2 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😊', label: 'Great', value: 5 },
]

export const Route = createFileRoute('/')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const navigate = useNavigate()
  const { language, setLanguage } = useI18n()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const isRtl = selectedLanguage === 'ar'

  return (
    <PhoneShell>
      <div className="screen onboarding-screen" dir={isRtl ? 'rtl' : 'ltr'}>
        {step === 1 ? (
          <>
            <header className="center-header">
              <div className="mini-brand">
                <span className="brand-cat">●</span>
                <strong>Unbound</strong>
              </div>
              <h1>
                This app speaks
                <em> your language</em>
              </h1>
              <p>Choose the language you feel most comfortable in.</p>
            </header>

            <div className="language-grid prototype-grid">
              {languageOptions.map((option) => (
                <button
                  aria-pressed={selectedLanguage === option.code}
                  className="lang-btn"
                  data-selected={selectedLanguage === option.code}
                  key={option.code}
                  onClick={() => setSelectedLanguage(option.code)}
                  type="button"
                >
                  <span>{option.flag}</span>
                  <strong>{option.nativeName}</strong>
                  <small>{option.englishName}</small>
                </button>
              ))}
            </div>

            <button
              className="primary-action"
              onClick={() => {
                setLanguage(selectedLanguage)
                setStep(2)
              }}
              type="button"
            >
              Continue →
            </button>
            <p className="quiet-note">You can change this anytime in settings.</p>
          </>
        ) : (
          <>
            <div className="mini-brand left">
              <span className="brand-cat calm">●</span>
              <strong>Unbound</strong>
            </div>
            <header className="page-copy">
              <h1>How are you feeling right now?</h1>
              <p>There is no right or wrong answer.</p>
            </header>

            <div className="mood-row">
              {moodOptions.map((mood) => (
                <button
                  aria-label={mood.label}
                  aria-pressed={selectedMood === mood.value}
                  className="mood-btn"
                  data-selected={selectedMood === mood.value}
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  type="button"
                >
                  {mood.emoji}
                </button>
              ))}
            </div>

            {selectedMood ? <span className="mood-label">{moodOptions[selectedMood - 1]?.label}</span> : null}

            <label className="field-stack">
              <span>Anything you want to add?</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Write anything on your mind..."
                rows={3}
              />
            </label>

            <button className="primary-action" onClick={() => navigate({ to: '/check-in' })} type="button">
              Start journaling 🌱
            </button>
          </>
        )}
      </div>
    </PhoneShell>
  )
}
