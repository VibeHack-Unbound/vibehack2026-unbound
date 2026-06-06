import { useState, useRef, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { CatIllustration } from '../components/CatIllustration'
import { PhoneShell } from '../components/PhoneShell'
import { getLatestEntry } from '../lib/meiData'
import { scoreToTier } from '../lib/tierSystem'

export const Route = createFileRoute('/today')({
  component: TodayPage,
})

const CHECKIN_QUESTIONS = [
  {
    id: 'ate',
    q: 'did you eat today?',
    options: ['nothing', 'snacked only', 'at least 2 meals'],
  },
  {
    id: 'energy',
    q: 'how is your energy right now?',
    options: ['stuck in bed', 'getting by', 'normal', 'feeling good'],
  },
  {
    id: 'sleep',
    q: 'how did you sleep last night?',
    options: ['very poor (under 4hrs)', 'okay (4–6hrs)', 'good (7hrs+)'],
  },
  {
    id: 'social',
    q: 'did you connect with anyone today?',
    options: ['no contact', 'brief interaction', 'had a real conversation'],
  },
  {
    id: 'focus',
    q: 'could you focus on anything today?',
    options: ['completely blank', 'some focus', 'fully focused'],
  },
  {
    id: 'overall',
    q: 'how would you describe today overall?',
    options: ['very hard', 'hard', 'okay', 'good', 'really good'],
  },
]

const STRESS_TAGS = ['exams', 'family', 'loneliness', 'money', 'health', 'other']

type NativeSpeechRecognition = InstanceType<NonNullable<Window['SpeechRecognition']>>

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

function TodayPage() {
  const navigate = useNavigate()
  const latest = getLatestEntry()
  const tier = scoreToTier(latest.score)

  const [isRecording, setIsRecording] = useState(false)
  const [timer, setTimer] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [selectedStress, setSelectedStress] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<NativeSpeechRecognition | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  function startRecording() {
    setIsRecording(true)
    setTimer(0)
    setTranscript('')
    setKeywords([])

    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)

    // Use Web Speech API if available
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US' // fallback; in production would use user's language

      let finalTranscript = ''
      recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          } else {
            interim += event.results[i][0].transcript
          }
        }
        setTranscript(finalTranscript + interim)
      }

      recognition.onerror = () => {
        // Silently handle – demo mode
      }

      recognition.start()
      recognitionRef.current = recognition
    }
  }

  function stopRecording() {
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    // Extract simple keywords from transcript (demo logic)
    if (transcript) {
      const kws: string[] = []
      const lower = transcript.toLowerCase()
      if (lower.includes('exam') || lower.includes('study')) kws.push('exams')
      if (lower.includes('tired') || lower.includes('exhausted')) kws.push('tired')
      if (lower.includes('lonely') || lower.includes('alone')) kws.push('lonely')
      if (lower.includes('stress') || lower.includes('anxious')) kws.push('stressed')
      if (lower.includes('happy') || lower.includes('good')) kws.push('positive')
      setKeywords(kws.length > 0 ? kws : ['recorded'])
    } else {
      // Demo: show placeholder
      setTranscript('today was a bit overwhelming. i had a lot on my mind with the upcoming deadlines, but i managed to get some fresh air which helped.')
      setKeywords(['exams', 'tired', 'outdoors'])
    }
  }

  function formatTimer(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  }

  function toggleStress(tag: string) {
    setSelectedStress(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function setAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function handleSubmit() {
    setCelebrating(true)
    setTimeout(() => {
      setSubmitted(true)
      setTimeout(() => navigate({ to: '/dashboard' }), 800)
    }, 900)
  }

  const allAnswered = CHECKIN_QUESTIONS.every(q => answers[q.id])

  return (
    <PhoneShell withNav>
      <div className="screen today-screen page-enter">
        {/* Cat + speech bubble */}
        <div className="today-cat-wrap">
          <div className="today-speech-bubble">
            tell me about your day. how are you feeling? what has been on your mind?
          </div>
          <CatIllustration tier={tier} size={140} className={celebrating ? 'cat-celebrate' : ''} />
          <p className="today-subtext">speak in any language. 30 to 60 seconds.</p>
        </div>

        {/* Record button */}
        <div className="record-btn-wrap">
          {isRecording && (
            <div className="waveform">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="waveform-bar" style={{ height: `${8 + Math.random() * 14}px` }} />
              ))}
            </div>
          )}
          <button
            className={`record-btn${isRecording ? ' recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? 'stop recording' : 'start recording'}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </button>
          {isRecording && (
            <span className="record-timer">{formatTimer(timer)}</span>
          )}
          {!isRecording && !transcript && (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
              tap to record
            </span>
          )}
        </div>

        {/* Transcript */}
        {transcript && !isRecording && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="section-label">transcript</span>
            <div className="transcript-box">{transcript}</div>
            {keywords.length > 0 && (
              <p className="keyword-summary">we heard: {keywords.join(', ')}</p>
            )}
          </div>
        )}

        {/* Stress tags */}
        {transcript && !isRecording && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="section-label">stress sources — confirm or adjust</span>
            <div className="stress-chips-row">
              {STRESS_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`stress-chip-btn${selectedStress.includes(tag) ? ' selected' : ''}`}
                  onClick={() => toggleStress(tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="soft-divider" />

        {/* Check-in questions */}
        <div className="checkin-section">
          <h2>a few quick questions</h2>
          {CHECKIN_QUESTIONS.map(({ id, q, options }) => (
            <div key={id} className="checkin-question">
              <p>{q}</p>
              <div className="answer-chips">
                {options.map(opt => (
                  <button
                    key={opt}
                    className={`answer-chip${answers[id] === opt ? ' selected' : ''}`}
                    onClick={() => setAnswer(id, opt)}
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!allAnswered || submitted}
          type="button"
          style={{ opacity: allAnswered ? 1 : 0.5 }}
        >
          {submitted ? '✓ saved!' : 'save today\'s entry'}
        </button>
      </div>
      <BottomNav />
    </PhoneShell>
  )
}
