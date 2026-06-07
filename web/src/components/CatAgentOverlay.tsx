import { type CSSProperties, useMemo, useState } from 'react'
import { CHECKIN_QUESTIONS, STRESS_TAGS } from '../lib/checkIn'
import { getLatestEntryFromEntries, saveJournalEntry, useJournalEntries } from '../lib/journalStore'
import { buildVoiceDraft, type VoiceDraft } from '../lib/voiceDraft'
import { scoreToTier } from '../lib/tierSystem'
import { formatDuration, useDictationStream } from '../hooks/useDictationStream'

type Props = {
  onClose: () => void
}

type OverlayMode = 'record' | 'review' | 'saved'

const WAVEFORM_BARS = [
  'low-left',
  'mid-left',
  'high-left',
  'peak-left',
  'center',
  'peak-right',
  'high-right',
  'mid-right',
  'low-right',
]

export function CatAgentOverlay({ onClose }: Props) {
  const entries = useJournalEntries()
  const latest = getLatestEntryFromEntries(entries)
  const latestTier = scoreToTier(latest.score)

  const [mode, setMode] = useState<OverlayMode>('record')
  const [draft, setDraft] = useState<VoiceDraft | null>(null)
  const [summary, setSummary] = useState('')
  const [transcript, setTranscript] = useState('')
  const [selectedStress, setSelectedStress] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [reviewError, setReviewError] = useState<string | null>(null)

  const {
    durationMs,
    error,
    isBusy,
    liveTranscript,
    resetSession,
    rmsValue,
    startRecording,
    status,
    stopRecording,
    transcript: streamTranscript,
  } = useDictationStream()

  const activeTranscript = streamTranscript || liveTranscript
  const rmsPercent = Math.min(100, Math.round(rmsValue * 500))
  const allAnswered = CHECKIN_QUESTIONS.every((q) => answers[q.id])
  const canSave = Boolean(summary.trim()) && allAnswered && Boolean(draft)
  const reviewTier = draft ? scoreToTier(draft.score) : latestTier
  const needsSupport = draft?.needsSupport || reviewTier === 5

  const reviewStatus = useMemo(() => {
    if (status === 'connecting') return 'getting the recorder ready'
    if (status === 'recording') return 'recording your check-in'
    if (status === 'stopping') return 'turning voice into a journal draft'
    if (error) return error
    return 'tap to start'
  }, [error, status])

  function resetDraft() {
    setDraft(null)
    setSummary('')
    setTranscript('')
    setSelectedStress([])
    setAnswers({})
    setReviewError(null)
    resetSession()
    setMode('record')
  }

  function loadDraft(nextDraft: VoiceDraft) {
    setDraft(nextDraft)
    setSummary(nextDraft.summary)
    setTranscript(nextDraft.transcript)
    setSelectedStress(nextDraft.stressTags)
    setAnswers(nextDraft.checkIn)
    setReviewError(null)
    setMode('review')
  }

  async function handleRecordTap() {
    if (status === 'idle') {
      resetDraft()
      await startRecording()
      return
    }

    const result = await stopRecording()
    if (!result || result.status !== 'completed') return

    const nextDraft = buildVoiceDraft(result.transcript)
    if (!nextDraft.transcript) {
      setReviewError("i couldn't catch enough to make a draft. try again.")
      setMode('record')
      return
    }

    loadDraft(nextDraft)
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
      voiceSummary: summary.trim(),
      voiceTranscript: transcript.trim(),
    })

    setMode('saved')
  }

  function handleClose() {
    onClose()
  }

  return (
    <div className="cat-agent-overlay" onClick={handleClose}>
      <div className="cat-agent-panel" onClick={(e) => e.stopPropagation()}>
        <button
          className="cat-agent-close"
          onClick={handleClose}
          aria-label="close cat agent"
          type="button"
        >
          x
        </button>

        {mode === 'record' && (
          <>
            <div className="cat-agent-kicker">voice check-in</div>
            <div className="cat-speech-bubble">
              tell me what today felt like. one messy minute is enough.
            </div>

            <div className="cat-agent-img-wrap voice-orbit">
              <div
                className="voice-level-ring"
                style={
                  {
                    '--voice-level': `${Math.max(10, rmsPercent)}%`,
                  } as CSSProperties
                }
              />
              <img
                src={`/cats/cat-tier-${latestTier}.webp`}
                alt="cat agent"
                className={`cat-agent-img cat-idle-${latestTier}`}
                width={180}
                height={180}
              />
            </div>

            <div className="cat-agent-mic-wrap">
              {isBusy && (
                <div className="waveform" aria-hidden="true">
                  {WAVEFORM_BARS.map((bar) => (
                    <div key={bar} className="waveform-bar" />
                  ))}
                </div>
              )}
              <button
                className={`cat-agent-mic-btn voice-recorder-btn${isBusy ? ' recording' : ''}`}
                onClick={() => void handleRecordTap()}
                disabled={status === 'connecting' || status === 'stopping'}
                aria-label={isBusy ? 'stop recording' : 'start recording'}
                type="button"
              >
                <span className="voice-recorder-icon" />
              </button>
              <span className="cat-agent-status">
                {reviewStatus} · {formatDuration(durationMs)}
              </span>
            </div>

            {(activeTranscript || isBusy || reviewError || error) && (
              <div className="cat-agent-transcript live">
                {activeTranscript ? (
                  activeTranscript
                ) : reviewError || error ? (
                  <span>{reviewError || error}</span>
                ) : (
                  <span className="muted-italic">listening...</span>
                )}
              </div>
            )}
          </>
        )}

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
                <span className="voice-score">{draft.score}/100</span>
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
              <span>summary</span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={4}
              />
            </label>

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
                            setAnswers((current) => ({
                              ...current,
                              [id]: opt,
                            }))
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
                <button type="button" onClick={handleClose}>
                  discard
                </button>
              </div>
            </div>
          </>
        )}

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
            <div className="voice-saved-card">
              <span>{formatDuration(durationMs)}</span>
              <p>{summary}</p>
            </div>
            <div className="voice-review-actions">
              <button className="btn-primary" onClick={handleClose} type="button">
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
