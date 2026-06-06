import { useState, useRef, useEffect } from 'react'
import { CatIllustration } from './CatIllustration'
import { getLatestEntry } from '../lib/meiData'
import { scoreToTier } from '../lib/tierSystem'

type Props = {
  onClose: () => void
}

// Languages supported by Web Speech API (covers most of Unbound's target users)
const LANG_OPTIONS = [
  { code: 'en-GB', label: 'english' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'ar-SA', label: 'عربي' },
  { code: 'fr-FR', label: 'français' },
  { code: 'es-ES', label: 'español' },
  { code: 'pt-BR', label: 'português' },
  { code: 'hi-IN', label: 'हिन्दी' },
]

export function CatAgentOverlay({ onClose }: Props) {
  const latest = getLatestEntry()
  const tier = scoreToTier(latest.score)

  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [selectedLang, setSelectedLang] = useState('en-GB')
  const [speechSupported, setSpeechSupported] = useState(true)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    const SR = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) setSpeechSupported(false)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) recognitionRef.current.abort()
    }
  }, [])

  function startRecording() {
    setIsRecording(true)
    setTranscript('')
    setInterimText('')
    setTimer(0)

    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)

    const SR = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = selectedLang

    let finalText = ''
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setTranscript(finalText)
      setInterimText(interim)
    }
    recognition.onerror = () => { /* silently handle */ }
    recognition.start()
    recognitionRef.current = recognition
  }

  function stopRecording() {
    setIsRecording(false)
    setInterimText('')
    if (timerRef.current) clearInterval(timerRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    // Demo fallback if no transcript captured
    if (!transcript) {
      setTranscript('today was a bit overwhelming. i had a lot on my mind with the upcoming deadlines, but i managed to get some fresh air which helped.')
    }
  }

  function formatTimer(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  }

  const displayText = transcript + (interimText ? interimText : '')

  return (
    <div className="cat-agent-overlay" onClick={onClose}>
      <div className="cat-agent-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="cat-agent-close" onClick={onClose} aria-label="close cat agent">✕</button>

        {/* Cat + speech bubble */}
        <div className="cat-agent-cat-wrap">
          <div className="cat-speech-bubble">
            tell me about your day. how are you feeling? what has been on your mind?
          </div>
          <CatIllustration tier={tier} size={160} className={`cat-tier-${tier}`} />
        </div>

        {/* Language selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {LANG_OPTIONS.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              style={{
                padding: '4px 10px',
                borderRadius: 50,
                fontSize: '0.72rem',
                fontWeight: 700,
                background: selectedLang === lang.code ? 'var(--blue)' : 'var(--input)',
                color: selectedLang === lang.code ? 'white' : 'var(--muted)',
                border: 0,
                cursor: 'pointer',
                transition: 'background 140ms, color 140ms',
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Mic button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {isRecording && (
            <div className="waveform">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="waveform-bar" style={{ height: `${8 + Math.random() * 14}px` }} />
              ))}
            </div>
          )}
          <button
            className={`cat-agent-mic-btn${isRecording ? ' recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? 'stop recording' : 'start recording'}
            type="button"
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          <span className="cat-agent-status">
            {isRecording
              ? `recording... ${formatTimer(timer)}`
              : displayText
                ? 'tap to record again'
                : speechSupported
                  ? 'tap to start recording'
                  : 'voice not supported in this browser'}
          </span>
        </div>

        {/* Real-time transcript */}
        {(displayText || isRecording) && (
          <div className="cat-agent-transcript">
            {displayText || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>listening…</span>}
          </div>
        )}

        <p className="cat-agent-lang-note">
          speak in any language — korean, english, chinese, arabic and more
        </p>
      </div>
    </div>
  )
}
