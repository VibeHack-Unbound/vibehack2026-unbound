import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { PhoneShell } from '../components/PhoneShell'

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
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [note, setNote] = useState('')

  return (
    <PhoneShell>
      <div className="screen onboarding-screen">
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
      </div>
    </PhoneShell>
  )
}
