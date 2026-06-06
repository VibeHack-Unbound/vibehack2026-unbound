import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { BottomNav } from '../components/BottomNav'
import { PhoneShell } from '../components/PhoneShell'
import { useSpeechRecognition } from '../features/useSpeechRecognition'

const moodOptions = [
  { emoji: '😔', value: 1, label: 'Very sad' },
  { emoji: '😕', value: 2, label: 'Sad' },
  { emoji: '😐', value: 3, label: 'Neutral' },
  { emoji: '🙂', value: 4, label: 'Good' },
  { emoji: '😊', value: 5, label: 'Great' },
]

const checklistItems = [
  { icon: '🍽️', key: 'ate', label: 'Did you eat today?' },
  { icon: '🌤️', key: 'outside', label: 'Did you go outside?' },
  { icon: '🏃', key: 'movement', label: 'Did you move your body?' },
  { icon: '💬', key: 'social', label: 'Did you talk to someone?' },
]

const stressChips = [
  'Work',
  'Study',
  'Money',
  'Loneliness',
  'Health',
  'Relationship',
  'Other',
]

export const Route = createFileRoute('/check-in')({
  component: CheckInPage,
})

function CheckInPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'quick' | 'write'>('quick')
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState(5)
  const [anxiety, setAnxiety] = useState(5)
  const [sleep, setSleep] = useState(5)
  const [journal, setJournal] = useState('')
  const [positiveNote, setPositiveNote] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [selectedStress, setSelectedStress] = useState<string[]>([])

  const appendTranscript = useCallback((text: string) => {
    setJournal((current) => [current, text].filter(Boolean).join(' '))
  }, [])

  const { error, isListening, isSupported, toggleListening } = useSpeechRecognition({
    language: 'en-GB',
    onTranscript: appendTranscript,
  })

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  })

  return (
    <PhoneShell withNav>
      <div className="screen checkin-screen">
        <header className="page-copy">
          <p className="date-line">{today}</p>
          <h1>Good morning, Alex 👋</h1>
        </header>

        <p className="section-question">How are you feeling today?</p>

        <div className="segmented-tabs" role="tablist">
          <button
            aria-selected={activeTab === 'quick'}
            data-active={activeTab === 'quick'}
            onClick={() => setActiveTab('quick')}
            role="tab"
            type="button"
          >
            Quick
          </button>
          <button
            aria-selected={activeTab === 'write'}
            data-active={activeTab === 'write'}
            onClick={() => setActiveTab('write')}
            role="tab"
            type="button"
          >
            Write
          </button>
        </div>

        {activeTab === 'quick' ? (
          <section className="quick-panel page-enter">
            <div className="mood-row compact">
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

            <div className="slider-list">
              <MoodSlider color="#5B9FD8" label="Energy" value={energy} onChange={setEnergy} />
              <MoodSlider color="#D9C9E8" label="Anxiety" value={anxiety} onChange={setAnxiety} />
              <MoodSlider color="#F5C5D1" label="Sleep" value={sleep} onChange={setSleep} />
            </div>
          </section>
        ) : (
          <section className="write-panel page-enter">
            <div className="journal-toolbar">
              <span>Voice journal</span>
              <button
                aria-pressed={isListening}
                className="mic-pill"
                data-listening={isListening}
                onClick={toggleListening}
                type="button"
              >
                {isListening ? 'Stop' : 'Mic'}
              </button>
            </div>
            <textarea
              value={journal}
              onChange={(event) => setJournal(event.target.value)}
              placeholder="What's on your mind today? Write as much or as little as you like."
              rows={7}
            />
            <p className="quiet-note">
              {isListening
                ? 'Listening now. Your words will appear here phrase by phrase.'
                : isSupported
                  ? 'Tap Mic to speak, then edit the text freely.'
                  : 'Voice input is not available in this browser.'}
            </p>
            {error ? <p className="quiet-note">Speech input status: {error}</p> : null}
          </section>
        )}

        <div className="soft-divider" />

        <section className="check-list">
          <h2>Today&apos;s check-in</h2>
          {checklistItems.map((item) => {
            const isChecked = Boolean(checked[item.key])

            return (
              <button
                aria-pressed={isChecked}
                className="check-item"
                data-checked={isChecked}
                key={item.key}
                onClick={() => setChecked((current) => ({ ...current, [item.key]: !current[item.key] }))}
                type="button"
              >
                <span>{item.icon}</span>
                <strong>{item.label}</strong>
                <i>{isChecked ? '✓' : ''}</i>
              </button>
            )
          })}
        </section>

        <section className="chip-section">
          <h2>Main stress source today</h2>
          <div>
            {stressChips.map((chip) => {
              const isSelected = selectedStress.includes(chip)

              return (
                <button
                  aria-pressed={isSelected}
                  className="stress-chip"
                  data-selected={isSelected}
                  key={chip}
                  onClick={() =>
                    setSelectedStress((current) =>
                      current.includes(chip)
                        ? current.filter((value) => value !== chip)
                        : [...current, chip],
                    )
                  }
                  type="button"
                >
                  {chip}
                </button>
              )
            })}
          </div>
        </section>

        <label className="field-stack">
          <span>One positive moment ✨</span>
          <textarea
            value={positiveNote}
            onChange={(event) => setPositiveNote(event.target.value)}
            placeholder="Something small that was okay today..."
            rows={2}
          />
        </label>

        <button className="primary-action" onClick={() => navigate({ to: '/dashboard' })} type="button">
          Save today 🌱
        </button>
      </div>
      <BottomNav />
    </PhoneShell>
  )
}

function MoodSlider({
  color,
  label,
  onChange,
  value,
}: {
  color: string
  label: string
  onChange: (value: number) => void
  value: number
}) {
  const progress = ((value - 1) / 9) * 100

  return (
    <label className="mood-slider">
      <span>
        {label}
        <strong style={{ color }}>{value}/10</strong>
      </span>
      <input
        max="10"
        min="1"
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ background: `linear-gradient(to right, ${color} 0%, ${color} ${progress}%, #E8E3D8 ${progress}%)` }}
        type="range"
        value={value}
      />
    </label>
  )
}
