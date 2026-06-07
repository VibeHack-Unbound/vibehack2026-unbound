import { describe, expect, it } from 'vitest'
import { buildVoiceDraft, containsCrisisLanguage } from './voiceDraft'

describe('buildVoiceDraft', () => {
  it('returns a neutral empty draft for empty transcripts', () => {
    const draft = buildVoiceDraft('   ')

    expect(draft.transcript).toBe('')
    expect(draft.summary).toBe('')
    expect(draft.stressTags).toEqual([])
    expect(draft.score).toBe(50)
    expect(draft.needsSupport).toBe(false)
  })

  it('infers stress tags and low check-in answers from difficult days', () => {
    const draft = buildVoiceDraft(
      'I could not sleep and skipped meals. Exams are close and I felt overwhelmed and blank all afternoon.',
    )

    expect(draft.stressTags).toContain('exams')
    expect(draft.checkIn.ate).toBe('nothing')
    expect(draft.checkIn.sleep).toBe('very poor (under 4hrs)')
    expect(draft.checkIn.focus).toBe('completely blank')
    expect(draft.checkIn.overall).toBe('very hard')
    expect(draft.score).toBeLessThan(40)
  })

  it('recognizes stabilizing signals on better days', () => {
    const draft = buildVoiceDraft(
      'I slept well for 8 hours, cooked dinner, met a friend, and got work done. I feel hopeful and good.',
    )

    expect(draft.checkIn.ate).toBe('at least 2 meals')
    expect(draft.checkIn.sleep).toBe('good (7hrs+)')
    expect(draft.checkIn.social).toBe('had a real conversation')
    expect(draft.checkIn.focus).toBe('fully focused')
    expect(draft.score).toBeGreaterThan(70)
  })

  it('biases crisis language to the support tier', () => {
    const transcript = "I don't want to be alive and I want to hurt myself."
    const draft = buildVoiceDraft(transcript)

    expect(containsCrisisLanguage(transcript)).toBe(true)
    expect(draft.needsSupport).toBe(true)
    expect(draft.tier).toBe(5)
    expect(draft.score).toBeLessThanOrEqual(12)
    expect(draft.checkIn.overall).toBe('very hard')
  })

  it('falls back to other when no known stress tag matches', () => {
    const draft = buildVoiceDraft('Everything felt strange and hard to explain.')

    expect(draft.stressTags).toEqual(['other'])
    expect(draft.summary).toMatch(/^you mentioned /)
  })
})
