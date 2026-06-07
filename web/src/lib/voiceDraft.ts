import { DEFAULT_CHECKIN, STRESS_TAGS } from './checkIn'
import type { DayEntry } from './meiData'
import { scoreToTier, type Tier } from './tierSystem'

export type VoiceDraft = {
  checkIn: DayEntry['checkIn']
  needsSupport: boolean
  score: number
  stressTags: string[]
  summary: string
  tier: Tier
  transcript: string
}

type KeywordTag = {
  tag: (typeof STRESS_TAGS)[number]
  words: string[]
}

const keywordTags: KeywordTag[] = [
  {
    tag: 'exams',
    words: ['exam', 'revision', 'deadline', 'coursework', 'grade', 'study'],
  },
  {
    tag: 'relationships',
    words: ['partner', 'breakup', 'date', 'relationship', 'argument'],
  },
  {
    tag: 'family',
    words: ['family', 'mum', 'mom', 'dad', 'parent', 'home', 'homesick'],
  },
  {
    tag: 'money',
    words: ['money', 'rent', 'bills', 'tuition', 'debt', 'job', 'afford'],
  },
  {
    tag: 'loneliness',
    words: ['lonely', 'alone', 'isolated', 'miss my friends', 'no one'],
  },
  {
    tag: 'health',
    words: ['sick', 'ill', 'pain', 'panic', 'anxious', 'anxiety', 'doctor'],
  },
  {
    tag: 'work',
    words: ['work', 'shift', 'manager', 'boss', 'meeting', 'project'],
  },
]

const crisisPhrases = [
  'kill myself',
  'suicide',
  'suicidal',
  'self harm',
  'hurt myself',
  'end my life',
  'want to die',
  'do not want to be alive',
  "don't want to be alive",
]

const severeWords = [
  'hopeless',
  'worthless',
  'failing',
  'failed',
  'overwhelmed',
  'panic',
  'scared',
  'terrified',
  'desperate',
]

const lowWords = [
  'sad',
  'stressed',
  'tired',
  'exhausted',
  'lonely',
  'anxious',
  'worried',
  'blank',
  'hard',
  'cry',
  'cried',
]

const positiveWords = [
  'good',
  'better',
  'okay',
  'calm',
  'hopeful',
  'focused',
  'walk',
  'friend',
  'slept',
  'cooked',
]

const includesAny = (text: string, words: string[]) =>
  words.some((word) => text.includes(word))

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const countMatches = (text: string, words: string[]) =>
  words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0)

const sentenceCase = (text: string) => {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
}

const truncate = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  const clipped = text.slice(0, maxLength - 1)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : clipped.length)}...`
}

export function containsCrisisLanguage(transcript: string) {
  const text = transcript.toLowerCase()
  return crisisPhrases.some((phrase) => text.includes(phrase))
}

export function summarizeTranscript(transcript: string) {
  const cleaned = transcript.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''

  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) ?? [cleaned]
  const compact = sentences.slice(0, 2).join(' ').trim()
  const summary = truncate(compact, 240)
  const punctuated = /[.!?]$/.test(summary) ? summary : `${summary}.`

  return `you mentioned ${sentenceCase(punctuated)}`
}

export function buildVoiceDraft(transcript: string): VoiceDraft {
  const cleanedTranscript = transcript.replace(/\s+/g, ' ').trim()
  const text = cleanedTranscript.toLowerCase()
  const needsSupport = containsCrisisLanguage(text)
  const stressTags = keywordTags
    .filter(({ words }) => includesAny(text, words))
    .map(({ tag }) => tag)

  if (cleanedTranscript && stressTags.length === 0) {
    stressTags.push('other')
  }

  const checkIn: DayEntry['checkIn'] = { ...DEFAULT_CHECKIN }

  if (includesAny(text, ['nothing', 'skipped meal', 'did not eat', 'no food'])) {
    checkIn.ate = 'nothing'
  } else if (includesAny(text, ['snack', 'snacked', 'crisps'])) {
    checkIn.ate = 'snacked only'
  } else if (
    includesAny(text, ['ate', 'breakfast', 'lunch', 'dinner', 'cooked', 'meal'])
  ) {
    checkIn.ate = 'at least 2 meals'
  }

  if (includesAny(text, ['stuck in bed', 'cannot get up', "can't get up"])) {
    checkIn.energy = 'stuck in bed'
  } else if (includesAny(text, ['exhausted', 'drained', 'no energy'])) {
    checkIn.energy = 'getting by'
  } else if (includesAny(text, ['energised', 'energized', 'feeling good'])) {
    checkIn.energy = 'feeling good'
  } else if (includesAny(text, ['normal energy', 'fine energy'])) {
    checkIn.energy = 'normal'
  }

  if (
    includesAny(text, ['no sleep', 'could not sleep', "couldn't sleep", 'insomnia'])
  ) {
    checkIn.sleep = 'very poor (under 4hrs)'
  } else if (includesAny(text, ['slept okay', '4 hours', '5 hours', '6 hours'])) {
    checkIn.sleep = 'okay (4-6hrs)'
  } else if (
    includesAny(text, ['slept well', 'good sleep', '7 hours', '8 hours'])
  ) {
    checkIn.sleep = 'good (7hrs+)'
  }

  if (includesAny(text, ['no one', 'alone all day', 'no contact'])) {
    checkIn.social = 'no contact'
  } else if (includesAny(text, ['messaged', 'texted', 'brief chat'])) {
    checkIn.social = 'brief interaction'
  } else if (
    includesAny(text, ['called', 'talked to', 'conversation', 'met a friend'])
  ) {
    checkIn.social = 'had a real conversation'
  }

  if (includesAny(text, ['blank', 'could not focus', "couldn't focus"])) {
    checkIn.focus = 'completely blank'
  } else if (includesAny(text, ['focused', 'productive', 'got work done'])) {
    checkIn.focus = 'fully focused'
  } else if (includesAny(text, ['some focus', 'a bit of focus'])) {
    checkIn.focus = 'some focus'
  }

  if (needsSupport || includesAny(text, severeWords)) {
    checkIn.overall = 'very hard'
  } else if (includesAny(text, ['hard', 'stress', 'stressed', 'anxious'])) {
    checkIn.overall = 'hard'
  } else if (includesAny(text, ['really good', 'great', 'amazing'])) {
    checkIn.overall = 'really good'
  } else if (includesAny(text, ['good', 'better', 'hopeful'])) {
    checkIn.overall = 'good'
  }

  let score = 62
  score -= countMatches(text, severeWords) * 12
  score -= countMatches(text, lowWords) * 6
  score += countMatches(text, positiveWords) * 5

  if (checkIn.ate === 'nothing') score -= 10
  if (checkIn.sleep === 'very poor (under 4hrs)') score -= 12
  if (checkIn.social === 'no contact') score -= 7
  if (checkIn.focus === 'completely blank') score -= 8
  if (checkIn.overall === 'hard') score -= 8
  if (checkIn.overall === 'very hard') score -= 18
  if (checkIn.overall === 'good') score += 8
  if (checkIn.overall === 'really good') score += 16
  if (checkIn.ate === 'at least 2 meals') score += 4
  if (checkIn.sleep === 'good (7hrs+)') score += 7
  if (checkIn.social === 'had a real conversation') score += 6

  score = needsSupport ? Math.min(score, 12) : score
  score = cleanedTranscript ? clamp(Math.round(score), 5, 95) : 50

  return {
    checkIn,
    needsSupport,
    score,
    stressTags,
    summary: summarizeTranscript(cleanedTranscript),
    tier: scoreToTier(score),
    transcript: cleanedTranscript,
  }
}
