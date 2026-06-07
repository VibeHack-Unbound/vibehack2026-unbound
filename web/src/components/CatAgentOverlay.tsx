import { useCallback, type CSSProperties, useState } from 'react'
import { CHECKIN_QUESTIONS, STRESS_TAGS } from '../lib/checkIn'
import {
  getLatestEntryFromEntries,
  saveJournalEntry,
  useJournalEntries,
} from '../lib/journalStore'
import { buildVoiceDraft, type VoiceDraft } from '../lib/voiceDraft'
import { scoreToTier } from '../lib/tierSystem'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

type Props = {
  onClose: () => void
}

type OverlayMode = 'record' | 'review' | 'saved'

type LangCode =
  | 'en-GB'
  | 'zh-CN'
  | 'ko'
  | 'ar-SA'
  | 'fr-FR'
  | 'es-ES'
  | 'pt-BR'
  | 'hi-IN'

const LANG_OPTIONS: { code: LangCode; label: string }[] = [
  { code: 'en-GB', label: 'english' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'ar-SA', label: 'عربي' },
  { code: 'fr-FR', label: 'français' },
  { code: 'es-ES', label: 'español' },
  { code: 'pt-BR', label: 'português' },
  { code: 'hi-IN', label: 'हिन्दी' },
]

export function CatAgentOverlay({ onClose }: Props) {
  const entries = useJournalEntries()
  const latest = getLatestEntryFromEntries(entries)
  const latestTier = scoreToTier(latest.score)

  const [mode, setMode] = useState<OverlayMode>('record')
  const [draft, setDraft] = useState<VoiceDraft | null>(null)
  const [transcript, setTranscript] = useState('')
  const [selectedStress, setSelectedStress] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedLang, setSelectedLang] = useState<LangCode>('en-GB')

  const appendTranscript = useCallback((text: string) => {
    setTranscript((prev) => [prev, text].filter(Boolean).join(' '))
  }, [])

  const { isListening, isSupported, error, toggleListening } =
    useSpeechRecognition({
      language: selectedLang,
      onTranscript: appendTranscript,
    })

  const allAnswered = CHECKIN_QUESTIONS.every((q) => answers[q.id])
  const canSave = allAnswered && Boolean(draft)
  const reviewTier = draft ? scoreToTier(draft.score) : latestTier
  const needsSupport = draft?.needsSupport || reviewTier === 5

  function resetDraft() {
    setDraft(null)
    setTranscript('')
    setSelectedStress([])
    setAnswers({})
    setMode('record')
  }

  function handleStopAndReview() {
    if (isListening) toggleListening()
    if (!transcript.trim()) return

    const nextDraft = buildVoiceDraft(transcript)
    if (!nextDraft.transcript) {
      resetDraft()
      return
    }

    setDraft(nextDraft)
    setSelectedStress(nextDraft.stressTags)
    setAnswers(nextDraft.checkIn)
    setMode('review')
  }

  function toggleStress(tag: string) {
    setSelectedStress((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    )
  }

  function saveDraft() {
    if (!draft || !canSave) return

    const today = new Date().toISOString().slice(0, 10)
    const score = draft.needsSupport ? Math.min(draft.score, 12) : draft.score
    const tier = scoreToTier(score)

    saveJournalEntry({
      checkIn: {
        ate: answers.ate ?? draft.checkIn.ate,
        energy: answers.energy ?? draft.checkIn.energy,
        sleep: answers.sleep ?? draft.checkIn.sleep,
        social: answers.social ?? draft.checkIn.social,
        focus: answers.focus ?? draft.checkIn.focus,
        overall: answers.overall ?? draft.checkIn.overall,
      },
      date: today,
      score,
      source: 'voice',
      stressTags: selectedStress,
      tier,
      voiceSummary: transcript.trim(),
      voiceTranscript: transcript.trim(),
    })

    setMode('saved')
  }

  return (
    <div className="cat-agent-overlay" onClick={onClose}>
      <div className="cat-agent-panel" onClick={(e) => e.stopPropagation()}>
        <button
          className="cat-agent-close"
          onClick={onClose}
          aria-label="close cat agent"
          type="button"
        >
          ✕
        </button>

        {/* Record mode */}
        {mode === 'record' && (
          <>
            <div className="cat-agent-kicker">voice check-in</div>
            <div className="cat-speech-bubble">
              tell me what today felt like. one messy minute is enough.
            </div>

            <div className="cat-agent-img-wrap">
              <img
                src={`/cats/cat-tier-${latestTier}.webp`}
                alt="cat agent"
                className={`cat-agent-img cat-idle-${latestTier}`}
                width={180}
                height={180}
              />
            </div>

            {/* Language selector */}
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

            <div className="cat-agent-mic-wrap">
              {isListening && (
                <div className="waveform" aria-hidden="true">
                  {[...Array(9)].map((_, i) => (
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
                  ? 'recording... tap to stop'
                  : transcript
                    ? 'tap to record more'
                    : isSupported
                      ? 'tap to start'
                      : error || 'voice not supported in this browser'}
              </span>
            </div>

            {transcript && (
              <div className="cat-agent-transcript">{transcript}</div>
            )}

            {transcript && !isListening && (
              <button
                className="btn-primary"
                onClick={handleStopAndReview}
                type="button"
              >
                done →
              </button>
            )}
          </>
        )}

        {/* Review mode */}
        {mode === 'review' && draft && (
          <>
            <div className="cat-agent-kicker">journal draft</div>
            <div className="cat-speech-bubble">
              i made a draft. change anything before saving it to today.
            </div>

            <div className="voice-review-header">
              <img
                src={`/cats/cat-tier-${reviewTier}.webp`}
                alt="draft mood cat"
                width={88}
                height={88}
              />
              <div>
                <span className={`voice-tier tier-dot-${reviewTier}`}>
                  {reviewTier === 5 ? 'need support' : 'drafted mood'}
                </span>
              </div>
            </div>

            {needsSupport && (
              <div className="voice-support-note">
                this sounds heavy. if you might hurt yourself or feel unsafe,
                call samaritans on 116 123 or text shout to 85258.
              </div>
            )}

            <label className="voice-field">
              <span>transcript</span>
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={5}
              />
            </label>

            <div className="voice-review-block">
              <span className="section-label">stress sources</span>
              <div className="stress-chips-row">
                {STRESS_TAGS.map((tag) => (
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

            <div className="voice-review-block">
              <span className="section-label">check-in</span>
              <div className="checkin-section compact">
                {CHECKIN_QUESTIONS.map(({ id, q, options }) => (
                  <div key={id} className="checkin-question">
                    <p>{q}</p>
                    <div className="answer-chips">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          className={`answer-chip${answers[id] === opt ? ' selected' : ''}`}
                          onClick={() =>
                            setAnswers((current) => ({ ...current, [id]: opt }))
                          }
                          type="button"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="voice-review-actions">
              <button
                className="btn-primary"
                onClick={saveDraft}
                disabled={!canSave}
                type="button"
              >
                save to today
              </button>
              <div className="voice-secondary-actions">
                <button type="button" onClick={resetDraft}>
                  record again
                </button>
                <button type="button" onClick={onClose}>
                  discard
                </button>
              </div>
            </div>
          </>
        )}

        {/* Saved mode */}
        {mode === 'saved' && (
          <>
            <div className="cat-agent-kicker">saved</div>
            <div className="cat-speech-bubble">
              today's voice journal is in your calendar.
            </div>
            <div className="cat-agent-img-wrap">
              <img
                src={`/cats/cat-tier-${reviewTier}.webp`}
                alt="saved mood cat"
                className={`cat-agent-img cat-idle-${reviewTier}`}
                width={180}
                height={180}
              />
            </div>
            <div className="voice-review-actions">
              <button className="btn-primary" onClick={onClose} type="button">
                done
              </button>
              <div className="voice-secondary-actions">
                <button type="button" onClick={resetDraft}>
                  record another
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
