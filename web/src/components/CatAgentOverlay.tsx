import { useCallback, useState } from 'react'
import { getLatestEntry } from '../lib/meiData'
import { scoreToTier } from '../lib/tierSystem'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

type Props = {
  onClose: () => void
}

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

  const [transcript, setTranscript] = useState('')
  const [selectedLang, setSelectedLang] = useState('en-GB')

  const appendTranscript = useCallback((text: string) => {
    setTranscript((prev) => [prev, text].filter(Boolean).join(' '))
  }, [])

  const { isListening, isSupported, error, toggleListening } =
    useSpeechRecognition({
      language: selectedLang,
      onTranscript: appendTranscript,
    })

  return (
    <div className="cat-agent-overlay" onClick={onClose}>
      <div className="cat-agent-panel" onClick={(e) => e.stopPropagation()}>
        {/* 닫기 버튼 */}
        <button
          className="cat-agent-close"
          onClick={onClose}
          aria-label="close cat agent"
          type="button"
        >
          ✕
        </button>

        {/* 말풍선 */}
        <div className="cat-speech-bubble">
          tell me about your day. how are you feeling? what has been on your
          mind?
        </div>

        {/* 고양이 이미지 */}
        <div className="cat-agent-img-wrap">
          <img
            src={`/cats/cat-tier-${tier}.webp`}
            alt="cat agent"
            className={`cat-agent-img cat-idle-${tier}`}
            width={180}
            height={180}
          />
        </div>

        {/* 언어 선택 */}
        <div className="cat-agent-langs">
          {LANG_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              className={`cat-lang-btn${selectedLang === lang.code ? ' active' : ''}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* 마이크 버튼 */}
        <div className="cat-agent-mic-wrap">
          {isListening && (
            <div className="waveform">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="waveform-bar" />
              ))}
            </div>
          )}
          <button
            className={`cat-agent-mic-btn${isListening ? ' recording' : ''}`}
            onClick={toggleListening}
            aria-label={isListening ? 'stop recording' : 'start recording'}
            type="button"
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
          <span className="cat-agent-status">
            {isListening
              ? 'recording...'
              : transcript
                ? 'tap to record again'
                : isSupported
                  ? 'tap to record'
                  : error || 'voice not supported in this browser'}
          </span>
        </div>

        {/* 텍스트 */}
        {(transcript || isListening) && (
          <div className="cat-agent-transcript">
            {transcript || (
              <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                listening…
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
